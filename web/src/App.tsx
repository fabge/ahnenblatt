import { App as F7App, View, Views, Toolbar, Link } from 'framework7-react';
import { StoreProvider, useStore } from './store';
import { WelcomePage } from './components/WelcomePage';
import { TreePage } from './components/TreePage';
import { PeoplePickerPage } from './components/PeoplePickerPage';
import { SettingsView } from './components/SettingsView';
import { PeopleListPage } from './components/PeopleListPage';
import { PersonDetailPage } from './components/PersonDetailPage';

const treeRoutes = [
  {
    path: '/',
    component: PeoplePickerPage,
    master: true,
    detailRoutes: [
      { path: '/tree/', component: TreePage },
    ],
  },
];

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
      <Toolbar tabbar icons bottom>
        <div className="toolbar-pane">
          <Link tabLink="#view-tree" tabLinkActive>
            <i className="icon f7-icons">square_stack_3d_up_fill</i>
            <span className="tabbar-label">Stammbaum</span>
          </Link>
          <Link tabLink="#view-people">
            <i className="icon f7-icons">person_2_fill</i>
            <span className="tabbar-label">Personen</span>
          </Link>
          <Link tabLink="#view-settings">
            <i className="icon f7-icons">gear_alt_fill</i>
            <span className="tabbar-label">Einstellungen</span>
          </Link>
        </div>
      </Toolbar>

      <View
        id="view-tree"
        tab
        tabActive
        url="/tree/"
        routes={treeRoutes}
        masterDetailBreakpoint={768}
      />

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
