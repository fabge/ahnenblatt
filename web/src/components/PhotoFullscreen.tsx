import { useEffect, useState } from 'react';
import { Popup } from 'konsta/react';
import { useStore } from '../store';

export function PhotoFullscreen({ photoPath, onClose }: { photoPath: string; onClose: () => void }) {
  const { getPhotoUrl } = useStore();
  const [url, setUrl] = useState<string | null>(null);
  const [opened, setOpened] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getPhotoUrl(photoPath).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => { cancelled = true; };
  }, [photoPath, getPhotoUrl]);

  return (
    <Popup
      opened={opened}
      onBackdropClick={() => setOpened(false)}
      colors={{ bg: 'bg-black' }}
      onTransitionEnd={(e: React.TransitionEvent<HTMLElement>) => {
        if (!opened && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full h-full flex items-center justify-center bg-black"
        onClick={() => setOpened(false)}
      >
        {url ? (
          <img src={url} alt="" className="max-w-full max-h-full" />
        ) : (
          <div className="text-white/60">Lädt…</div>
        )}
      </div>
    </Popup>
  );
}
