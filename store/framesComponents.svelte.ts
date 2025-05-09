import { onMount } from 'svelte'
import { uplink, type UplinkFile } from '../uplink/client'
const framesComponents = import.meta.glob('../frames/*.svelte')
const framesMeta = import.meta.glob('../frames/*.meta.json')

export type FramesComponents = {
  [key: string]: {
    meta: Meta
    Component: any
  }
}

export type Meta = {
  box: {
    x: number
    y: number
    w: number
    h: number
  }
  updatedAt: number
}

function createFramesComponentsStore() {
  let components = $state<FramesComponents>({})

  const loadComponents = async () => {
    console.log('Loading components!')
    const comps: FramesComponents = {}
    for (const path in framesComponents) {
      const name = path.split('/').pop()!.split('.')[0] // Extract component name (e.g., "ezequiel", "links")
      const componentModule = (await framesComponents[path]()) as any // Import the Svelte component
      comps[name!] = {
        Component: componentModule.default,
        meta: null!,
      }
    }

    for (const path in framesMeta) {
      const name = path.split('/').pop()!.split('.')[0] // Extract meta file name
      const metaModule = (await framesMeta[path]()) as any // Import the meta JSON
      comps[name!].meta = metaModule.default
    }

    components = comps
  }

  async function updateMeta(name: string, meta: Partial<Meta>) {
    components[name].meta = { ...components[name].meta, ...meta }
    await uplink('writeFile', `frames/${name}.meta.json`, {
      type: 'text',
      data: JSON.stringify(components[name].meta, null, 2),
    })
  }

  async function rename(name: string, newName: string) {
    components[newName] = components[name]
    delete components[name]
    await uplink('renameFrameComponent', name, newName)
  }

  async function remove(name: string) {
    delete components[name]
    await uplink('removeFrameComponent', name)
  }

  onMount(async () => {
    await loadComponents()
  })

  return {
    get all() {
      return components
    },
    updateMeta,
    rename,
    remove,
  }
}

export { createFramesComponentsStore }
