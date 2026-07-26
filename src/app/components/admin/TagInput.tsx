import { useState } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function TagInput({ values, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const value = draft.trim();
    if (value && !values.includes(value)) {
      onChange([...values, value]);
    }
    setDraft('');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map(value => (
          <span key={value} className="flex items-center gap-1 bg-neutral-100 text-sm px-3 py-1">
            {value}
            <button type="button" onClick={() => onChange(values.filter(v => v !== value))}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          placeholder={placeholder}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          className="flex-1 px-4 py-2 border border-neutral-300 text-sm"
        />
        <button
          type="button"
          onClick={addTag}
          className="px-4 py-2 border border-neutral-300 text-sm hover:bg-neutral-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
