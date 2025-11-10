import React, { useEffect, useMemo, useState } from 'react'
import { ArrowUp, MessageSquare, Plus, Filter, Clock } from 'lucide-react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || ''

function Badge({ children }) {
  return (
    <span className="px-2.5 py-1 rounded-full text-xs bg-slate-800/70 border border-slate-700 text-sky-300">
      {children}
    </span>
  )
}

function IdeaCard({ idea, onUpvote, onOpen }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
      <div className="flex items-start gap-4">
        <button onClick={() => onUpvote(idea)} className="flex flex-col items-center rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-2 hover:bg-slate-800">
          <ArrowUp className="w-4 h-4" />
          <span className="text-sm mt-1 font-semibold">{idea.votes || 0}</span>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold truncate">{idea.title}</h3>
            <span className="text-xs text-slate-400">{new Date(idea.created_at || Date.now()).toLocaleDateString()}</span>
          </div>
          <p className="text-slate-300 mt-1 line-clamp-2">{idea.description}</p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {(idea.tags || []).map(t => <Badge key={t}>{t}</Badge>)}
          </div>
          <div className="flex items-center gap-4 mt-4 text-slate-400 text-sm">
            <button onClick={() => onOpen(idea)} className="inline-flex items-center gap-1 hover:text-slate-200">
              <MessageSquare className="w-4 h-4" /> {idea.comments || 0} comments
            </button>
            {idea.author && <span>by <span className="text-slate-200">{idea.author}</span></span>}
            {idea.link && <a className="text-sky-300 hover:underline" href={idea.link} target="_blank" rel="noreferrer">link</a>}
          </div>
        </div>
      </div>
    </div>
  )
}

function NewIdeaModal({ open, onClose, onCreate }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [author, setAuthor] = useState('')
  const [link, setLink] = useState('')
  const [tags, setTags] = useState('')

  if (!open) return null

  const submit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return
    const payload = {
      title, description,
      author: author || undefined,
      link: link || undefined,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
    }
    await onCreate(payload)
    setTitle(''); setDescription(''); setAuthor(''); setLink(''); setTags('')
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold">Post a new idea</h2>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Idea title" className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 outline-none focus:border-sky-500" />
          <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Short description" rows={4} className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 outline-none focus:border-sky-500" />
          <div className="grid grid-cols-2 gap-3">
            <input value={author} onChange={e=>setAuthor(e.target.value)} placeholder="Your name (optional)" className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 outline-none focus:border-sky-500" />
            <input value={link} onChange={e=>setLink(e.target.value)} placeholder="Link (optional)" className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 outline-none focus:border-sky-500" />
          </div>
          <input value={tags} onChange={e=>setTags(e.target.value)} placeholder="Tags comma separated (e.g., AI, Productivity)" className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 outline-none focus:border-sky-500" />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-900">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white">Post</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState('all')
  const [sort, setSort] = useState('votes')
  const [modalOpen, setModalOpen] = useState(false)
  const [active, setActive] = useState(null)

  const fetchIdeas = async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (period !== 'all') params.set('period', period)
      if (sort) params.set('sort', sort)
      const res = await fetch(`${API_BASE}/api/ideas?${params.toString()}`)
      const data = await res.json()
      setIdeas(data)
    } catch (e) {
      setError('Failed to load ideas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchIdeas() }, [period, sort])

  const upvote = async (idea) => {
    await fetch(`${API_BASE}/api/votes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id: idea.id })
    })
    fetchIdeas()
  }

  const createIdea = async (payload) => {
    await fetch(`${API_BASE}/api/ideas`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    setModalOpen(false)
    fetchIdeas()
  }

  const addComment = async (ideaId, content, author) => {
    await fetch(`${API_BASE}/api/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id: ideaId, content, author })
    })
    fetchIdeas()
  }

  return (
    <div>
      <header className="border-b border-slate-800/60 sticky top-0 z-10 backdrop-blur-sm bg-slate-950/70">
        <div className="container px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold">Vibe Hunt</span>
            <span className="text-slate-400 hidden sm:inline">Discover and upvote the best app ideas</span>
          </div>
          <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white">
            <Plus className="w-4 h-4"/> New Idea
          </button>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Filter</span>
            <div className="flex rounded-lg border border-slate-800 overflow-hidden">
              {['all','week','month'].map(p => (
                <button key={p} onClick={()=>setPeriod(p)} className={`px-3 py-1.5 text-sm ${period===p? 'bg-slate-800 text-sky-300':'text-slate-300 hover:bg-slate-800/70'}`}>{p==='all'?'All time': p==='week'?'This week':'This month'}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Sort by</span>
            <div className="flex rounded-lg border border-slate-800 overflow-hidden">
              {['votes','comments'].map(s => (
                <button key={s} onClick={()=>setSort(s)} className={`px-3 py-1.5 text-sm ${sort===s? 'bg-slate-800 text-sky-300':'text-slate-300 hover:bg-slate-800/70'}`}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        {loading && <div className="text-slate-400">Loading ideas...</div>}
        {error && <div className="text-red-400">{error}</div>}

        <div className="grid gap-4">
          {ideas.map(idea => (
            <IdeaCard key={idea.id} idea={idea} onUpvote={upvote} onOpen={setActive} />
          ))}
        </div>
      </main>

      <NewIdeaModal open={modalOpen} onClose={()=>setModalOpen(false)} onCreate={createIdea} />

      {active && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={()=>setActive(null)}>
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-xl p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{active.title}</h2>
                <p className="text-slate-300 mt-1">{active.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">{(active.tags||[]).map(t=> <Badge key={t}>{t}</Badge>)}</div>
              </div>
              <button onClick={()=>setActive(null)} className="px-2 py-1 rounded-lg border border-slate-700 hover:bg-slate-900">Close</button>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <button onClick={()=>upvote(active)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700">
                <ArrowUp className="w-4 h-4"/> Upvote ({active.votes || 0})
              </button>
              {active.link && <a className="text-sky-300 hover:underline" href={active.link} target="_blank" rel="noreferrer">Visit link</a>}
            </div>

            <Comments ideaId={active.id} onAdd={addComment} />
          </div>
        </div>
      )}
    </div>
  )
}

function Comments({ ideaId, onAdd }) {
  const [list, setList] = useState([])
  const [content, setContent] = useState('')
  const [author, setAuthor] = useState('')

  const load = async () => {
    const res = await fetch(`${API_BASE}/api/ideas/${ideaId}`)
    const data = await res.json()
    setList(data.comments_list || [])
  }
  useEffect(() => { load() }, [ideaId])

  const submit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    await onAdd(ideaId, content, author)
    setContent(''); setAuthor('')
    load()
  }

  return (
    <div className="mt-6">
      <h3 className="font-semibold">Comments</h3>
      <form onSubmit={submit} className="flex items-center gap-2 mt-3">
        <input value={author} onChange={e=>setAuthor(e.target.value)} placeholder="Name (optional)" className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 outline-none focus:border-sky-500" />
        <input value={content} onChange={e=>setContent(e.target.value)} placeholder="Write a comment" className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 outline-none focus:border-sky-500" />
        <button className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white">Post</button>
      </form>
      <div className="mt-4 space-y-3">
        {list.map(c => (
          <div key={c.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-sm text-slate-400">{c.author || 'Anonymous'} • {new Date(c.created_at || Date.now()).toLocaleString()}</div>
            <div className="mt-1">{c.content}</div>
          </div>
        ))}
        {list.length===0 && <div className="text-slate-500">No comments yet. Be the first!</div>}
      </div>
    </div>
  )
}
