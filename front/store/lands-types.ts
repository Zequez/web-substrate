import type { Component } from 'svelte'
import type { Box } from './box'

export type Meta = {
  updatedAt: number
  data: any
  bodies: {
    main: {
      box: Box
      visible: boolean
    }
    code: {
      box: Box
      visible: boolean
    }
    inner: {
      box: Box
      visible: boolean
    }
  }
}

export type FrameBody = 'main' | 'code' | 'inner'

export type Frame = {
  meta: Meta
  Component: Component
  code: string
  inner: FrameLand
}

export type FrameLand = { [key: string]: Frame }
