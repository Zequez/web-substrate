import { uplink } from '../uplink/client'
import type { Meta } from './meta'
const framesComponents2 = import.meta.glob('../frames/*.svelte', {
  eager: true,
})
const framesMeta2 = import.meta.glob('../frames/*.meta.json', { eager: true })

const framesCode2 = import.meta.glob('../frames/*.svelte', {
  eager: true,
  as: 'raw',
})

const framesComponents: FramesComponents = {}
for (const path in framesComponents2) {
  const name = path.split('/').pop()!.split('.')[0] // Extract component name (e.g., "ezequiel", "links")
  framesComponents[name!] = {
    Component: (framesComponents2[path] as any).default,
    meta: null!,
    code: framesCode2[path] as any,
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
    code: string
  }
}

// const framesComponents = framesComponentsImport as FramesComponents

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

  async function updateCode(name: string, code: string) {
    components[name].code = code
    await uplink('writeFile', `frames/${name}.svelte`, {
      type: 'text',
      data: code,
    })
  }

  return {
    get all() {
      return components
    },
    updateMeta,
    updateCode,
    rename,
    remove,
  }
}

export { createFramesComponentsStore }
