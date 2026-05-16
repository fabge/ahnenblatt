import { useEffect, useState } from 'react';
import { useStore } from '../store';

export function PhotoFullscreen({ photoPath, onClose }: { photoPath: string; onClose: () => void }) {
  const { getPhotoUrl } = useStore();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPhotoUrl(photoPath).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => { cancelled = true; };
  }, [photoPath, getPhotoUrl]);

  return (
    <div className="photo-fullscreen" onClick={onClose}>
      {url ? <img src={url} alt="" /> : <div className="muted">Lädt…</div>}
    </div>
  );
}
