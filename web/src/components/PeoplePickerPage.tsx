import { useStore } from '../store';
import { PeopleList } from './PeopleList';

interface F7Router {
  navigate: (url: string, opts?: Record<string, unknown>) => void;
}

export function PeoplePickerPage({ f7router }: { f7router?: F7Router }) {
  const { rootPersonId, setRootPerson } = useStore();

  return (
    <PeopleList
      pageName="people-picker"
      title="Personen"
      listClass="picker-list"
      activeId={rootPersonId}
      onSelect={(p) => {
        setRootPerson(p.id);
        f7router?.navigate('/tree/');
      }}
    />
  );
}
