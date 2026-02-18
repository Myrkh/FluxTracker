import { useState, useCallback } from 'react';

export function useNotification() {
  const [notification, setNotification] = useState(null);
  const show = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);
  return { notification, show, clear: () => setNotification(null) };
}
