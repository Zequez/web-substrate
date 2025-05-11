<script lang="ts">
  import type { Meta } from '../store/meta.ts'
  import MinusIcon from '~icons/fa6-solid/minus'
  // import CubeIcon from '~icons/fa6-solid/cube'

  import SS from '../store/store.svelte.ts'
  import ResizeHandles from './ResizeHandles.svelte'
  import FrameBar from './FrameBar.svelte'
  import { cx } from '../center/snippets/utils.ts'

  const S = SS.store

  const {
    name,
    meta,
    code,
    Component,
  }: { name: string; code: string; meta: Meta; Component: any } = $props()

  let previewCode = $state<boolean>(false)

  const mainBox = $derived(
    S.dragState.type === 'moveFrame' &&
      S.dragState.name === name &&
      S.dragState.body === 'main'
      ? S.dragState.resultingBox
      : S.dragState.type === 'resizeFrame' &&
          S.dragState.name === name &&
          S.dragState.body === 'main'
        ? S.dragState.resultingBox
        : meta.box,
  )

  const codeBox = $derived(
    S.dragState.type === 'moveFrame' &&
      S.dragState.name === name &&
      S.dragState.body === 'code'
      ? S.dragState.resultingBox
      : S.dragState.type === 'resizeFrame' &&
          S.dragState.name === name &&
          S.dragState.body === 'code'
        ? S.dragState.resultingBox
        : meta.codeBox,
  )

  let focusedBody = $derived<'main' | 'code' | null>(
    S.focusedFrame
      ? S.focusedFrame[0] === name
        ? S.focusedFrame[1]
        : null
      : null,
  )

  let codeInputEl = $state<HTMLDivElement | null>(null)
  let codeInputValue = $state<string>(code)

  function handleCodeKeyUp() {
    if (codeInputEl) {
      codeInputValue = codeInputEl.innerText
    }
  }

  const isMac = navigator.platform.toUpperCase().includes('MAC')
  function handleCodeKeyDown(ev: KeyboardEvent) {
    const isSave =
      (isMac && ev.metaKey && ev.key === 's') ||
      (!isMac && ev.ctrlKey && ev.key === 's')

    if (isSave) {
      ev.preventDefault()
      S.cmd('save-code', name, codeInputValue)
    } else if (ev.key === 'Tab') {
      ev.preventDefault()
      // Find caret and add 2 spaces
      const sel = window.getSelection()
      if (sel) {
        const range = sel.getRangeAt(0)
        range.deleteContents()
        range.insertNode(document.createTextNode('  '))
      }
    }
  }

  let codeChanged = $derived(codeInputValue !== code)
</script>

<!--
███╗   ███╗ █████╗ ██╗███╗   ██╗
████╗ ████║██╔══██╗██║████╗  ██║
██╔████╔██║███████║██║██╔██╗ ██║
██║╚██╔╝██║██╔══██║██║██║╚██╗██║
██║ ╚═╝ ██║██║  ██║██║██║ ╚████║
╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝
                                 -->

<div
  style={S.space.boxStyle(mainBox)}
  class={cx('absolute group/frame rounded-md', {
    'shadow-[0_0_0_3.5px_rgba(0,0,0,0.6)] shadow-blue-500':
      focusedBody === 'main',
  })}
>
  <FrameBar
    startFocused={false}
    namesTaken={Object.keys(S.framesComponents).filter((n) => n !== name)}
    {name}
    onNameChange={(newName) => S.cmd('rename-frame', name, newName)}
    onToggleCode={(ev) => S.ev.click(ev, 'frameCodingToggle', name)}
    onDragStart={(ev) => S.ev.mousedown(ev, 'frameDragHandle', name, 'main')}
    onPreviewBodyStateChange={(body: 'main' | 'code', state: boolean) => {
      if (body === 'code') {
        previewCode = state
      }
    }}
    focusHighlight={focusedBody === 'main'}
  />
  <div
    class="absolute w-full bottom-0"
    role="presentation"
    onmousedown={(ev) => ev.stopPropagation()}
    style={`top: ${S.space.grid.size}px;`}
  >
    <Component
      data={meta.data}
      onDataChange={(newData: any) => S.cmd('set-data', name, newData)}
    />
  </div>
  <ResizeHandles
    holding={S.dragState.type === 'resizeFrame' &&
    S.dragState.body === 'main' &&
    S.dragState.name === name
      ? S.dragState.handler
      : null}
    onMouseDown={(ev, handle) =>
      S.ev.mousedown(ev, 'resizeHandler', name, 'main', handle)}
  />
</div>

<!--
██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║██║  ██║█████╗
██║     ██║   ██║██║  ██║██╔══╝
╚██████╗╚██████╔╝██████╔╝███████╗
 ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝
                                  -->

{#if meta.showCodeBox || previewCode}
  <div
    style={S.space.boxStyle(codeBox)}
    class={cx('absolute group/frame z-1000 flex flex-col rounded-md', {
      'opacity-50 pointer-events-none': !meta.showCodeBox && previewCode,
      'shadow-[0_0_0_3.5px_rgba(59,130,246,255)]': focusedBody === 'code',
    })}
    role="presentation"
    onmousedown={(ev) => S.ev.mousedown(ev, 'frameDragHandle', name, 'code')}
  >
    <div
      style={`height: ${S.space.grid.size}px;`}
      class={cx(
        'flex-shrink-0 font-mono rounded-t-md flexcs px2 text-black/80 cursor-move',
        {
          'bg-gray-100': focusedBody !== 'code',
          'bg-blue-300': focusedBody === 'code',
        },
      )}
    >
      <div class="flex-grow"
        ><span class="opacity-50 font-bold">&lt;</span><span class="mx.5"
          >{name}</span
        ><span class="opacity-50 font-bold">&gt;</span>
      </div>
      <button
        class="hover:text-red-700"
        onclick={(ev) => S.ev.click(ev, 'frameCodingToggle', name)}
        onmousedown={(ev) => ev.stopPropagation()}><MinusIcon /></button
      >
    </div>
    <div
      bind:this={codeInputEl}
      class="flex-grow p2 text-white bg-gray-950 font-mono overflow-auto whitespace-pre-wrap focus:(outline-none bg-gray-900)"
      onmousedown={(ev) => ev.stopPropagation()}
      onwheel={(ev) => ev.stopPropagation()}
      onkeydown={handleCodeKeyDown}
      onkeyup={handleCodeKeyUp}
      role="presentation"
      contenteditable={true}
    >
      {code}
    </div>
    <div
      style={`height: ${S.space.grid.size}px;`}
      class="flex-shrink-0 bg-gray-100 rounded-b-md flexce"
    >
      <button
        disabled={!codeChanged}
        onmousedown={(ev) => ev.stopPropagation()}
        onclick={(ev) => S.cmd('save-code', name, codeInputValue)}
        class={cx(
          `bg-green-500/70 hover:bg-green-500/90
        disabled:(opacity-50 saturate-0 text-black/50 text-shadow-none)
        text-shadow-[0_1px_0_#0003] text-white h-full px2`,
          {
            'pointer-events-none': S.dragState.type === 'resizeFrame',
          },
        )}>Save (Cmd+S)</button
      >
    </div>
    <ResizeHandles
      holding={S.dragState.type === 'resizeFrame' &&
      S.dragState.body === 'code' &&
      S.dragState.name === name
        ? S.dragState.handler
        : null}
      onMouseDown={(ev, handle) =>
        S.ev.mousedown(ev, 'resizeHandler', name, 'code', handle)}
    />
  </div>
{/if}
