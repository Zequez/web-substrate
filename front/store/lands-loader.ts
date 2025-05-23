import { type Component } from 'svelte'
import {
  type Frame,
  type Meta,
  type FrameBody,
  type FrameLand,
} from './lands-types'
import Empty from '../ui/Empty.svelte'

const svelteCompiledFiles = import.meta.glob('@@/**/*.svelte', {
  eager: true,
})
const metaFiles = import.meta.glob('@@/**/*.meta.json', {
  eager: true,
})

const svelteRawFiles = import.meta.glob('@@/**/*.svelte', {
  eager: true,
  query: '?raw',
})

const rootFrame: Frame = createEmptyFrame()

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
    bodies: {
      main: {
        box: { x: 0, y: 0, w: 5, h: 5 },
        visible: true,
      },
      code: {
        box: { x: 0, y: 0, w: 5, h: 5 },
        visible: true,
      },
      inner: {
        box: { x: 0, y: 0, w: 5, h: 5 },
        visible: true,
      },
    },
    updatedAt: 0,
    data: null,
  }
}

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

export function getLeaf(frame: Frame, cleanPath: string): Frame {
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

export function moveLeaf(
  frame: Frame,
  cleanPath: string,
  newCleanPath: string,
) {
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

export function removeLeaf(cleanPath: string) {
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

export { rootFrame }
