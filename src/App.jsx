import { useState, useEffect } from 'react';
import HomePage from './page/HomePage';
import HorizonApp from './page/HorizonApp';
import BaseINSApp from './page/BaseINS';
import KoreApp from './page/KoreDoc';

function getRoute() {
  const hash = window.location.hash.replace('#', '').replace(/^\//, '');
  return hash || '/';
}

export default function App() {
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const handleHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  switch (route) {
    case 'horizon':  return <HorizonApp />;
    case 'baseins':  return <BaseINSApp />;
    case 'kore':     return <KoreApp />;
    default:         return <HomePage />;
  }
}