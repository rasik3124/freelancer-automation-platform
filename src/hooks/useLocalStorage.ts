import { useCallback, useState } from "react";

/**
 * useLocalStorage<T>(key, initialValue)
 *
 * Works exactly like useState but persists to localStorage.
 * Safe against JSON.parse errors (falls back to initialValue).
 *
 * @example
 * const [filters, setFilters] = useLocalStorage("invoiceFilters", { status: "all" });
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (v: T | ((prev: T) => T)) => void, () => void] {
  const readValue = (): T => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initialValue;
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const next = value instanceof Function ? value(storedValue) : value;
      window.localStorage.setItem(key, JSON.stringify(next));
      setStoredValue(next);
    } catch (error) {
      console.warn(`useLocalStorage: could not write key "${key}"`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch {}
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
