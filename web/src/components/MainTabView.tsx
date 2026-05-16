import { Tabbar, TabbarLink } from 'konsta/react';
import { useStore } from '../store';
import { PeopleListView } from './PeopleListView';
import { SettingsView } from './SettingsView';
import { TreeView } from './TreeView';

export function MainTabView() {
  const { selectedTab, setSelectedTab } = useStore();
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-hidden">
        {selectedTab === 0 && <TreeView />}
        {selectedTab === 1 && <PeopleListView />}
        {selectedTab === 2 && <SettingsView />}
      </div>
      <Tabbar labels icons className="left-0 bottom-0 fixed">
        <TabbarLink
          active={selectedTab === 0}
          onClick={() => setSelectedTab(0)}
          icon={<TabIcon emoji="🌳" />}
          label="Stammbaum"
        />
        <TabbarLink
          active={selectedTab === 1}
          onClick={() => setSelectedTab(1)}
          icon={<TabIcon emoji="👥" />}
          label="Personen"
        />
        <TabbarLink
          active={selectedTab === 2}
          onClick={() => setSelectedTab(2)}
          icon={<TabIcon emoji="⚙️" />}
          label="Einstellungen"
        />
      </Tabbar>
    </div>
  );
}

function TabIcon({ emoji }: { emoji: string }) {
  return <span className="text-2xl leading-none">{emoji}</span>;
}
