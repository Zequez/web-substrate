import { getContext, setContext } from 'svelte'

type StoreConfig = { initialPath: string[] }

function createLandNavigationStore(config: StoreConfig) {
  let landPath = $state<string[]>(
    (() => {
      try {
        return JSON.parse(localStorage.getItem('landPath') || '[]')
      } catch (e) {
        return []
      }
    })(),
  )

  $effect(() => {
    localStorage.setItem('landPath', JSON.stringify(landPath))
  })

  function navigateInto(nextPath: string) {
    landPath.push(nextPath)
  }

  function navigateUp(num: number) {
    landPath = landPath.slice(0, landPath.length - num)
  }

  return {
    into: navigateInto,
    up: navigateUp,
    get path() {
      return landPath
    },
  }
}

export default {
  createContext: (config: StoreConfig) => {
    const store = createLandNavigationStore(config)
    setContext('land-navigation-store', store)
  },
  get store() {
    return getContext('land-navigation-store') as ReturnType<
      typeof createLandNavigationStore
    >
  },
}
