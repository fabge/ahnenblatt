import { fullName, shortLife } from '../types';
import type { Person } from '../types';
import { PersonPhoto } from './PersonPhoto';

export function PersonRow({ person, onClick }: { person: Person; onClick?: () => void }) {
  return (
    <button className="person-row" onClick={onClick}>
      <PersonPhoto person={person} size={48} />
      <div className="person-row-text">
        <div className="person-row-name">{fullName(person)}</div>
        <div className="person-row-sub">{shortLife(person)}</div>
      </div>
    </button>
  );
}
