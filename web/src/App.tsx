import { App as F7App, View, Views, Toolbar, Link } from 'framework7-react';
import { GitBranch, Users, Settings as SettingsIcon } from 'lucide-react';
import { StoreProvider, useStore } from './store';
import { WelcomePage } from './components/WelcomePage';
import { TreeView } from './components/TreeView';
import { SettingsView } from './components/SettingsView';
import { PeopleListPage } from './components/PeopleListPage';
import { PersonDetailPage } from './components/PersonDetailPage';

const peopleRoutes = [
  {
    path: '/',
    component: PeopleListPage,
    master: true,
    detailRoutes: [
      { path: '/person/:id', component: PersonDetailPage },
    ],
  },
];

function Shell() {
  const { isLoaded } = useStore();

  if (!isLoaded) {
    return (
      <View main>
        <WelcomePage />
      </View>
    );
  }

  return (
    <Views tabs className="safe-areas">
      <Toolbar tabbar bottom>
        <Link tabLink="#view-tree" tabLinkActive>
          <GitBranch size={22} strokeWidth={1.8} />
          <span className="tabbar-label">Stammbaum</span>
        </Link>
        <Link tabLink="#view-people">
          <Users size={22} strokeWidth={1.8} />
          <span className="tabbar-label">Personen</span>
        </Link>
        <Link tabLink="#view-settings">
          <SettingsIcon size={22} strokeWidth={1.8} />
          <span className="tabbar-label">Einstellungen</span>
        </Link>
      </Toolbar>

      <View id="view-tree" tab tabActive>
        <TreeView />
      </View>

      <View
        id="view-people"
        tab
        url="/"
        routes={peopleRoutes}
        masterDetailBreakpoint={768}
      />

      <View id="view-settings" tab>
        <SettingsView />
      </View>
    </Views>
  );
}

export default function App() {
  return (
    <F7App theme="ios" name="Stammbaum" darkMode="auto">
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </F7App>
  );
}
