import { Tabbar, TabbarLink, Icon } from 'konsta/react';
import { GitBranch, Users, Settings as SettingsIcon } from 'lucide-react';
import { useStore } from '../store';
import { PeopleListView } from './PeopleListView';
import { SettingsView } from './SettingsView';
import { TreeView } from './TreeView';

export function MainTabView() {
  const { selectedTab, setSelectedTab } = useStore();
  return (
    <>
      <div className="absolute inset-0">
        <TabPane active={selectedTab === 0}><TreeView /></TabPane>
        <TabPane active={selectedTab === 1}><PeopleListView /></TabPane>
        <TabPane active={selectedTab === 2}><SettingsView /></TabPane>
      </div>
      <Tabbar labels icons className="left-0 bottom-0 fixed">
        <TabbarLink
          active={selectedTab === 0}
          onClick={() => setSelectedTab(0)}
          icon={<Icon ios={<GitBranch size={26} strokeWidth={1.8} />} />}
          label="Stammbaum"
        />
        <TabbarLink
          active={selectedTab === 1}
          onClick={() => setSelectedTab(1)}
          icon={<Icon ios={<Users size={26} strokeWidth={1.8} />} />}
          label="Personen"
        />
        <TabbarLink
          active={selectedTab === 2}
          onClick={() => setSelectedTab(2)}
          icon={<Icon ios={<SettingsIcon size={26} strokeWidth={1.8} />} />}
          label="Einstellungen"
        />
      </Tabbar>
    </>
  );
}

function TabPane({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <div className="absolute inset-0" style={{ display: active ? 'block' : 'none' }}>{children}</div>;
}
