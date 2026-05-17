import { PeopleList } from './PeopleList';

export function PeopleListPage() {
  return (
    <PeopleList
      pageName="people"
      title="Personen"
      listClass="people-list"
      itemHref={(p) => `/person/${p.id}/`}
    />
  );
}
