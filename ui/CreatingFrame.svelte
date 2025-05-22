<script lang="ts">
  import type { Box } from '../store/box.ts'
  import SS from '../store/store.svelte.ts'
  import FrameBar from './FrameBar.svelte'

  const S = SS.store

  const { box }: { box: Box } = $props()
</script>

<div style={S.space.boxStyle(box)} class="absolute">
  <FrameBar
    startFocused={true}
    name={''}
    bodiesVisibility={{ main: true, code: false, inner: false }}
    namesTaken={Object.keys(S.framesComponents)}
    onCancelNameChange={() => S.cmd('cancel-creating-frame')}
    onNameChange={(newName) => S.cmd('commit-creating-frame', newName)}
  />
  <div
    class="absolute w-full bottom-0 bg-white rounded-b-md"
    style={`top: ${S.space.grid.size}px;`}
  ></div>
</div>
