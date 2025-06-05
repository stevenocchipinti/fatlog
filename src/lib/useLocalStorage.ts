import { useCallback, useState } from "react"

function useLocalStorage<T>(
  key: string,
  initialValue: T,
  mapper: (item: unknown) => T = x => x as T,
) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? mapper(JSON.parse(item)) : initialValue
    } catch (error) {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        setStoredValue(prevValue => {
          const valueToStore =
            value instanceof Function ? value(prevValue) : value
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
          return valueToStore
        })
      } catch (error) {
        console.warn(error)
      }
    },
    [key],
  )

  const deleteValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.warn(error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, deleteValue] as const
}

export default useLocalStorage
