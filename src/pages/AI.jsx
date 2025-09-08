import { useEffect, useMemo, useRef, useState } from 'react';
import Nav from '../layouts/Nav';
import { useOptions } from '/src/utils/optionsContext';
import clsx from 'clsx';
import theme from '../styles/theming.module.css';
import { LucideSearch, Plus, ChevronLeft, ChevronRight, Pencil, Trash2, Paperclip, Wand2, X } from 'lucide-react';
import { AI_MODELS, DEFAULT_AI_MODEL } from '../data/models';
import { AI_CONFIG, UI_ID_TO_CATEGORY } from '../data/aiConfig';
import ModelDropdown from '../components/ModelDropdown';
import '../styles/ai-animations.css';
import '../styles/markdown.css';
import Markdown from '../components/Markdown';
import SourcesBar from '../components/SourcesBar';

const Message = ({ role, content, thinking, inProgress, attachments, sources, onCopy, onRetry, canRetry, loading, idx }) => {
  // Swap sides: user on right, assistant on left
  const align = role === 'user' ? 'items-end' : 'items-start';
  // Complementary, high-contrast outline colors for dark UI
  const borderColor = role === 'user' ? '#4da3ff' : '#ff914d';
  const [showThinking, setShowThinking] = useState(false);
  return (
    <div
      className={clsx('w-full flex flex-col ai-anim-message', align)}
      style={{ ['--delay']: `${Math.min(idx || 0, 10) * 40}ms` }}
    >
      <div
        className={clsx(
          'max-w-[70ch] rounded-md text-sm whitespace-pre-wrap break-words border',
          role === 'assistant' ? 'px-2 py-1 leading-tight' : 'px-3 py-2 leading-6'
        )}
        style={{ borderColor, userSelect: 'text' }}
      >
        {typeof content === 'string' ? <Markdown text={content} /> : content}
        {attachments && attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {attachments.map((a, idx) => (
              <div key={idx} className="flex items-center gap-2 px-2 h-8 rounded-md border ai-anim-attachment" style={{ borderColor: 'var(--search-border)' }}>
                {a.dataUrl ? (
                  <img src={a.dataUrl} alt={a.name} className="w-6 h-6 object-cover rounded-sm" />
                ) : (
                  <Paperclip size={14} />
                )}
                <span className="text-xs max-w-[14rem] truncate">{a.name || 'attachment'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Thinking section outside the response box, collapsible */}
      {role === 'assistant' && (inProgress || (typeof thinking === 'string' && thinking.length > 0)) && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowThinking((v) => !v)}
            className="text-xs px-2 h-6 rounded-full border cursor-pointer opacity-80 hover:opacity-100"
            style={{ borderColor: 'var(--search-border)' }}
          >
            <span className="inline-flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transform: showThinking ? 'rotate(180deg)' : 'none', transition: 'transform 150ms var(--ai-ease)' }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              <span>Thinking</span>
              {inProgress && (
                <span className="inline-flex items-center ml-1" aria-hidden>
                  <span className="ai-dot" style={{ animationDelay: '0s' }} />
                  <span className="ai-dot" style={{ animationDelay: '0.15s' }} />
                  <span className="ai-dot" style={{ animationDelay: '0.3s' }} />
                </span>
              )}
            </span>
          </button>
          <div className={clsx('ai-collapse', showThinking && 'open')}>
            <div className="mt-2 text-xs opacity-80 whitespace-pre-wrap break-words">
              {thinking || (inProgress ? 'Thinking…' : '')}
            </div>
          </div>
        </div>
      )}

      {role === 'assistant' && Array.isArray(sources) && sources.length > 0 && (
        <div className="mt-1">
          <SourcesBar sources={sources} />
        </div>
      )}

      {role === 'assistant' && (
        <div className={clsx('mt-1 flex items-center gap-1', align)}>
          <button
            title="Copy"
            onClick={onCopy}
            className="w-7 h-7 rounded-md border flex items-center justify-center hover:opacity-80 duration-150"
            style={{ borderColor: 'var(--search-border)' }}
          >
            {/* Copy icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2"></path></svg>
          </button>
          <button
            title="Retry"
            onClick={onRetry}
            disabled={!canRetry || loading}
            className="w-7 h-7 rounded-md border flex items-center justify-center hover:opacity-80 duration-150 disabled:opacity-50"
            style={{ borderColor: 'var(--search-border)' }}
          >
            {/* RotateCcw icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L3 8"/></svg>
          </button>
        </div>
      )}
    </div>
  );
};

const STORAGE_KEY = 'leopard_ai_chats_v1';
// No starter message; chats begin blank until user sends
const defaultGreeting = null;

const loadSessions = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveSessions = (sessions) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // ignore write errors
  }
};

const genId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createSession = () => ({
  id: genId(),
  title: 'New Chat',
  messages: [],
  updatedAt: Date.now(),
});

const Sidebar = ({ sessions, currentId, onSelect, onNewDraft, onCollapse, onRename, onDelete, search, setSearch, themeClass }) => {
  return (
    <div
      className={clsx(
        'w-72 shrink-0 flex flex-col p-3 rounded-[10px] shadow-xl/5 h-full ai-anim-panel ai-slide-in-left',
        themeClass,
        theme.searchBarColor
      )}
      style={{ minWidth: '18rem' }}
    >
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onCollapse}
          className="w-7 h-7 rounded-md border flex items-center justify-center hover:opacity-80 duration-150"
          style={{ borderColor: 'var(--search-border)' }}
          title="Collapse"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-sm font-medium opacity-80">Chats</div>
        <button
          onClick={onNewDraft}
          className="flex items-center gap-1 text-xs px-2 h-7 rounded-md border hover:opacity-80 duration-150"
          style={{ borderColor: 'var(--search-border)' }}
        >
          <Plus size={14} /> New
        </button>
      </div>

      <div className={clsx('flex items-center gap-2 px-2 h-9 rounded-md mb-2', theme.searchBarColor)}>
        <LucideSearch className="w-4 h-4 opacity-80" />
        <input
          className="flex-1 bg-transparent outline-hidden text-xs"
          placeholder="Search past chats"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar scrollbar-thin scrollbar-track-transparent">
        {sessions.length === 0 && <div className="text-xs opacity-70 p-2">No chats yet</div>}
        {sessions.map((s) => (
          <div
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={clsx(
              'w-full p-2 rounded-md border cursor-pointer duration-150',
              currentId === s.id ? 'bg-[#4b55631a]' : 'hover:bg-[#4b55631a]'
            )}
            style={{ borderColor: 'var(--search-border)' }}
            title={s.title}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{s.title || 'New Chat'}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{new Date(s.updatedAt).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  className="w-6 h-6 rounded-md border flex items-center justify-center hover:opacity-80 duration-150"
                  style={{ borderColor: 'var(--search-border)' }}
                  title="Rename chat"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename(s.id);
                  }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="w-6 h-6 rounded-md border flex items-center justify-center hover:opacity-80 duration-150"
                  style={{ borderColor: 'var(--search-border)' }}
                  title="Delete chat"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(s.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LeopardAI = () => {
  const { options } = useOptions();
  const themeClass = theme[`theme-${options.theme || 'default'}`];

  // sessions + current chat state
  const [sessions, setSessions] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [search, setSearch] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [model, setModel] = useState(() => localStorage.getItem('leopard_ai_model') || DEFAULT_AI_MODEL);
  const [attachments, setAttachments] = useState([]);
  const [reasoning, setReasoning] = useState(() => localStorage.getItem('leopard_ai_reasoning') || 'balanced');
  const [showImageModal, setShowImageModal] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [creatingImage, setCreatingImage] = useState(false);
  const pickFilesRef = useRef(null);
  const [toast, setToast] = useState(null);

  // Web search toggle (shows inline control and informs backend)
  const [webSearch, setWebSearch] = useState(() => {
    try { return localStorage.getItem('leopard_ai_websearch') === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('leopard_ai_websearch', webSearch ? '1' : '0'); } catch {}
  }, [webSearch]);

  // load sessions on mount
  useEffect(() => {
    const stored = loadSessions();
    if (stored.length > 0) {
      stored.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setSessions(stored);
      setCurrentId(stored[0].id);
      setMessages(stored[0].messages && stored[0].messages.length ? stored[0].messages : []);
    } else {
      // No auto-creation; leave blank until user sends
      setCurrentId(null);
      setMessages([]);
    }
  }, []);

  // autoscroll on new messages
  useEffect(() => {
    if (!listRef.current) return;
    if (autoScroll) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const showError = (msg) => {
    setToast(msg);
    window.clearTimeout(showError._t);
    showError._t = window.setTimeout(() => setToast(null), 2600);
  };

  // Track user scrolling to allow manual control
  const onScrollList = () => {
    const el = listRef.current;
    if (!el) return;
    const threshold = 80; // px from bottom to re-enable autoscroll
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setAutoScroll(atBottom);
  };

  // persist model selection
  useEffect(() => {
    try { localStorage.setItem('leopard_ai_model', model); } catch {}
  }, [model]);

  // persist reasoning selection
  useEffect(() => {
    try { localStorage.setItem('leopard_ai_reasoning', reasoning); } catch {}
  }, [reasoning]);

  const onPickFiles = () => {
    pickFilesRef.current?.click();
  };

  // Remove old open-in-new-tab web search in favor of toggle below the composer

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const readAsDataUrl = (file) => new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.readAsDataURL(file);
    });
    const items = [];
    for (const f of files) {
      const item = { id: genId(), name: f.name, type: f.type || 'application/octet-stream', size: f.size };
      if (f.type && f.type.startsWith('image/')) {
        try { item.dataUrl = await readAsDataUrl(f); } catch {}
      }
      items.push(item);
    }
    setAttachments((prev) => [...prev, ...items]);
    e.target.value = '';
  };

  const removeAttachment = (id) => setAttachments((prev) => prev.filter((a) => a.id !== id));

  const tempFromReasoning = (r) => (r === 'fast' ? 0.2 : r === 'deep' ? 1.1 : 0.7);

  // persist current session when messages change (only if a session exists and has user messages)
  useEffect(() => {
    if (!currentId) return;
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === currentId);
      if (idx === -1) return prev;
      const firstUser = messages.find((m) => m.role === 'user');
      const title = firstUser?.content ? firstUser.content.slice(0, 60) : prev[idx].title || 'New Chat';
      const updated = { ...prev[idx], title, messages, updatedAt: Date.now() };
      const next = [updated, ...prev.filter((s) => s.id !== currentId)];
      saveSessions(next);
      return next;
    });
  }, [messages, currentId]);

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => {
      if (s.title?.toLowerCase().includes(q)) return true;
      return (s.messages || []).some((m) => m.content?.toLowerCase().includes(q));
    });
  }, [sessions, search]);

  // Start a new draft chat (not persisted until first send)
  const newChatDraft = () => {
    setCurrentId(null);
    setMessages([]);
    setInput('');
  };

  const renameChat = (id) => {
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const currentTitle = prev[idx].title || 'New Chat';
      const nextTitle = (typeof window !== 'undefined' ? window.prompt('Rename chat', currentTitle) : currentTitle) || '';
      const trimmed = nextTitle.trim();
      if (!trimmed || trimmed === currentTitle) return prev;
      const updated = { ...prev[idx], title: trimmed, updatedAt: Date.now() };
      const next = [updated, ...prev.filter((s) => s.id !== id)];
      saveSessions(next);
      return next;
    });
  };

  const deleteChat = (id) => {
    if (typeof window !== 'undefined') {
      const ok = window.confirm('Delete this chat? This cannot be undone.');
      if (!ok) return;
    }
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveSessions(next);
      // update current selection
      if (currentId === id) {
        if (next.length > 0) {
          const first = next[0];
          setCurrentId(first.id);
          setMessages(first.messages && first.messages.length ? first.messages : []);
        } else {
          setCurrentId(null);
          setMessages([]);
        }
        setInput('');
      }
      return next;
    });
  };

  const selectChat = (id) => {
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    setCurrentId(id);
    setMessages(s.messages && s.messages.length ? s.messages : []);
    setInput('');
  };

  const send = async () => {
    const value = input.trim();
    if (!value || loading) return;
    const userMsg = { role: 'user', content: value, attachments: attachments.length ? attachments : undefined };
    const next = [...messages, userMsg];
    setAttachments([]);
    // If no session yet, create one now (on first send)
    if (!currentId) {
      const firstTitle = value.slice(0, 60);
      const s = {
        ...createSession(),
        title: firstTitle || 'New Chat',
        messages: next,
        updatedAt: Date.now(),
      };
      setSessions((prev) => {
        const n = [s, ...prev];
        saveSessions(n);
        return n;
      });
      setCurrentId(s.id);
    }
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const apiMessages = next.map((m) => {
        if (!m.attachments || !m.attachments.length) return { role: m.role, content: m.content };
        const parts = [];
        if (m.content) parts.push({ type: 'text', text: m.content });
        m.attachments.forEach((a) => {
          if (a.type && a.type.startsWith('image/') && a.dataUrl) {
            parts.push({ type: 'image_url', image_url: { url: a.dataUrl } });
          } else {
            parts.push({ type: 'text', text: `Attachment: ${a.name} (${a.size} bytes)` });
          }
        });
        return { role: m.role, content: parts };
      });

      // Fallback-aware chain attempts (streaming preferred)
      const category = UI_ID_TO_CATEGORY[model] || 'instant';
      const chain = (AI_CONFIG.chains?.[category] || {})[webSearch ? 'web' : 'regular'] || [];
      // Ensure assistant placeholder exists
      setMessages((m) => (m[m.length - 1]?.role === 'assistant' ? m : [...m, { role: 'assistant', content: '', thinking: '' }]));
      let success = false;
      for (let idx = 0; idx < Math.max(1, chain.length); idx++) {
        try {
          const streamRes = await fetch('/api/ai_stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, temperature: tempFromReasoning(reasoning), messages: apiMessages, webSearch, chainIndex: idx }),
          });
          let gotAny = false;
          if (streamRes.ok && streamRes.body) {
            const reader = streamRes.body.getReader();
            const decoder = new TextDecoder();
            let buf = '';
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });
              const lines = buf.split('\n');
              buf = lines.pop() || '';
              for (const raw of lines) {
                const line = raw.trim();
                if (!line.startsWith('data:')) continue;
                const payload = line.slice(5).trim();
                if (!payload) continue;
                try {
                  const evt = JSON.parse(payload);
                  if (evt.done) {
                  } else if (typeof evt.delta === 'string' && evt.delta.length) {
                    gotAny = true;
                    setMessages((curr) => {
                      const n = curr.slice();
                      const last = n[n.length - 1];
                      if (last?.role !== 'assistant') return n;
                      if (evt.type === 'thinking') n[n.length - 1] = { ...last, thinking: (last.thinking || '') + evt.delta };
                      else n[n.length - 1] = { ...last, content: (last.content || '') + evt.delta };
                      return n;
                    });
                  }
                } catch {}
              }
            }
          }
          if (gotAny) { success = true; break; }
          // Final response fallback
          const res = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, temperature: tempFromReasoning(reasoning), messages: apiMessages, webSearch, chainIndex: idx }),
          });
          if (res.ok) {
            const data = await res.json();
            const reply = data.reply || '';
            if (reply) {
              setMessages((curr) => {
                const n = curr.slice();
                const last = n[n.length - 1];
                if (last?.role === 'assistant') n[n.length - 1] = { ...last, content: reply, sources: Array.isArray(data.sources) ? data.sources : undefined };
                return n;
              });
              success = true; break;
            }
          }
          showError('Model busy; trying next option...');
        } catch {
          showError('Request failed; trying next option...');
        }
      }
      if (!success) {
        setMessages((curr) => {
          const n = curr.slice();
          const last = n[n.length - 1];
          if (last?.role === 'assistant') n[n.length - 1] = { ...last, content: 'Sorry, all models are busy. Please try again.' };
          return n;
        });
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            'Leopard AI is offline. Ask your admin to configure an API key. (Sent message saved.)',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const generateImage = async () => {
    const p = imagePrompt.trim();
    if (!p || creatingImage) return;
    setCreatingImage(true);
    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p, model }),
      });
      if (!res.ok) throw new Error('image_failed');
      const data = await res.json();
      const url = data.image;
      const imgAttachment = { id: genId(), name: 'generated.png', type: 'image/png', dataUrl: url };
      const assistantMsg = { role: 'assistant', content: '', attachments: [imgAttachment] };
      let next = [...messages, assistantMsg];
      if (!currentId) {
        const s = { ...createSession(), title: `Image: ${p.slice(0, 40)}`, messages: next, updatedAt: Date.now() };
        setSessions((prev) => { const n = [s, ...prev]; saveSessions(n); return n; });
        setCurrentId(s.id);
      }
      setMessages(next);
      setShowImageModal(false);
      setImagePrompt('');
    } catch (e) {
      setShowImageModal(false);
    } finally {
      setCreatingImage(false);
    }
  };

  return (
    <div className="ai-scope ai-anim-page flex flex-col h-screen overflow-hidden">
      <Nav />
      {/* local styles for animated thinking dots */}
      <style>{`
        @keyframes aiDotBounce { 0%, 80%, 100% { transform: translateY(0); opacity: .6 } 40% { transform: translateY(-3px); opacity: 1 } }
        .ai-dot { width:4px; height:4px; border-radius:50%; background: currentColor; display:inline-block; margin-left:3px; animation: aiDotBounce 1s infinite; }
      `}</style>

      <div className="flex-1 min-h-0 overflow-y-auto flex gap-3 px-4 pb-4 pt-3 ai-anim-panel">
        {/* Sidebar: Past chats + search (collapsible) */}
        {sidebarOpen ? (
          <Sidebar
            sessions={filteredSessions}
            currentId={currentId}
            onSelect={selectChat}
            onNewDraft={newChatDraft}
            onRename={renameChat}
            onDelete={deleteChat}
            onCollapse={() => setSidebarOpen(false)}
            search={search}
            setSearch={setSearch}
            themeClass={themeClass}
          />
        ) : (
          <div className="shrink-0 flex flex-col items-center pt-2 ai-anim-panel">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-7 h-7 rounded-md border flex items-center justify-center hover:opacity-80 duration-150"
              style={{ borderColor: 'var(--search-border)' }}
              title="Expand chats"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Model selector gutter */}
        <div className={clsx('w-64 shrink-0 flex flex-col gap-2 pt-1 ai-anim-panel', themeClass)}>
          <ModelDropdown className="w-full" models={AI_MODELS} value={model} onChange={setModel} />
        </div>

        {/* Chat column */}
        <div className={clsx('flex-1 min-w-0 min-h-0 flex flex-col ai-anim-panel', themeClass)}>

          {/* Messages panel */}
          <div
            ref={listRef}
            className={clsx(
              'flex-1 overflow-y-auto p-4 space-y-3',
              'scrollbar scrollbar-thin scrollbar-track-transparent',
              !options?.type || options.type === 'dark' ? 'scrollbar-thumb-gray-600' : 'scrollbar-thumb-gray-500'
            )}
            onScroll={onScrollList}
          >
            {(() => {
              const lastAssistantIndex = (() => {
                for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === 'assistant') return i;
                return -1;
              })();
                return messages.map((m, i) => (
                  <Message
                    key={i}
                    idx={i}
                    role={m.role}
                    content={m.content}
                    thinking={m.thinking}
                    inProgress={m.role === 'assistant' && i === lastAssistantIndex && loading}
                    attachments={m.attachments}
                    sources={m.sources}
                    canRetry={m.role === 'assistant' && i === lastAssistantIndex}
                    loading={loading}
                  onCopy={async () => {
                    const text = typeof m.content === 'string' ? m.content : Array.isArray(m.content) ? m.content.map((p) => p?.text || '').join(' ') : '';
                    try { await navigator.clipboard.writeText(text || ''); } catch {}
                  }}
                  onRetry={async () => {
                    if (loading || m.role !== 'assistant') return;
                    const base = messages.slice(0, i);
                    setLoading(true);
                    try {
                      const apiMessages = base.map((bm) => {
                        if (!bm.attachments || !bm.attachments.length) return { role: bm.role, content: bm.content };
                        const parts = [];
                        if (bm.content) parts.push({ type: 'text', text: bm.content });
                        bm.attachments.forEach((a) => {
                          if (a.type && a.type.startsWith('image/') && a.dataUrl) parts.push({ type: 'image_url', image_url: { url: a.dataUrl } });
                        });
                        return { role: bm.role, content: parts };
                      });
                      const category = UI_ID_TO_CATEGORY[model] || 'instant';
                      const chain = (AI_CONFIG.chains?.[category] || {})[webSearch ? 'web' : 'regular'] || [];
                      setMessages([...base, { role: 'assistant', content: '', thinking: '' }]);
                      let success = false;
                      for (let idx = 0; idx < Math.max(1, chain.length); idx++) {
                        try {
                          const streamRes = await fetch('/api/ai_stream', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ model, temperature: tempFromReasoning(reasoning), messages: apiMessages, webSearch, chainIndex: idx }),
                          });
                          let gotAny = false;
                          if (streamRes.ok && streamRes.body) {
                            const reader = streamRes.body.getReader();
                            const decoder = new TextDecoder();
                            let buf = '';
                            while (true) {
                              const { value, done } = await reader.read();
                              if (done) break;
                              buf += decoder.decode(value, { stream: true });
                              const lines = buf.split('\n');
                              buf = lines.pop() || '';
                              for (const raw of lines) {
                                const line = raw.trim();
                                if (!line.startsWith('data:')) continue;
                                const payload = line.slice(5).trim();
                                if (!payload) continue;
                                try {
                                  const evt = JSON.parse(payload);
                                  if (evt.done) {
                                  } else if (typeof evt.delta === 'string' && evt.delta.length) {
                                    gotAny = true;
                                    setMessages((curr) => {
                                      const n = curr.slice();
                                      const last = n[n.length - 1];
                                      if (last?.role !== 'assistant') return n;
                                      if (evt.type === 'thinking') n[n.length - 1] = { ...last, thinking: (last.thinking || '') + evt.delta };
                                      else n[n.length - 1] = { ...last, content: (last.content || '') + evt.delta };
                                      return n;
                                    });
                                  }
                                } catch {}
                              }
                            }
                          }
                          if (gotAny) { success = true; break; }
                          const res = await fetch('/api/ai', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ model, temperature: tempFromReasoning(reasoning), messages: apiMessages, webSearch, chainIndex: idx }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            const reply = data.reply || '';
                            if (reply) {
                              setMessages((curr) => {
                                const n = curr.slice();
                                const last = n[n.length - 1];
                                if (last?.role === 'assistant') n[n.length - 1] = { ...last, content: reply, sources: Array.isArray(data.sources) ? data.sources : undefined };
                                return n;
                              });
                              success = true; break;
                            }
                          }
                        } catch {}
                      }
                      if (!success) {
                        const next = [...base, { role: 'assistant', content: 'Sorry, all models are busy. Please try again.' }];
                        setMessages(next);
                      }
                    } catch (e) {
                      const next = [...base, { role: 'assistant', content: 'Retry failed. Please try again.' }];
                      setMessages(next);
                    } finally {
                      setLoading(false);
                    }
                  }}
                />
              ));
            })()}
            {/* Thinking text removed; animated dots on the Thinking pill indicate progress */}
          </div>

          {/* Composer (transparent with outline) */}
          <div
            className={clsx('mt-3 flex flex-col gap-2 p-2 rounded-[10px] relative ai-anim-panel')}
          >
            <div className="flex items-end gap-2">
              <textarea
                className="flex-1 bg-transparent outline-hidden resize-none p-2 text-sm leading-6 rounded-md border"
                rows={2}
                placeholder={webSearch ? 'Search the web' : 'Ask me anything...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                style={{ borderColor: 'var(--search-border)' }}
              />
              <button
                onClick={send}
                className={clsx('h-9 px-3 rounded-md text-sm border self-end', 'cursor-pointer hover:opacity-80 duration-150')}
                style={{ borderColor: 'var(--search-border)' }}
                disabled={loading}
              >
                Send
              </button>
              </div>

            {/* Inline actions row: toggles for web search, files, and image */}
            <div className="-mt-1 pl-0 flex items-center gap-2">
              <span className="text-xs opacity-70">Web</span>
              <button
                type="button"
                onClick={() => setWebSearch((v) => !v)}
                className={clsx('text-xs px-2 h-7 rounded-full border cursor-pointer', webSearch ? 'text-blue-400' : 'opacity-80 hover:opacity-100')}
                style={{ borderColor: 'var(--search-border)' }}
                title="Toggle web search"
              >
                {/* globe icon (inline svg to avoid extra import) */}
                <span className="inline-flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  <span>Search</span>
                  <span className="opacity-70">{webSearch ? 'On' : 'Off'}</span>
                </span>
              </button>

              <button
                type="button"
                onClick={onPickFiles}
                className={clsx('text-xs px-2 h-7 rounded-full border cursor-pointer opacity-80 hover:opacity-100')}
                style={{ borderColor: 'var(--search-border)' }}
                title="Attach files"
              >
                <span className="inline-flex items-center gap-1">
                  <Paperclip size={14} />
                  <span>Files</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className={clsx('text-xs px-2 h-7 rounded-full border cursor-pointer opacity-80 hover:opacity-100')}
                style={{ borderColor: 'var(--search-border)' }}
                title="Create image"
              >
                <span className="inline-flex items-center gap-1">
                  <Wand2 size={14} />
                  <span>Image</span>
                </span>
              </button>
            </div>
          </div>

          {/* Pending attachments preview */}
          {attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {attachments.map((a) => (
                <div key={a.id} className="flex items-center gap-2 px-2 h-8 rounded-md border ai-anim-attachment" style={{ borderColor: 'var(--search-border)' }}>
                  {a.dataUrl ? (
                    <img src={a.dataUrl} alt={a.name} className="w-6 h-6 object-cover rounded-sm" />
                  ) : (
                    <Paperclip size={14} />
                  )}
                  <span className="text-xs max-w-[14rem] truncate">{a.name}</span>
                  <button onClick={() => removeAttachment(a.id)} title="Remove" className="w-5 h-5 rounded-sm border flex items-center justify-center" style={{ borderColor: 'var(--search-border)' }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Hidden file input */}
          <input ref={pickFilesRef} type="file" className="hidden" multiple accept="*/*" onChange={handleFilesSelected} />

          {/* Image creation modal */}
          {showImageModal && (
            <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 ai-anim-backdrop">
              <div className={clsx('w-[480px] max-w-[92vw] rounded-[12px] border p-4 ai-anim-modal', theme.searchBarColor, themeClass)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium opacity-90">Create Image</div>
                  <button
                    onClick={() => setShowImageModal(false)}
                    className="w-7 h-7 rounded-md border flex items-center justify-center"
                    style={{ borderColor: 'var(--search-border)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
                <textarea
                  className="w-full bg-transparent outline-hidden resize-y min-h-[100px] p-2 text-sm leading-6 rounded-md border"
                  style={{ borderColor: 'var(--search-border)' }}
                  placeholder="Describe the image you want to create..."
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                />
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setShowImageModal(false)}
                    className="h-9 px-3 rounded-md text-sm border"
                    style={{ borderColor: 'var(--search-border)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={generateImage}
                    disabled={creatingImage}
                    className="h-9 px-3 rounded-md text-sm border cursor-pointer hover:opacity-80 duration-150"
                    style={{ borderColor: 'var(--search-border)' }}
                  >
                    {creatingImage ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-2 text-xs opacity-70">Tip: Press Enter to send, Shift+Enter for newline.</div>
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 px-3 py-2 rounded-md border text-xs shadow-xl backdrop-blur-[2px]" style={{ borderColor: 'var(--search-border)' }}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default LeopardAI;


