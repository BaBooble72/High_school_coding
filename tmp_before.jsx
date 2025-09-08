import { useEffect, useMemo, useRef, useState } from 'react';
import Nav from '../layouts/Nav';
import { useOptions } from '/src/utils/optionsContext';
import clsx from 'clsx';
import theme from '../styles/theming.module.css';
import { LucideSearch, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const Message = ({ role, content }) => (
  <div className={clsx('w-full flex', role === 'user' ? 'justify-end' : 'justify-start')}>
    <div
      className={clsx(
        'max-w-[70ch] px-3 py-2 rounded-md text-sm leading-6 whitespace-pre-wrap break-words',
        role === 'user' ? 'bg-[#4b55632b]' : 'bg-[#4b55631a]'
      )}
      style={{ backdropFilter: 'blur(4px)' }}
    >
      {content}
    </div>
  </div>
);

const STORAGE_KEY = 'leopard_ai_chats_v1';
const defaultGreeting = { role: 'assistant', content: "Hi! I'm Leopard AI. How can I help?" };

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
  messages: [defaultGreeting],
  updatedAt: Date.now(),
});

const Sidebar = ({ sessions, currentId, onSelect, onNewDraft, onCollapse, search, setSearch, themeClass }) => {
  return (
    <div
      className={clsx(
        'w-72 shrink-0 flex flex-col p-3 rounded-[10px] shadow-xl/5 h-full',
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
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={clsx(
              'w-full text-left p-2 rounded-md border cursor-pointer duration-150',
              currentId === s.id ? 'bg-[#4b55631a]' : 'hover:bg-[#4b55631a]'
            )}
            style={{ borderColor: 'var(--search-border)' }}
            title={s.title}
          >
            <div className="text-sm truncate">{s.title || 'New Chat'}</div>
            <div className="text-[10px] opacity-70 mt-0.5">{new Date(s.updatedAt).toLocaleString()}</div>
          </button>
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
  const [messages, setMessages] = useState([defaultGreeting]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // load sessions on mount
  useEffect(() => {
    const stored = loadSessions();
    if (stored.length > 0) {
      stored.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setSessions(stored);
      setCurrentId(stored[0].id);
      setMessages(stored[0].messages && stored[0].messages.length ? stored[0].messages : [defaultGreeting]);
    } else {
      // No auto-creation; show greeting as draft until user sends
      setCurrentId(null);
      setMessages([defaultGreeting]);
    }
  }, []);

  // autoscroll on new messages
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

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
    setMessages([defaultGreeting]);
    setInput('');
  };

  const selectChat = (id) => {
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    setCurrentId(id);
    setMessages(s.messages && s.messages.length ? s.messages : [defaultGreeting]);
    setInput('');
  };

  const send = async () => {
    const value = input.trim();
    if (!value || loading) return;
    const next = [...messages, { role: 'user', content: value }];
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
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      if (!res.ok) throw new Error('request failed');
      const data = await res.json();
      const reply = data.reply || 'Sorry, I could not generate a response.';
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
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

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Nav />

      <div className="flex-1 flex gap-3 px-4 pb-4 pt-3">
        {/* Sidebar: Past chats + search (collapsible) */}
        {sidebarOpen ? (
          <Sidebar
            sessions={filteredSessions}
            currentId={currentId}
            onSelect={selectChat}
            onNewDraft={newChatDraft}
            onCollapse={() => setSidebarOpen(false)}
            search={search}
            setSearch={setSearch}
            themeClass={themeClass}
          />
        ) : (
          <div className="shrink-0 flex flex-col items-center pt-2">
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

        {/* Chat column */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="mb-3 text-lg font-medium" style={{ color: options.siteTextColor || '#a0b0c8' }}>
            Leopard AI
          </div>

          {/* Messages panel */}
          <div
            ref={listRef}
            className={clsx(
              'flex-1 overflow-y-auto p-4 space-y-3',
              'scrollbar scrollbar-thin scrollbar-track-transparent',
              !options?.type || options.type === 'dark' ? 'scrollbar-thumb-gray-600' : 'scrollbar-thumb-gray-500'
            )}
          >
            {messages.map((m, i) => (
              <Message key={i} role={m.role} content={m.content} />
            ))}
            {loading && <div className="text-sm opacity-70">Thinking…</div>}
          </div>

          {/* Composer (transparent with outline) */}
          <div
            className={clsx('mt-3 flex items-end gap-2 p-2 rounded-[10px] border')}
            style={{ borderColor: 'var(--search-border)' }}
          >
            <textarea
              className="flex-1 bg-transparent outline-hidden resize-none p-2 text-sm leading-6"
              rows={2}
              placeholder="Ask me anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button
              onClick={send}
              className={clsx('h-9 px-3 rounded-md text-sm border', 'cursor-pointer hover:opacity-80 duration-150')}
              style={{ borderColor: 'var(--search-border)' }}
              disabled={loading}
            >
              Send
            </button>
          </div>

          <div className="mt-2 text-xs opacity-70">Tip: Press Enter to send, Shift+Enter for newline.</div>
        </div>
      </div>
    </div>
  );
};

export default LeopardAI;


