import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked once
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: false,
});

const renderer = new marked.Renderer();
renderer.link = (href, title, text) => {
  const t = title ? ` title="${title}"` : '';
  const safeHref = href || '#';
  return `<a href="${safeHref}"${t} target="_blank" rel="noreferrer noopener">${text}</a>`;
};

const Markdown = ({ text = '' }) => {
  const html = useMemo(() => {
    try {
      const raw = marked.parse(String(text || ''), { renderer });
      return DOMPurify.sanitize(raw, { ADD_ATTR: ['target', 'rel'] });
    } catch {
      return String(text || '');
    }
  }, [text]);

  return <div className="ai-md" dangerouslySetInnerHTML={{ __html: html }} />;
};

export default Markdown;

