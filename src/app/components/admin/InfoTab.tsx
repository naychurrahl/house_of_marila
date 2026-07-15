import { useState, useEffect } from 'react';
import { useApp } from '@/app/context/AppContext';
import { ImageUploader } from '@/app/components/admin/ImageUploader';

export function InfoTab() {
  const { settings, updateSettings } = useApp();
  const [name, setName] = useState(settings?.name ?? '');
  const [tagline, setTagline] = useState(settings?.tagline ?? '');
  const [logo, setLogo] = useState(settings?.logo ?? '');
  const [instagram, setInstagram] = useState(settings?.instagram ?? '');
  const [twitter, setTwitter] = useState(settings?.twitter ?? '');
  const [pinterest, setPinterest] = useState(settings?.pinterest ?? '');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setName(settings.name);
    setTagline(settings.tagline ?? '');
    setLogo(settings.logo ?? '');
    setInstagram(settings.instagram ?? '');
    setTwitter(settings.twitter ?? '');
    setPinterest(settings.pinterest ?? '');
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      await updateSettings({ name, tagline, logo, instagram, twitter, pinterest });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-6">
      <div>
        <label className="block text-sm mb-2">Logo</label>
        <ImageUploader folder="site" value={logo} onChange={setLogo} />
      </div>

      <div>
        <label className="block text-sm mb-2">Site Name</label>
        <input
          required
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 border border-neutral-300 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm mb-2">Tagline</label>
        <input
          value={tagline}
          onChange={e => setTagline(e.target.value)}
          placeholder="e.g. House of"
          className="w-full px-4 py-3 border border-neutral-300 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm mb-2">Instagram URL</label>
        <input
          value={instagram}
          onChange={e => setInstagram(e.target.value)}
          className="w-full px-4 py-3 border border-neutral-300 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm mb-2">Twitter URL</label>
        <input
          value={twitter}
          onChange={e => setTwitter(e.target.value)}
          className="w-full px-4 py-3 border border-neutral-300 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm mb-2">Pinterest URL</label>
        <input
          value={pinterest}
          onChange={e => setPinterest(e.target.value)}
          className="w-full px-4 py-3 border border-neutral-300 text-sm"
        />
      </div>

      {error && <div className="py-3 text-center text-sm text-red-700 bg-red-50">{error}</div>}
      {saved && <div className="py-3 text-center text-sm text-green-800 bg-green-50">Saved</div>}

      <button
        type="submit"
        disabled={isSaving}
        className={`w-full py-3 text-sm tracking-wide ${
          isSaving ? 'bg-neutral-400 text-white cursor-not-allowed' : 'bg-black text-white hover:bg-neutral-800'
        }`}
      >
        {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
      </button>
    </form>
  );
}
