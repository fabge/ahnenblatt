import { useEffect, useState } from 'react';
import { initials } from '../types';
import type { Person } from '../types';
import { useStore } from '../store';

interface Props {
  person: Person;
  size?: number;
  onClick?: () => void;
  className?: string;
  slot?: string;
}

export function PersonPhoto({ person, size = 48, onClick, className = '', slot }: Props) {
  const { getPhotoUrl } = useStore();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPhotoUrl(person.photoPath).then((u) => { if (!cancelled) setUrl(u); });
    return () => { cancelled = true; };
  }, [person.photoPath, getPhotoUrl]);

  const style = {
    width: size, height: size, fontSize: size * 0.35,
    background: 'var(--f7-theme-color)',
  };
  const base = 'rounded-full object-cover flex-shrink-0 text-white flex items-center justify-center font-semibold overflow-hidden ' + className;

  if (url) {
    return <img slot={slot} className={base} src={url} alt="" style={style} onClick={onClick} />;
  }
  return (
    <div slot={slot} className={base} style={style} onClick={onClick}>
      {initials(person)}
    </div>
  );
}
