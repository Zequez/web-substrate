<script lang="ts">
  import { cx } from '../center/snippets/utils'
  import SS from '../store/store.svelte'

  let pos = SS.store.space.pos

  // export let vp: { panX: number; panY: number; zoom: number };
  export let box: { x: number; y: number; w: number; h: number }
  export let onMouseDown: (ev: MouseEvent) => void = () => {}
  export let z: number
  export let scale: boolean = true
  let klass: string = ''
  export { klass as class }
</script>

{#if scale}
  <div
    class="absolute size-full transform-origin-tl pointer-events-none"
    style={`transform:scale(${pos.z}) translate(${pos.x}px, ${pos.y}px); z-index: ${z * 10};`}
  >
    <div
      role="button"
      tabindex="0"
      on:contextmenu|preventDefault|stopPropagation={(ev) => {
        console.log('Space box context menu')
      }}
      on:mousedown={onMouseDown}
      class={cx('absolute top-0 left-0 pointer-events-auto', klass)}
      style={`width: ${box.w}px;
    height: ${box.h}px;
    transform: translate(${box.x}px, ${box.y}px)`}
    >
      <slot />
    </div>
  </div>
{:else}
  <div
    on:contextmenu|preventDefault|stopPropagation={(ev) => {
      console.log('Space box context menu')
    }}
    on:mousedown={onMouseDown}
    class={cx('absolute top-0 left-0 pointer-events-auto', klass)}
    style={`width: ${box.w * pos.z}px;
    height: ${box.h * pos.z}px;
    transform: translate(${(box.x + pos.x) * pos.z}px, ${(box.y + pos.y) * pos.z}px);
    z-index: ${z * 10};`}
  >
    <slot />
  </div>
{/if}
