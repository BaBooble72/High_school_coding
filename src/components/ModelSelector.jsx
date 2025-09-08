import clsx from 'clsx';
import theme from '../styles/theming.module.css';

// Simple segmented control-like selector
// Props:
// - models: [{ id, label }]
// - value: selected model id
// - onChange: (id) => void
// - className: optional container class
export default function ModelSelector({ models = [], value, onChange, className }) {
  return (
    <div className={clsx('flex items-center gap-2 h-9 px-2 rounded-md overflow-x-auto', theme.searchBarColor, className)}>
      <span className="text-xs opacity-80 shrink-0">Model</span>
      <div className="flex items-center gap-1">
        {models.map((m) => {
          const selected = m.id === value;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              className={clsx(
                'text-xs px-2.5 h-7 rounded-full border cursor-pointer duration-150 whitespace-nowrap',
                selected ? 'opacity-100' : 'opacity-85 hover:opacity-100',
              )}
              style={{ borderColor: 'var(--search-border)' }}
              title={m.label}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

