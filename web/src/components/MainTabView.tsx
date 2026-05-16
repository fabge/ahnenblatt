import { Tabbar, TabbarLink, Icon } from 'konsta/react';
import { useStore } from '../store';
import { PeopleListView } from './PeopleListView';
import { SettingsView } from './SettingsView';
import { TreeView } from './TreeView';

const TABBAR_PB = 'pb-[calc(env(safe-area-inset-bottom)+50px)]';

export function MainTabView() {
  const { selectedTab, setSelectedTab } = useStore();
  return (
    <>
      <div className={`h-full ${TABBAR_PB}`}>
        <TabPane active={selectedTab === 0}><TreeView /></TabPane>
        <TabPane active={selectedTab === 1}><PeopleListView /></TabPane>
        <TabPane active={selectedTab === 2}><SettingsView /></TabPane>
      </div>
      <Tabbar labels icons className="left-0 bottom-0 fixed">
        <TabbarLink
          active={selectedTab === 0}
          onClick={() => setSelectedTab(0)}
          icon={<Icon ios={<TreeIcon />} />}
          label="Stammbaum"
        />
        <TabbarLink
          active={selectedTab === 1}
          onClick={() => setSelectedTab(1)}
          icon={<Icon ios={<PeopleIcon />} />}
          label="Personen"
        />
        <TabbarLink
          active={selectedTab === 2}
          onClick={() => setSelectedTab(2)}
          icon={<Icon ios={<GearIcon />} />}
          label="Einstellungen"
        />
      </Tabbar>
    </>
  );
}

function TabPane({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <div className="h-full" style={{ display: active ? 'block' : 'none' }}>{children}</div>;
}

function TreeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="2" />
      <circle cx="5" cy="14" r="2" />
      <circle cx="19" cy="14" r="2" />
      <circle cx="5" cy="20" r="1.5" />
      <circle cx="19" cy="20" r="1.5" />
      <path d="M12 6v3M12 9H5v3M12 9h7v3M5 16v2M19 16v2" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <circle cx="17" cy="9.5" r="2.6" />
      <path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" />
      <path d="M14.5 19c0-2.4 2-4 4.2-4 1.2 0 2.3.5 3 1.2" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 14a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 18.3a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 8a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 3.7a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V8a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}
