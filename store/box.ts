export type Box = {
  x: number
  y: number
  w: number
  h: number
}

export type BoxResizeHandles = 'l' | 'r' | 'b' | 't' | 'tr' | 'br' | 'tl' | 'bl'

/**
 * Devuelve el índice del Box más cercano en la dirección dada.
 * – Si directionVector === [0, 0] ⇒ simplemente el más cercano.
 * – Con vector ≠ 0 ⇒ sólo se consideran cajas en el semiplano “hacia delante”.
 * – Si currentPosition está DENTRO de una de esas cajas, se ignora y se toma la siguiente.
 * – Si ningún Box cumple los criterios, retorna -1.
 */
export function findBoxInTheDirectionOf(
  currentPosition: [number, number],
  directionVector: [number, number],
  boxes: Box[],
): number {
  const [cx, cy] = currentPosition
  const [dx, dy] = directionVector
  const zeroDir = dx === 0 && dy === 0

  if (boxes.length === 0) return -1

  const isInside = ({ x, y, w, h }: Box) =>
    cx >= x && cx <= x + w && cy >= y && cy <= y + h

  // ───────────────────── caso vector cero ─────────────────────
  if (zeroDir) {
    let best = -1
    let bestDist2 = Infinity
    boxes.forEach((b, i) => {
      const vx = b.x + b.w / 2 - cx
      const vy = b.y + b.h / 2 - cy
      const d2 = vx * vx + vy * vy
      if (d2 < bestDist2) {
        bestDist2 = d2
        best = i
      }
    })
    return best
  }

  // ───────────── caso vector no-cero: proyección sobre d ─────────────
  const dirLen = Math.hypot(dx, dy) // ‖d‖
  const candidates: {
    idx: number
    t: number // distancia a lo largo del vector
    perp2: number // distancia perpendicular^2
    inside: boolean
  }[] = []

  boxes.forEach((b, idx) => {
    const vx = b.x + b.w / 2 - cx
    const vy = b.y + b.h / 2 - cy
    const dot = vx * dx + vy * dy
    const t = dot / dirLen // proyección escalar
    if (t <= 0) return // está detrás
    const perp2 = vx * vx + vy * vy - t * t
    candidates.push({ idx, t, perp2, inside: isInside(b) })
  })

  if (candidates.length === 0) return -1

  // primero lo que chocamos antes (t pequeño), luego centrado (perp2 pequeño)
  candidates.sort((a, b) => (a.t !== b.t ? a.t - b.t : a.perp2 - b.perp2))

  for (const c of candidates) if (!c.inside) return c.idx
  return -1
}

export function boxCenter(box: Box): [x: number, y: number] {
  return [box.x + box.w / 2, box.y + box.h / 2]
}

export function boxSurface(box: Box) {
  return box.w * box.h
}

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

export function calculateClosestPoint(
  points: [number, number, any?, any?][],
  center: [number, number],
) {
  // Find closest point to the target center and set it as the latched point
  let closestPoint = points[0]
  let closestDistance = Math.hypot(
    closestPoint[0] - center[0],
    closestPoint[1] - center[1],
  )
  for (let i = 1; i < points.length; i++) {
    const point = points[i]
    const distance = Math.hypot(point[0] - center[0], point[1] - center[1])
    if (distance < closestDistance) {
      closestPoint = point
      closestDistance = distance
    }
  }

  return closestPoint
}
