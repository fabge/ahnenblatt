import type { ReactNode } from 'react';
import { GitBranch, Users, Settings as SettingsIcon } from 'lucide-react';
import { useStore } from '../store';
import { PeopleListView } from './PeopleListView';
import { SettingsView } from './SettingsView';
import { TreeView } from './TreeView';

interface Tab {
  label: string;
  icon: ReactNode;
}

const TABS: Tab[] = [
  { label: 'Stammbaum', icon: <GitBranch size={22} strokeWidth={1.8} /> },
  { label: 'Personen', icon: <Users size={22} strokeWidth={1.8} /> },
  { label: 'Einstellungen', icon: <SettingsIcon size={22} strokeWidth={1.8} /> },
];

export function MainTabView() {
  const { selectedTab, setSelectedTab } = useStore();
  return (
    <>
      <div className="absolute inset-0">
        <TabPane active={selectedTab === 0}><TreeView /></TabPane>
        <TabPane active={selectedTab === 1}><PeopleListView /></TabPane>
        <TabPane active={selectedTab === 2}><SettingsView /></TabPane>
      </div>
      <nav
        className="
          fixed left-1/2 -translate-x-1/2 z-30
          bottom-[calc(env(safe-area-inset-bottom)+10px)]
          flex items-center gap-1 px-2 py-1.5
          rounded-full
          bg-white/90 dark:bg-zinc-900/85
          backdrop-blur-xl
          shadow-[0_8px_24px_-4px_rgba(0,0,0,0.18)]
          ring-1 ring-black/5 dark:ring-white/10
        "
      >
        {TABS.map((tab, i) => {
          const active = selectedTab === i;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setSelectedTab(i)}
              className={`
                flex flex-col items-center justify-center
                px-4 py-1.5 rounded-full
                transition-colors
                ${active
                  ? 'text-primary'
                  : 'text-black/55 dark:text-white/55 active:bg-black/5 dark:active:bg-white/5'}
              `}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
            >
              {tab.icon}
              <span className="text-[10px] leading-tight mt-0.5 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

function TabPane({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div className="absolute inset-0" style={{ display: active ? 'block' : 'none' }}>
      {children}
    </div>
  );
}
