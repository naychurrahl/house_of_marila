import { useRef, useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';

type UploadFolder = 'products' | 'collections' | 'articles' | 'site';

interface SingleProps {
  folder: UploadFolder;
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
}

interface MultiProps {
  folder: UploadFolder;
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
}

export function ImageUploader(props: SingleProps | MultiProps) {
  const { uploadImage } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setIsUploading(true);
    try {
      const url = await uploadImage(file, props.folder);
      if (props.multiple) {
        props.onChange([...props.value, url]);
      } else {
        props.onChange(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const picker = (
    <label className="flex flex-col items-center justify-center gap-1 w-24 h-24 border border-dashed border-neutral-300 cursor-pointer text-neutral-400 hover:border-black hover:text-black transition-colors">
      {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
      <span className="text-[10px] tracking-wide uppercase">{isUploading ? 'Uploading' : 'Upload'}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />
    </label>
  );

  if (props.multiple) {
    return (
      <div>
        <div className="flex flex-wrap gap-3">
          {props.value.map((image, index) => (
            <div key={`${image}-${index}`} className="relative w-24 h-24">
              <img src={image} alt="" className="w-full h-full object-cover border border-neutral-200" />
              <button
                type="button"
                onClick={() => props.onChange(props.value.filter((_, i) => i !== index))}
                className="absolute -top-2 -right-2 bg-black text-white rounded-full w-5 h-5 flex items-center justify-center"
                aria-label="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {picker}
        </div>
        {error && <p className="text-sm text-red-700 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        {props.value ? (
          <img src={props.value} alt="" className="w-24 h-24 object-cover border border-neutral-200" />
        ) : null}
        {picker}
      </div>
      {error && <p className="text-sm text-red-700 mt-2">{error}</p>}
    </div>
  );
}
