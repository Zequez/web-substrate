import { uplink } from '../uplink/client'
const framesComponents2 = import.meta.glob('../frames/*.svelte', {
  eager: true,
})
const framesMeta2 = import.meta.glob('../frames/*.meta.json', { eager: true })

const framesComponents: FramesComponents = {}
for (const path in framesComponents2) {
  const name = path.split('/').pop()!.split('.')[0] // Extract component name (e.g., "ezequiel", "links")
  framesComponents[name!] = {
    Component: (framesComponents2[path] as any).default,
    meta: null!,
  }
}

for (const path in framesMeta2) {
  const name = path.split('/').pop()!.split('.')[0] // Extract meta file name
  framesComponents[name!].meta = (framesMeta2[path] as any).default
}

// import framesComponentsImport from '../framesImport.generated'

export type FramesComponents = {
  [key: string]: {
    meta: Meta
    Component: any
  }
}

// const framesComponents = framesComponentsImport as FramesComponents

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
  let components = $state<FramesComponents>(framesComponents)

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
