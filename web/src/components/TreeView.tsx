import { useMemo, useState } from 'react';
import { Page, Navbar, Segmented, SegmentedButton, Block, Range } from 'konsta/react';
import { useStore } from '../store';
import { ancestorLayout, descendantLayout } from '../layout';
import { TreeCanvas } from './TreeCanvas';
import { PersonDetailView } from './PersonDetailView';
import { fullName } from '../types';

type Mode = 'Vorfahren' | 'Nachfahren';

export function TreeView() {
  const { rootPersonId, persons, families } = useStore();
  const [mode, setMode] = useState<Mode>('Vorfahren');
  const [generations, setGenerations] = useState(5);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const layout = useMemo(() => {
    if (!rootPersonId || !persons[rootPersonId]) return null;
    return mode === 'Vorfahren'
      ? ancestorLayout(persons, families, rootPersonId, generations)
      : descendantLayout(persons, families, rootPersonId, generations);
  }, [persons, families, rootPersonId, mode, generations]);

  if (!rootPersonId || !persons[rootPersonId]) {
    return (
      <Page>
        <Navbar title="Stammbaum" large transparent />
        <Block strong inset className="text-center">
          <p className="opacity-60 text-sm">
            Keine Wurzelperson gewählt. Öffne eine Person in der Personenliste und tippe „Als
            Wurzel“.
          </p>
        </Block>
      </Page>
    );
  }

  const root = persons[rootPersonId];

  return (
    <Page>
      <Navbar title={fullName(root)} subtitle="Stammbaum" />
      <Block strong inset className="!my-2">
        <Segmented strong>
          <SegmentedButton active={mode === 'Vorfahren'} onClick={() => setMode('Vorfahren')}>
            Vorfahren
          </SegmentedButton>
          <SegmentedButton active={mode === 'Nachfahren'} onClick={() => setMode('Nachfahren')}>
            Nachfahren
          </SegmentedButton>
        </Segmented>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm opacity-60 w-20 shrink-0">Gen. {generations}</span>
          <Range
            min={2}
            max={8}
            step={1}
            value={generations}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGenerations(Number(e.currentTarget.value))}
          />
        </div>
      </Block>
      <div className="px-4">
        <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10" style={{ height: 'calc(100vh - 280px)' }}>
          {layout && (
            <TreeCanvas
              layout={layout}
              persons={persons}
              mode={mode}
              onPersonTap={(id) => setSelectedId(id)}
            />
          )}
        </div>
      </div>
      {selectedId && (
        <PersonDetailView personId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </Page>
  );
}
