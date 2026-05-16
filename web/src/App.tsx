import { App as KonstaApp } from 'konsta/react';
import { StoreProvider, useStore } from './store';
import { WelcomeView } from './components/WelcomeView';
import { MainTabView } from './components/MainTabView';

function Shell() {
  const { isLoaded } = useStore();
  return isLoaded ? <MainTabView /> : <WelcomeView />;
}

export default function App() {
  return (
    <KonstaApp theme="ios" safeAreas>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </KonstaApp>
  );
}
