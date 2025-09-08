import clsx from 'clsx';

const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));

const toHostname = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};

const faviconFor = (url) => {
  const host = toHostname(url);
  if (!host) return null;
  // DuckDuckGo icons service – lightweight and reliable
  return `https://icons.duckduckgo.com/ip3/${host}.ico`;
};

const SourcesBar = ({ sources = [], className }) => {
  const hostnames = uniq(sources.map(toHostname)).slice(0, 6);
  if (!hostnames.length) return null;
  return (
    <div className={clsx('inline-flex items-center gap-2 text-xs opacity-80', className)}>
      <span className="inline-flex items-center -space-x-1">
        {hostnames.map((h, i) => (
          <img
            key={h + i}
            src={`https://icons.duckduckgo.com/ip3/${h}.ico`}
            alt={h}
            width={16}
            height={16}
            className="w-4 h-4 rounded-full border"
            style={{ borderColor: 'var(--search-border)' }}
            title={h}
          />
        ))}
      </span>
      <span>Sources</span>
    </div>
  );
};

export default SourcesBar;

