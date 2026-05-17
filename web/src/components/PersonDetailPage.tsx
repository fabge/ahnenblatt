import { PersonDetailContent } from './PersonDetailContent';

interface F7Route {
  params: { id?: string };
}

export function PersonDetailPage({ f7route }: { f7route: F7Route }) {
  const id = f7route.params.id;
  if (!id) return null;
  return <PersonDetailContent personId={id} />;
}
