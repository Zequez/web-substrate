<script lang="ts">
  import { onMount } from "svelte";
  import cx from "classnames";
  import SS from "../store/store.svelte.ts";
  import Viewport from "./Viewport.svelte";
  import GridDisplay from "./GridDisplay.svelte";
  import Frame from "./Frame.svelte";
  import CreatingFrame from "./CreatingFrame.svelte";

  SS.createStoreContext();
  const S = SS.store;

  onMount(async () => {
    if (import.meta.env.DEV) {
      S.cmd("ping");
    }
  });

  $effect(() => {
    if (S.dragState) {
      document.body.classList.add("select-none");
    } else {
      document.body.classList.remove("select-none");
    }
  });
</script>

<GridDisplay
  pos={S.space.pos}
  vp={S.space.vp}
  size={S.space.grid.size}
  color={"#fff"}
/>
<Viewport viewportContext={{ depth: 0, parentPos: { x: 0, y: 0, z: 1 } }}>
  {#each Object.entries(S.framesComponents) as [name, { meta, Component }] (name)}
    <Frame {name} {Component} {meta} />
  {/each}
  {#if S.dragState.type === "createFrame"}
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
  {#if S.creatingFrame}
    {#key S.creatingFrame.timestamp}
      <CreatingFrame name={S.creatingFrame.name} box={S.creatingFrame.box} />
    {/key}
  {/if}
  <!-- {#each Object.entries(S.frames) as [uuid, frame] (uuid)}
    {@const resolvedBox =
      S.dragState.type === "moveFrame" && S.dragState.uuid === uuid
        ? S.dragState.resultingBox
        : frame.value.box}
    <div
      role="presentation"
      style={S.space.boxStyle(resolvedBox)}
      class={cx("absolute top-0 left-0 bg-white text-black flexcc rounded-lg", {
        "cursor-grab": S.dragState.type === "none",
      })}
      onmousedown={(ev) => S.ev.mousedown(ev, "frame", uuid)}
    >
      {#if frame.value.content.type === "file"}
        {frame.value.content.path}
      {/if}
    </div>
  {/each} -->
  <!--
  <div class="flex p2">
    <div class="flex flex-col w-1/4 space-y-1 mr1">
      {#each S.filesList as file}
        <button
          class={cx('w-full p-1 b b-black/10 bg-gray-100 rounded-md', {
            'bg-gray-300': file === S.mountedFile,
          })}
          onclick={() => S.cmd('mount-file', file)}>{file}</button
        >
      {/each}
    </div>
    <div class="w-3/4">
      {#if S.mountedFile}
        {#if S.filesContent[S.mountedFile]}
          {@const uplinkFile = S.filesContent[S.mountedFile]}
          {#if uplinkFile.type === 'directory'}
            <div class="space-y-1">
              {#each uplinkFile.data as fileName}
                <button
                  class={cx('w-full p-1 b b-black/10 bg-gray-100 rounded-md', {
                    'bg-gray-300': fileName === S.mountedFile,
                  })}
                  onclick={() =>
                    S.cmd('mount-file', `${S.mountedFile}/${fileName}`)}
                >
                  {fileName}
                </button>
              {/each}
            </div>
          {:else if uplinkFile.type === 'text'}
            <textarea
              class="whitespace-pre size-full"
              value={uplinkFile.data}
              onkeydown={(e) => {
                if (e.key === 's' && e.metaKey) {
                  e.stopPropagation()
                  e.preventDefault()
                  S.cmd('save-mounted-file')
                }
              }}
              onkeyup={(e) =>
                S.cmd('update-mounted-file', e.currentTarget.value)}
            ></textarea>
          {:else if uplinkFile.type === 'binary'}
            <div class="flexcc h-full">
              <img
                alt={S.mountedFile}
                src={`data:${uplinkFile.mimeType};base64,${uplinkFile.data}`}
              />
            </div>
          {/if}
        {/if}
      {/if}
    </div>
  </div> -->
</Viewport>
