import { uplink } from '../../back/uplink/client'
import type { Box } from './box'
import {
  type Frame,
  type FrameLand,
  type Meta,
  type FrameBody,
} from './lands-types'
import { rootFrame, getLeaf, moveLeaf, removeLeaf } from './lands-loader'
import { getContext, setContext } from 'svelte'

type LandsStoreConfig = {}

function createLandsStore(config: LandsStoreConfig) {
  let root = $state<Frame>(rootFrame)
  let lands = $derived<FrameLand>(root.inner!)

  async function updateMeta(path: string, meta: Partial<Meta>) {
    const frame = getLeaf(root, path)
    frame.meta = { ...frame.meta, ...meta }
    await uplink('writeFile', `land/${path}.meta.json`, {
      type: 'text',
      data: JSON.stringify(frame.meta, null, 2),
    })
  }

  async function updateBodyBox(path: string, body: FrameBody, box: Box) {
    const frame = getLeaf(root, path)
    frame.meta.bodies[body].box = box
    await uplink('writeFile', `land/${path}.meta.json`, {
      type: 'text',
      data: JSON.stringify(frame.meta, null, 2),
    })
  }

  async function updateBodyVisibility(
    path: string,
    body: FrameBody,
    visible: boolean,
  ) {
    const frame = getLeaf(root, path)
    frame.meta.bodies[body].visible = visible
    await uplink('writeFile', `land/${path}.meta.json`, {
      type: 'text',
      data: JSON.stringify(frame.meta, null, 2),
    })
  }

  async function rename(path: string, newPath: string) {
    moveLeaf(root, path, newPath)
    await uplink('renameFrameComponent', path, newPath)
  }

  async function remove(path: string) {
    removeLeaf(path)
    await uplink('removeFrameComponent', path)
  }

  async function create(path: string, meta: Meta, code: string) {
    await uplink(
      'createFrameComponent',
      path,
      JSON.stringify(meta, null, 2),
      code,
    )
  }

  async function updateCode(path: string, code: string) {
    const frame = getLeaf(root, path)
    frame.code = code
    await uplink('writeFile', `land/${path}.svelte`, {
      type: 'text',
      data: code,
    })
  }

  function prependPath<T>(path: string, fun: T) {
    return async function (...args: any[]) {
      console.log(path)
      if (path) {
        args[0] = path + '/' + args[0]
      }
      return (fun as any)(...args)
    } as T
  }

  return {
    get all() {
      return lands
    },
    at(atPath: string) {
      return {
        get all() {
          return atPath ? getLeaf(root, atPath).inner : lands
        },
        updateMeta: prependPath(atPath, updateMeta),
        updateBodyBox: prependPath(atPath, updateBodyBox),
        updateBodyVisibility: prependPath(atPath, updateBodyVisibility),
        updateCode: prependPath(atPath, updateCode),
        create: prependPath(atPath, create),
        rename: prependPath(atPath, rename),
        remove: prependPath(atPath, remove),
      }
    },
    updateMeta,
    updateBodyBox,
    updateBodyVisibility,
    updateCode,
    create,
    rename,
    remove,
  }
}

export default {
  createLandsStoreContext: (storeConfig: LandsStoreConfig) => {
    const store = createLandsStore(storeConfig)
    setContext('lands-store', store)
  },
  get landsStore() {
    return getContext('lands-store') as ReturnType<typeof createLandsStore>
  },
}
