export type Box = {
  x: number
  y: number
  w: number
  h: number
}

export type BoxResizeHandles = 'l' | 'r' | 'b' | 't' | 'tr' | 'br' | 'tl' | 'bl'

export function pos2box(
  pos1: [x: number, y: number],
  pos2: [x: number, y: number],
) {
  const [x1, y1] = pos1
  const [x2, y2] = pos2

  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.abs(x1 - x2) + 1, // siempre ≥ 1 (0 → 1, 1 → 2, …)
    h: Math.abs(y1 - y2) + 1, // idem
  }
}

export function boxIsBigEnough(box: Box) {
  return box.w >= MIN_SIZE && box.h >= MIN_SIZE
}

const MIN_SIZE = 3

export function resizeBox(
  resizeHandle: BoxResizeHandles,
  box: Box,
  deltaX: number,
  deltaY: number,
) {
  switch (resizeHandle) {
    case 'l':
      return {
        ...box,
        x: Math.min(box.x + deltaX, box.x + box.w - MIN_SIZE),
        w: Math.max(MIN_SIZE, box.w - deltaX),
      }
    case 'r':
      return {
        ...box,
        w: Math.max(MIN_SIZE, box.w + deltaX),
      }
    case 't':
      return {
        ...box,
        y: Math.min(box.y + deltaY, box.y + box.h - MIN_SIZE),
        h: Math.max(MIN_SIZE, box.h - deltaY),
      }
    case 'b':
      return {
        ...box,
        h: Math.max(MIN_SIZE, box.h + deltaY),
      }
    case 'br':
      return {
        ...box,
        h: Math.max(MIN_SIZE, box.h + deltaY),
        w: Math.max(MIN_SIZE, box.w + deltaX),
      }
    case 'tl':
      return {
        ...box,
        y: Math.min(box.y + deltaY, box.y + box.h - MIN_SIZE),
        h: Math.max(2, box.h - deltaY),
        x: Math.min(box.x + deltaX, box.x + box.w - MIN_SIZE),
        w: Math.max(2, box.w - deltaX),
      }
    case 'tr':
      return {
        ...box,
        y: Math.min(box.y + deltaY, box.y + box.h - MIN_SIZE),
        h: Math.max(MIN_SIZE, box.h - deltaY),
        w: Math.max(MIN_SIZE, box.w + deltaX),
      }
    case 'bl':
      return {
        ...box,
        h: Math.max(MIN_SIZE, box.h + deltaY),
        x: Math.min(box.x + deltaX, box.x + box.w - MIN_SIZE),
        w: Math.max(MIN_SIZE, box.w - deltaX),
      }
  }
}
