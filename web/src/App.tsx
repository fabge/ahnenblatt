import { useEffect, useState } from 'react';
import { App as KonstaApp } from 'konsta/react';
import { StoreProvider, useStore } from './store';
import { WelcomeView } from './components/WelcomeView';
import { MainTabView } from './components/MainTabView';

function Shell() {
  const { isLoaded } = useStore();
  return isLoaded ? <MainTabView /> : <WelcomeView />;
}

function usePrefersDark() {
  const [dark, setDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return dark;
}

export default function App() {
  const dark = usePrefersDark();
  return (
    <KonstaApp theme="ios" safeAreas dark={dark}>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </KonstaApp>
  );
}
