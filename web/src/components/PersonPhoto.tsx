import { useEffect, useState } from 'react';
import { initials } from '../types';
import type { Person } from '../types';
import { useStore } from '../store';

interface Props {
  person: Person;
  size?: number;
  onClick?: () => void;
  className?: string;
}

export function PersonPhoto({ person, size = 48, onClick, className = '' }: Props) {
  const { getPhotoUrl } = useStore();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!person.photoPath) { setUrl(null); return; }
    getPhotoUrl(person.photoPath).then((u) => { if (!cancelled) setUrl(u); });
    return () => { cancelled = true; };
  }, [person.photoPath, getPhotoUrl]);

  const style = { width: size, height: size, fontSize: size * 0.35 };
  const base = 'rounded-full object-cover flex-shrink-0 bg-primary text-white flex items-center justify-center font-semibold overflow-hidden ' + className;

  if (url) {
    return <img className={base} src={url} alt="" style={style} onClick={onClick} />;
  }
  return (
    <div className={base} style={style} onClick={onClick}>
      {initials(person)}
    </div>
  );
}
