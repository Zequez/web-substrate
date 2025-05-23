<script lang="ts">
  import { cx } from '../center/snippets/utils'
  import { containingBox, type Box } from '../store/box'
  import type { FrameLand } from '../store/lands-types'
  import { onMount } from 'svelte'

  const { frames }: { frames: FrameLand } = $props()

  const gridSize = 30

  let el = $state<HTMLDivElement>(null!)
  let justVisibleBoxes = $derived(
    Object.values(frames)
      .map((f) => {
        let visible = []
        if (f.meta.bodies.code.visible) visible.push(f.meta.bodies.code.box)
        if (f.meta.bodies.main.visible) visible.push(f.meta.bodies.main.box)
        if (f.meta.bodies.inner.visible) visible.push(f.meta.bodies.inner.box)
        return visible
      })
      .reduce((a, b) => a.concat(b), []),
  )

  let calculatedContainingBox = $derived(containingBox(justVisibleBoxes))
  let vp = $state<{ w: number; h: number } | null>(null)
  let zoomToFit = $state(1)
  let offsetXToCenter = $state(0)
  let offsetYToCenter = $state(0)

  const transform = $derived.by(() => {
    if (!calculatedContainingBox) return ''
    const x = -calculatedContainingBox.x
    const y = -calculatedContainingBox.y

    const units = gridSize
    return `transform: translateX(${x * units * zoomToFit}px) translateY(${y * units * zoomToFit}px) scale(${zoomToFit})`
  })

  $effect(() => {
    if (calculatedContainingBox && vp) {
      let box = calculatedContainingBox
      const w = box.w * gridSize
      const h = box.h * gridSize
      const zoomForW = vp.w / w
      const zoomForH = vp.h / h
      const newZoom = Math.min(zoomForW, zoomForH)
      offsetXToCenter =
        zoomForW > zoomForH ? (vp.w - w * newZoom) / 2 / newZoom : 0
      offsetYToCenter =
        zoomForH > zoomForW ? (vp.h - h * newZoom) / 2 / newZoom : 0
      zoomToFit = newZoom
    }
  })

  onMount(() => {
    function assignViewport() {
      if (el && el.clientWidth && el.clientHeight) {
        vp = { w: el.clientWidth, h: el.clientHeight }
      }
    }
    assignViewport()

    const resizeObserver = new ResizeObserver((entries) => {
      assignViewport()
    })
    resizeObserver.observe(el)
  })

  const boxToPx = (box: Box): Box => ({
    x: box.x * gridSize,
    y: box.y * gridSize,
    w: box.w * gridSize,
    h: box.h * gridSize,
  })

  function boxStyle(box: Box, scale: number = 1) {
    const pxBox = boxToPx(box)
    return `
      width: ${pxBox.w}px;
      height: ${pxBox.h}px;
      transform: translateX(${pxBox.x}px) translateY(${pxBox.y}px) scale(${scale});
      left: ${offsetXToCenter}px;
      top: ${offsetYToCenter}px;
    `
  }
</script>

{#snippet frameBox(box: Box, name: string)}
  <div
    class="absolute bg-gray-100 rounded-lg flexcc text-[5vw] text-center"
    style={boxStyle(box)}
  >
    {name}
  </div>
{/snippet}

<div
  bind:this={el}
  role="presentation"
  class={cx('absolute inset-0 overflow-hidden')}
>
  <div
    class={cx(
      'absolute top-0 left-0 size-full transform-origin-tl will-change-transform',
      {
        'z-frames-container': false,
      },
    )}
    style={transform}
  >
    <!-- {@render frameBox({ x: 0, y: 0, w: 10, h: 10 }, '0 0')} -->
    <!-- {@render frameBox(calculatedContainingBox!, 'FULL')} -->
    {#each Object.entries(frames) as [name, frame] (name)}
      {#if frame.meta.bodies.main.visible}
        {@render frameBox(frame.meta.bodies.main.box, name)}
      {/if}
      {#if frame.meta.bodies.code.visible}
        {@render frameBox(frame.meta.bodies.code.box, name)}
      {/if}
      {#if frame.meta.bodies.inner.visible}
        {@render frameBox(frame.meta.bodies.inner.box, name)}
      {/if}
    {/each}
  </div>
</div>
