import { useEffect, useRef, useState } from 'react';
import Nav from '../layouts/Nav';
import { useOptions } from '/src/utils/optionsContext';
import clsx from 'clsx';
import theme from '../styles/theming.module.css';

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

const LeopardAI = () => {
  const { options } = useOptions();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm Leopard AI. How can I help?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const value = input.trim();
    if (!value || loading) return;
    const next = [...messages, { role: 'user', content: value }];
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
          content: 'Leopard AI is offline. Ask your admin to configure an API key. (Sent message saved.)',
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

      <div className="flex-1 flex justify-center px-4 pb-4 pt-3">
        <div className="w-full max-w-[980px] flex flex-col">
          <div
            className="mb-3 text-lg font-medium"
            style={{ color: options.siteTextColor || '#a0b0c8' }}
          >
            Leopard AI
          </div>

          {/* Messages panel */}
          <div
            ref={listRef}
            className={clsx(
              'flex-1 overflow-y-auto rounded-[10px] p-4 space-y-3 shadow-xl/5',
              'scrollbar scrollbar-thin scrollbar-track-transparent',
              !options?.type || options.type === 'dark'
                ? 'scrollbar-thumb-gray-600'
                : 'scrollbar-thumb-gray-500',
              theme[`theme-${options.theme || 'default'}`],
              theme.searchBarColor
            )}
          >
            {messages.map((m, i) => (
              <Message key={i} role={m.role} content={m.content} />
            ))}
            {loading && <div className="text-sm opacity-70">Thinking…</div>}
          </div>

          {/* Composer */}
          <div
            className={clsx(
              'mt-3 flex items-end gap-2 p-2 rounded-[10px] shadow-xl/5',
              theme[`theme-${options.theme || 'default'}`],
              theme.searchBarColor
            )}
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
              className={clsx(
                'h-9 px-3 rounded-md text-sm border',
                'cursor-pointer hover:opacity-80 duration-150'
              )}
              style={{ borderColor: 'var(--search-border)' }}
              disabled={loading}
            >
              Send
            </button>
          </div>

          <div className="mt-2 text-xs opacity-70">
            Tip: Press Enter to send, Shift+Enter for newline.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeopardAI;
