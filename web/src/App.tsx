import { useEffect } from 'react';
import { App as F7App, View, Views, Toolbar, ToolbarPane, Link, f7, f7ready } from 'framework7-react';
import { StoreProvider, useStore } from './store';
import { WelcomePage } from './components/WelcomePage';
import { TreePage } from './components/TreePage';
import { PeoplePickerPage } from './components/PeoplePickerPage';
import { SettingsView } from './components/SettingsView';
import { PeopleListPage } from './components/PeopleListPage';
import { PersonDetailPage, PersonDetailEmpty } from './components/PersonDetailPage';

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

const TAB_BY_PATH: Record<string, string> = {
  '/stammbaum': '#view-tree',
  '/personen': '#view-people',
  '/einstellungen': '#view-settings',
};
const PATH_BY_TAB: Record<string, string> = Object.fromEntries(
  Object.entries(TAB_BY_PATH).map(([p, t]) => [t, p]),
);
const DEFAULT_PATH = '/stammbaum';

const peopleRoutes = [
  {
    path: '/',
    component: PeopleListPage,
    master: true,
    detailRoutes: [
      { path: '/person/:id', component: PersonDetailPage },
      { path: '/none', component: PersonDetailEmpty },
    ],
  },
];

function useTabRouting(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const showTab = (tabId: string) => {
      f7ready(() => f7.tab.show(tabId, false));
    };

    const initial = TAB_BY_PATH[window.location.pathname];
    if (initial) {
      showTab(initial);
    } else {
      window.history.replaceState(null, '', DEFAULT_PATH);
    }

    const onTabShow = (el: HTMLElement) => {
      const path = PATH_BY_TAB[`#${el.id}`];
      if (path && window.location.pathname !== path) {
        window.history.pushState(null, '', path);
      }
    };
    const onPopState = () => {
      const tabId = TAB_BY_PATH[window.location.pathname];
      if (tabId) showTab(tabId);
    };

    f7ready(() => f7.on('tabShow', onTabShow));
    window.addEventListener('popstate', onPopState);
    return () => {
      f7.off('tabShow', onTabShow);
      window.removeEventListener('popstate', onPopState);
    };
  }, [enabled]);
}

function Shell() {
  const { isLoaded, isLoading } = useStore();
  useTabRouting(isLoaded);

  if (isLoading) return null;

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
        <ToolbarPane>
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
        </ToolbarPane>
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
