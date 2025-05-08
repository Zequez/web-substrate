import { maybeReadLS } from '../center/snippets/utils'
import { uplink } from '../uplink/client'
import { onMount } from 'svelte'

type Thing<T> = {
  uuid: string
  updatedAt: number
  value: T
  deletedAt: number | null
}

type ThingOnBackends<T> = {
  ls: Thing<T> | null
  fs: Thing<T> | null
}

function createLSBackend<T>(lsKey: string) {
  const things = $state<{ [key: string]: Thing<T> }>(
    maybeReadLS(lsKey, {}) as { [key: string]: Thing<T> },
  )

  function save() {
    localStorage.setItem(lsKey, JSON.stringify(things))
  }

  return {
    loaded: true,
    set(t: Thing<T>) {
      things[t.uuid] = t
      save()
    },
    get all() {
      return things
    },
  }
}

function createFSBackend<T>(fsKey: string) {
  const things = $state<{ [key: string]: Thing<T> }>({})
  const loaded = $state(false)

  onMount(() => {
    uplink('filesList', `storage/${fsKey}`).then((fileslist) => {
      fileslist.forEach((uuid) => {
        console.log('UUID on filesystem', uuid)
      })
    })
  })

  return {
    get loaded() {
      return loaded
    },
    set(t: Thing<T>) {
      // Optimistic update
      const prev = things[t.uuid]
      things[t.uuid] = t
      uplink('writeFile', `storage/${fsKey}/${t.uuid}.json`, {
        type: 'text',
        data: JSON.stringify(t),
      })
        .then((success) => {
          // Nothing
        })
        .catch((e) => {
          things[t.uuid] = prev
        })
    },
    get all() {
      return things
    },
  }
}

function createThingsStore<T>(config: { lsKey: string; fsKey: string }) {
  const ls = createLSBackend<T>(config.lsKey)
  const fs = createFSBackend<T>(config.fsKey)

  function create(thingValue: T) {
    const thing = {
      uuid: crypto.randomUUID(),
      updatedAt: Date.now(),
      value: thingValue,
      deletedAt: null,
    }
    ls.set(thing)
    fs.set(thing)
  }

  function update(uuid: string, value: Partial<T>) {
    const thing = {
      ...ls.all[uuid],
      value: { ...ls.all[uuid].value, ...value },
      updatedAt: Date.now(),
    }
    ls.set(thing)
    fs.set(thing)
  }

  function remove(uuid: string) {
    const thing = { ...ls.all[uuid], deletedAt: Date.now() }
    ls.set(thing)
    fs.set(thing)
  }

  return {
    create,
    update,
    remove,
    get all() {
      return ls.all
    },
  }
}

// function mapThings<T, K>(
//   thingsMap: { [key: string]: Thing<T> },
//   mapFun: (thing: Thing<T>) => K,
// ) {
//   return Object.fromEntries(
//     Object.entries(thingsMap).map(([k, v]) => [k, mapFun(v)]),
//   )
// }

export { createThingsStore }
