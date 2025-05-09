<script lang="ts">
  import type { Meta } from '../store/framesComponents.svelte'
  import SS from '../store/store.svelte.ts'
  import ResizeHandles from './ResizeHandles.svelte'
  import SpaceBox from './SpaceBox.svelte'

  const S = SS.store

  const {
    name,
    meta,
    Component,
  }: { name: string; meta: Meta; Component: any } = $props()

  function onBlurFrameNameEditor(ev: FocusEvent, frameName: string) {
    const newFrameName = (ev.currentTarget as HTMLDivElement).innerText.trim()
    console.log(newFrameName)
    S.cmd('rename-frame', frameName, newFrameName)
  }

  const box = $derived(
    S.dragState.type === 'moveFrame' && S.dragState.name === name
      ? S.dragState.resultingBox
      : S.dragState.type === 'resizeFrame' && S.dragState.name === name
        ? S.dragState.resultingBox
        : meta.box,
  )
</script>

<div style={S.space.boxStyle(box)} class="absolute group/frame">
  <div
    class="bg-blue-100 tracking-wider font-mono absolute top-0 w-full rounded-t-md px2 flexcs cursor-move"
    style={`height: ${S.space.grid.size}px;`}
    role="button"
    tabindex="0"
    onmousedown={(ev) => S.ev.mousedown(ev, 'frame', name)}
  >
    /
    <div
      contenteditable="true"
      role="textbox"
      tabindex="0"
      class="cursor-text bg-transparent rounded-sm outline-blue-300 focus:(outline-solid bg-blue-50)"
      onkeydown={(ev) => ev.key === 'Enter' && ev.currentTarget.blur()}
      onmousedown={(ev) => ev.stopPropagation()}
      onblur={(ev) => onBlurFrameNameEditor(ev, name)}
    >
      {name}
    </div>
  </div>
  <div class="absolute w-full bottom-0" style={`top: ${S.space.grid.size}px;`}>
    <Component />
  </div>
  <ResizeHandles
    onMouseDown={(ev, handle) =>
      S.ev.mousedown(ev, 'resizeHandler', name, handle)}
  />
</div>
<!--
<SpaceBox {box} z={10}>

</SpaceBox> -->
