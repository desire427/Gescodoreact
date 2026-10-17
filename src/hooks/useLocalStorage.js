import { useCallback, useState } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    setStoredValue(previous => {
      const valueToStore = value instanceof Function ? value(previous) : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn('useLocalStorage error:', error);
      }
      return valueToStore;
    });
  }, [key]);

  return [storedValue, setValue];
}
