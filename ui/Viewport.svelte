<script lang="ts">
  import { onMount } from 'svelte'
  import { cx } from '../center/snippets/utils'
  import SS from '../store/store.svelte.ts'
  import type { Pos, Viewport, ViewportContext } from '../store/space.svelte'

  const S = SS.store
  const SP = SS.store.space

  const {
    children,
    viewportContext,
    visualizeCenter,
  }: {
    children: any
    viewportContext: ViewportContext
    visualizeCenter: boolean
  } = $props()

  $effect(() => {
    viewportContext.parentPos.x,
      viewportContext.parentPos.y,
      viewportContext.parentPos.z
    triggerViewportChange()
  })

  const transform = $derived.by(() => {
    const { x, y, z } = SP.pos
    const units = SP.grid.size
    return `transform: translateX(${(x * units + SP.vp.renderedWidth / 2) * z}px) translateY(${(y * units + SP.vp.renderedHeight / 2) * z}px) scale(${z})`
  })

  let el = $state<HTMLDivElement>(null!)

  function triggerViewportChange() {
    const {
      width,
      height,
      left: offsetX,
      top: offsetY,
    } = el.getBoundingClientRect()

    const screenW = window.innerWidth
    const screenH = window.innerHeight

    if (viewportContext.parentPos.z) {
      SP.cmd.setViewport({
        width: width / viewportContext.parentPos.z,
        height: height / viewportContext.parentPos.z,
        renderedWidth: width,
        renderedHeight: height,
        offsetX,
        offsetY,
        screenW,
        screenH,
        scaled: viewportContext.parentPos.z,
      })
    }
  }

  onMount(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      triggerViewportChange()
    })
    resizeObserver.observe(el)

    window.addEventListener('resize', triggerViewportChange)

    triggerViewportChange()

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', triggerViewportChange)
    }
  })

  function handleKeyDown(ev: KeyboardEvent) {
    // console.log('Key down', ev.key)
    // if (ev.key === 'Escape') {
    //   S.cmd('exit-focus-mode')
    // } else if (ev.key === 'ArrowUp') {
    //   S.cmd('shift-focus-to-direction', [0, -1])
    // } else if (ev.key === 'ArrowDown') {
    //   S.cmd('shift-focus-to-direction', [0, 1])
    // } else if (ev.key === 'ArrowLeft') {
    //   S.cmd('shift-focus-to-direction', [-1, 0])
    // } else if (ev.key === 'ArrowRight') {
    //   S.cmd('shift-focus-to-direction', [1, 0])
    // } else if (ev.key === 'Enter') {
    //   S.cmd('shift-focus-to-direction', [0, 0])
    // }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if visualizeCenter}
  <div
    class="absolute top-1/2 left-1/2 w2 h2 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 z-2000"
  >
    <span
      class="bg-black/50 text-white rounded-md px1 py0.2 absolute top-1/2 left-full ml2 -translate-y-1/2"
      >{SP.screenCenter.map(Math.round)}</span
    >
  </div>
{/if}

<!-- bind:this={S.containerEl} -->
<div
  bind:this={el}
  onmouseup={(ev) => S.ev.mouseup(ev, 'space')}
  onmousemove={(ev) => S.ev.mousemove(ev, 'space')}
  onwheel={(ev) => S.ev.wheel(ev, 'space')}
  onmousedown={(ev) => S.ev.mousedown(ev, 'space')}
  oncontextmenu={(ev) => ev.preventDefault()}
  role="presentation"
  class={cx('absolute inset-0 overflow-hidden ', {
    'cursor-grabbing': S.dragState.type === 'panning',
    'cursor-cell': S.dragState.type === 'createFrame',
  })}
>
  <!-- This centers the grid so that 0,0 is in the middle of the screen -->
  <div role="presentation" class="absolute inset-0 cursor-">
    <div
      class={cx('absolute top-0 left-0 size-full will-change-transform', {
        'z-frames-container': false,
      })}
      style={transform}
    >
      {#if SP.vp.width && SP.vp.height}
        {@render children?.()}
      {/if}
    </div>
  </div>
</div>
