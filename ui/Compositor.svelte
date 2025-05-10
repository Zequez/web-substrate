<script lang="ts">
  import SS from '../store/store.svelte.ts'
  import Viewport from './Viewport.svelte'
  import GridDisplay from './GridDisplay.svelte'
  import Frame from './Frame.svelte'
  import CreatingFrame from './CreatingFrame.svelte'

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
{#if S.dragState.type === 'moveFrame'}
  <div
    class="absolute bottom-0 right-0 rounded-tl-lg h[100px] w[100px] bg-red z-100 pointer-events-none"
  ></div>
{/if}
<Viewport viewportContext={{ depth: 0, parentPos: { x: 0, y: 0, z: 1 } }}>
  {#each Object.entries(S.framesComponents) as [name, { meta, Component }] (name)}
    <Frame {name} {Component} {meta} />
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
