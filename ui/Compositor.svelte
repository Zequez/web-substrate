<script lang="ts">
  import SS from '../store/store.svelte.ts'
  import Viewport from './Viewport.svelte'
  import GridDisplay from './GridDisplay.svelte'
  import Frame from './Frame.svelte'
  import CreatingFrame from './CreatingFrame.svelte'
  import TrashIcon from '~icons/fa6-solid/trash'
  import FocusField from './FocusField.svelte'
  import VirtualFocusField from './VirtualFocusField.svelte'

  SS.createStoreContext()
  const S = SS.store

  $effect(() => {
    if (S.dragState) {
      document.body.classList.add('select-none')
    } else {
      document.body.classList.remove('select-none')
    }
  })
</script>

<GridDisplay
  pos={S.space.pos}
  vp={S.space.vp}
  size={S.space.grid.size}
  color={'#fff'}
/>
<VirtualFocusField
  focusablePoints={S.focusablePoints}
  onFocusChanges={(newFocus) => S.cmd('focus-frame', newFocus)}
  initialCenter={S.space.screenCenter}
  onCenterChanges={(c) => S.space.cmd.centerTo(c)}
  onZoomToFit={(target) => S.cmd('zoom-to-fit', target)}
  visualization={false}
  focusedAt={S.focusedFrame}
/>
<!-- <FocusField
  pos={S.space.pos}
  vp={S.space.vp}
  gridSize={S.space.grid.size}
  focusablePoints={S.focusablePoints}
  currentFocus={S.focusedFrame}
/> -->
{#if S.dragState.type === 'moveFrame'}
  <div
    class="absolute bottom-0 right-0 rounded-tl-lg h[100px] w[100px] bg-red-500 z-100 pointer-events-none flexcc text-[40px] text-white"
  >
    <TrashIcon />
  </div>
{/if}
<Viewport
  viewportContext={{ depth: 0, parentPos: { x: 0, y: 0, z: 1 } }}
  visualizeCenter={false}
>
  {#each Object.entries(S.framesComponents) as [name, { meta, Component, code }] (name)}
    <Frame {name} {code} {Component} {meta} />
  {/each}
  {#if S.dragState.type === 'createFrame'}
    {#if S.dragState.resultingBox.w >= 3 && S.dragState.resultingBox.h >= 3}
      <div
        class="absolute bg-white/50 rounded-md b-3 b-blue-100"
        style={S.space.boxStyle(S.dragState.resultingBox)}
      >
        <div
          class="bg-blue-100 absolute top-0 w-full px2"
          style={`height: ${S.space.grid.size - 3}px;`}
        ></div>
      </div>
    {:else}
      <div
        class="absolute bg-white/30 rounded-md"
        style={S.space.boxStyle(S.dragState.resultingBox)}
      ></div>
    {/if}
  {/if}

  <!-- CREATING FRAME -->
  {#if S.creatingFrame}
    {#key S.creatingFrame.timestamp}
      <CreatingFrame box={S.creatingFrame.box} />
    {/key}
  {/if}
</Viewport>
