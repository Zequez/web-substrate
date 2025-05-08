export type Box = {
  x: number
  y: number
  w: number
  h: number
}

export type Frame = {
  box: Box
  content: FrameContent
}

export type FrameContent =
  | {
      type: 'filesExplorer'
      children: Frame[]
    }
  | {
      type: 'file'
      path: string
    }
