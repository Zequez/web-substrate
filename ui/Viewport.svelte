<script lang="ts">
  import { onMount } from "svelte";
  import { cx } from "../center/snippets/utils";
  import SS from "../store/store.svelte.ts";
  import type { Pos, Viewport, ViewportContext } from "../store/space.svelte";

  const Store = SS.store;
  const Space = SS.store.space;

  const {
    children,
    viewportContext,
  }: {
    children: any;
    viewportContext: ViewportContext;
  } = $props();

  $effect(() => {
    viewportContext.parentPos.x,
      viewportContext.parentPos.y,
      viewportContext.parentPos.z;
    triggerViewportChange();
  });

  const transform = $derived.by(() => {
    const { x, y, z } = Space.pos;
    const units = Space.grid.size;
    return `transform: translateX(${(x * units + Space.vp.renderedWidth / 2) * z}px) translateY(${(y * units + Space.vp.renderedHeight / 2) * z}px) scale(${z})`;
  });

  let el = $state<HTMLDivElement>(null!);

  function triggerViewportChange() {
    const {
      width,
      height,
      left: offsetX,
      top: offsetY,
    } = el.getBoundingClientRect();

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    if (viewportContext.parentPos.z) {
      Space.cmd.setViewport({
        width: width / viewportContext.parentPos.z,
        height: height / viewportContext.parentPos.z,
        renderedWidth: width,
        renderedHeight: height,
        offsetX,
        offsetY,
        screenW,
        screenH,
        scaled: viewportContext.parentPos.z,
      });
    }
  }

  onMount(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      triggerViewportChange();
    });
    resizeObserver.observe(el);

    window.addEventListener("resize", triggerViewportChange);

    triggerViewportChange();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", triggerViewportChange);
    };
  });
</script>

<!-- bind:this={S.containerEl} -->
<div
  bind:this={el}
  onmouseup={(ev) => Store.ev.mouseup(ev, "space")}
  onmousemove={(ev) => Store.ev.mousemove(ev, "space")}
  onwheel={(ev) => Store.ev.wheel(ev, "space")}
  onmousedown={(ev) => Store.ev.mousedown(ev, "space")}
  oncontextmenu={(ev) => ev.preventDefault()}
  role="presentation"
  class={cx("absolute inset-0 overflow-hidden ", {
    "cursor-grabbing": Store.dragState.type === "panning",
    "cursor-cell": Store.dragState.type === "createFrame",
  })}
>
  <!-- This centers the grid so that 0,0 is in the middle of the screen -->
  <div role="presentation" class="absolute inset-0 cursor-">
    <div
      class={cx("absolute top-0 left-0 size-full will-change-transform", {
        "z-frames-container": false,
      })}
      style={transform}
    >
      {#if Space.vp.width && Space.vp.height}
        {@render children?.()}
      {/if}
    </div>
  </div>
</div>
