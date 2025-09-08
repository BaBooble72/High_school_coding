import clsx from 'clsx';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';
import theme from '../styles/theming.module.css';

// Non-editable dropdown for model selection
// Props: models [{id,label}], value (id), onChange(id)
export default function ModelDropdown({ models = [], value, onChange, className }) {
  const current = models.find((m) => m.id === value) || models[0];

  const descriptions = {
    'gemini-2.5-flash-lite': 'Answers right away',
    'gemini-2.5-flash': 'Thinks quickly',
    'gemini-2.5-pro': 'Thinks longer for better answers',
  };


  return (
    <Listbox value={value} onChange={onChange}>
      <div className={clsx('relative inline-block w-full min-w-[16rem]', className)}>
        <ListboxButton
          className={clsx(
            'flex items-center gap-2 h-11 px-4 rounded-md border text-sm',
            'cursor-pointer bg-transparent',
          )}
          style={{ borderColor: 'var(--search-border)' }}
        >
          <span className="truncate max-w-[16rem]">{current?.label || value}</span>
          <ChevronDown size={16} className="opacity-80" />
        </ListboxButton>

        <ListboxOptions
          className={clsx(
            'absolute left-0 top-full z-20 mt-1 w-full rounded-md border p-2 shadow-xl bg-transparent',
            'backdrop-blur-[2px]'
          )}
          style={{ borderColor: 'var(--search-border)' }}
        >
          {models.map((m) => (
            <ListboxOption
              key={m.id}
              value={m.id}
              className="group flex items-start gap-2 px-3 py-3 rounded-md border cursor-pointer hover:bg-[#ffffff10]"
              style={{ borderColor: 'var(--search-border)' }}
            >
              {({ selected }) => (
                <>
                  <span className="w-4 leading-5 flex justify-center items-start pt-0.5">
                    {selected && <Check size={14} />}
                  </span>
                  <span className="flex-1 min-w-0 leading-5">
                    <span className="block text-sm truncate">{m.label}</span>
                    <span className="block text-[11px] opacity-70 truncate">{descriptions[m.id] || ''}</span>
                  </span>
                </>
              )}
            </ListboxOption>
          ))}
          
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
