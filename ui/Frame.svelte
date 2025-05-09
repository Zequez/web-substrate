<script lang="ts">
  import type { Meta } from "../store/framesComponents.svelte";
  import SS from "../store/store.svelte.ts";

  const S = SS.store;

  const {
    name,
    meta,
    Component,
  }: { name: string; meta: Meta; Component: any } = $props();

  function onBlurFrameNameEditor(ev: FocusEvent, frameName: string) {
    console.log("editFrameName");
    console.log((ev.currentTarget as HTMLInputElement).value.trim());
    const newFrameName = (ev.currentTarget as HTMLInputElement).value.trim();
    S.cmd("rename-frame", frameName, newFrameName);
  }

  const box = $derived(
    S.dragState.type === "moveFrame" && S.dragState.name === name
      ? S.dragState.resultingBox
      : meta.box
  );
</script>

<div style={S.space.boxStyle(box)} class="absolute">
  <div
    class="bg-blue-100 tracking-wider font-mono absolute top-0 w-full rounded-t-md px2 flexcs cursor-move"
    style={`height: ${S.space.grid.size}px;`}
    role="button"
    tabindex="0"
    onmousedown={(ev) => S.ev.mousedown(ev, "frame", name)}
  >
    /<input
      class="cursor-pointer bg-transparent rounded-sm outline-blue-300 focus:(outline-solid bg-blue-50)"
      value={name}
      onkeydown={(ev) => ev.key === "Enter" && ev.currentTarget.blur()}
      onblur={(ev) => onBlurFrameNameEditor(ev, name)}
    />
  </div>
  <div class="absolute w-full bottom-0" style={`top: ${S.space.grid.size}px;`}>
    <Component />
  </div>
</div>
