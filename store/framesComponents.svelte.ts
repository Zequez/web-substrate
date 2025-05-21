import type { Component } from 'svelte'
import { uplink } from '../uplink/client'
// import type { Meta } from './meta'
import Empty from '../ui/Empty.svelte'
import type { Box } from './box'
const svelteCompiledFiles = import.meta.glob('../land/**/*.svelte', {
  eager: true,
})
const metaFiles = import.meta.glob('../land/**/*.meta.json', {
  eager: true,
})

const svelteRawFiles = import.meta.glob('../land/**/*.svelte', {
  eager: true,
  query: '?raw',
})

type Meta = {
  box: Box
  updatedAt: number
  codeBox: Box
  showCodeBox: boolean
  data: any
  // bodies: {
  //   main: Box,
  //   code: Box
  // },
  // showBodies: {
  //   main: boolean,
  //   code: boolean
  // }
}

type Frame = {
  meta: Meta
  Component: Component
  code: string
  inner: FrameLand
}

type FrameLand = { [key: string]: Frame }

const rootFrame: Frame = createEmptyFrame()

function cleanName(importName: string) {
  return importName
    .replace(/^\.\.\/land\//, '')
    .replace(/\.svelte$/, '')
    .replace(/\.meta\.json$/, '')
}

function createGetLeaf(cleanPath: string): Frame {
  const parts = cleanPath.split(/\//g)
  let currentFrame = rootFrame
  while (parts.length) {
    let nextLandName = parts.shift()!
    if (!currentFrame.inner![nextLandName]) {
      currentFrame.inner![nextLandName] = createEmptyFrame()
    }

    currentFrame = currentFrame.inner![nextLandName]
  }

  return currentFrame
}

function getLeaf(frame: Frame, cleanPath: string): Frame {
  const parts = cleanPath.split(/\//g)
  let currentFrame = frame
  while (parts.length) {
    let nextLandName = parts.shift()!
    if (!currentFrame.inner![nextLandName]) {
      throw "Frame doesn't exist"
    }

    currentFrame = currentFrame.inner![nextLandName]
  }

  return currentFrame
}

function moveLeaf(frame: Frame, cleanPath: string, newCleanPath: string) {
  const parts = cleanPath.split(/\//g)
  let prevFrame: Frame = null!
  let currentFrame = frame
  let nextLandName: string = null!
  while (parts.length) {
    nextLandName = parts.shift()!
    if (!currentFrame.inner![nextLandName]) {
      throw "Frame doesn't exist"
    }

    prevFrame = currentFrame
    currentFrame = currentFrame.inner![nextLandName]
  }

  const leaf = currentFrame

  currentFrame = frame

  const newParts = newCleanPath.split(/\//g)
  while (newParts.length) {
    const nextLandName = newParts.shift()!
    if (newParts.length) {
      if (!currentFrame.inner![nextLandName]) {
        currentFrame.inner![nextLandName] = createEmptyFrame()
      }
    } else {
      if (!currentFrame.inner![nextLandName]) {
        currentFrame.inner![nextLandName] = leaf
      } else {
        throw 'Target location is occuppied'
      }
    }

    currentFrame = currentFrame.inner![nextLandName]
  }

  delete prevFrame.inner![nextLandName]

  return currentFrame
}

function removeLeaf(cleanPath: string) {
  const parts = cleanPath.split(/\//g)
  let currentFrame = rootFrame
  let nextLandName: string = null!
  while (parts.length) {
    nextLandName = parts.shift()!
    if (!currentFrame.inner![nextLandName]) {
      throw "Frame doesn't exist"
    }

    if (parts.length) {
      currentFrame = currentFrame.inner![nextLandName]
    } else {
      delete currentFrame.inner![nextLandName]
    }
  }
}

function createEmptyFrame(): Frame {
  return {
    meta: defaultMeta(),
    Component: Empty,
    code: '<div></div>',
    inner: {},
  }
}

function defaultMeta(): Meta {
  return {
    box: { x: 0, y: 0, w: 5, h: 5 },
    updatedAt: 0,
    codeBox: { x: 5, y: 0, w: 5, h: 5 },
    showCodeBox: true,
    data: null,
  }
}

function walkLandsImports() {
  for (let path in svelteCompiledFiles) {
    const leaf = createGetLeaf(cleanName(path))
    leaf.Component = (svelteCompiledFiles[path] as any).default as Component
  }

  for (let path in svelteRawFiles) {
    const leaf = createGetLeaf(cleanName(path))
    leaf.code = (svelteRawFiles[path] as any).default as string
  }

  for (let path in metaFiles) {
    const leaf = createGetLeaf(cleanName(path))
    leaf.meta = (metaFiles[path] as any).default
  }
}

walkLandsImports()

// console.log(rootFrame)
// throw 'ars'

// const framesComponents: FramesComponents = {}
// for (const path in svelteCompiledFiles) {
//   const name = path.split('/').pop()!.split('.')[0] // Extract component name (e.g., "ezequiel", "links")
//   framesComponents[name!] = {
//     Component: (svelteCompiledFiles[path] as any).default,
//     meta: null!,
//     code: svelteRawFiles[path] as any,
//   }
// }

// for (const path in metaFiles) {
//   const name = path.split('/').pop()!.split('.')[0] // Extract meta file name
//   framesComponents[name!].meta = (metaFiles[path] as any).default
// }

// import framesComponentsImport from '../framesImport.generated'

// export type FramesComponents = {
//   [key: string]: {
//     meta: Meta
//     Component: any
//     code: string
//   }
// }

// const framesComponents = framesComponentsImport as FramesComponents

function createFramesComponentsStore() {
  let root = $state<Frame>(rootFrame)
  let lands = $derived<FrameLand>(root.inner!)

  async function updateMeta(path: string, meta: Partial<Meta>) {
    const frame = getLeaf(root, path)
    frame.meta = { ...frame.meta, ...meta }
    await uplink('writeFile', `frames/${path}.meta.json`, {
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
    // await uplink('writeFile', `frames/${name}.svelte`, {
    //   type: 'text',
    //   data: code,
    // })
  }

  return {
    get all() {
      return lands
    },
    updateMeta,
    updateCode,
    create,
    rename,
    remove,
  }
}

export { createFramesComponentsStore }
