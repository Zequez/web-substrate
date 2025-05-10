<script lang="ts">
  import type { Meta } from '../store/meta.ts'

  import SS from '../store/store.svelte.ts'
  import ResizeHandles from './ResizeHandles.svelte'
  import FrameBar from './FrameBar.svelte'

  const S = SS.store

  const {
    name,
    meta,
    Component,
  }: { name: string; meta: Meta; Component: any } = $props()

  const box = $derived(
    S.dragState.type === 'moveFrame' && S.dragState.name === name
      ? S.dragState.resultingBox
      : S.dragState.type === 'resizeFrame' && S.dragState.name === name
        ? S.dragState.resultingBox
        : meta.box,
  )
</script>

<div style={S.space.boxStyle(box)} class="absolute group/frame">
  <FrameBar
    startFocused={false}
    namesTaken={Object.keys(S.framesComponents).filter((n) => n !== name)}
    {name}
    onNameChange={(newName) => S.cmd('rename-frame', name, newName)}
    onToggleCode={(ev) => S.ev.click(ev, 'frameCodingToggle', name)}
    onDragStart={(ev) => S.ev.mousedown(ev, 'frameDragHandle', name)}
  />
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
