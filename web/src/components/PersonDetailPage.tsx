import { PersonDetailContent } from './PersonDetailContent';

interface F7Route {
  params: { id?: string };
}

interface F7Router {
  navigate: (url: string, opts?: Record<string, unknown>) => void;
  back: (url?: string, opts?: Record<string, unknown>) => void;
}

export function PersonDetailPage({ f7route, f7router }: { f7route: F7Route; f7router?: F7Router }) {
  const id = f7route.params.id;
  if (!id) return null;
  return <PersonDetailContent personId={id} f7router={f7router} />;
}
