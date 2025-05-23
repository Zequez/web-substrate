<script lang="ts">
  import type { Pos, Viewport } from '../store/space.svelte'
  import type { FrameBody } from '../store/lands-types'

  const {
    pos,
    vp,
    gridSize,
    focusablePoints,
    currentFocus,
  }: {
    focusablePoints: [string, FrameBody, [number, number], number][]
    pos: Pos
    vp: Viewport
    gridSize: number
    currentFocus: [string, FrameBody]
  } = $props()

  let el = $state<HTMLCanvasElement>(null!)
  let ctx = $derived(el ? el.getContext('2d')! : null!)

  let center = $state<[number, number]>([0, 0])
  let speed = $state<[number, number]>([0, 0])

  let prevWidth = 0
  let prevHeight = 0
  $effect(() => {
    if (vp.width !== prevWidth || vp.height !== prevHeight) {
      el.width = vp.width
      el.height = vp.height
    }

    if (ctx && vp.width > 0 && vp.height > 0) {
      renderField()
    }

    prevHeight = vp.height
    prevWidth = vp.width
  })

  function renderField() {
    // Clear the canvas
    ctx.clearRect(0, 0, vp.width, vp.height)

    // Render each focusable point
    for (const [name, body, [x, y], mass] of focusablePoints) {
      const physicalX = (x + pos.x) * gridSize * pos.z + vp.width / 2
      const physicalY = (y + pos.y) * gridSize * pos.z + vp.height / 2

      const color =
        name === currentFocus[0] && currentFocus[1] === body ? 'red' : 'green'

      ctx.fillStyle = color
      ctx.beginPath()
      // const size = mass * 0.3 * pos.z;
      const size = 20
      ctx.arc(physicalX, physicalY, size, 0, 2 * Math.PI)
      ctx.fill()
    }
  }
</script>

<canvas
  class="h-full w-full absolute top-0 left-0 z-2000 pointer-events-none"
  bind:this={el}
></canvas>
