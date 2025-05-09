export type Box = {
  x: number
  y: number
  w: number
  h: number
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
