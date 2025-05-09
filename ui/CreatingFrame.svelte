<script lang="ts">
  import cx from 'classnames'
  import { onDestroy, onMount } from 'svelte'
  import type { Box } from '../store/box.ts'
  import SS from '../store/store.svelte.ts'

  const S = SS.store

  const { name, box }: { name: string; box: Box } = $props()
  let nameEl = $state<HTMLDivElement>(null!)

  async function confirmName() {
    if (nameEl) {
      const newFrameName = nameEl.innerText.trim()
      await S.cmd('rename-creating-frame', newFrameName)
      if (!S.framesComponents[newFrameName]) {
        await S.cmd('commit-new-frame')
      }
    }
  }

  function handleBlur(ev: FocusEvent) {
    setTimeout(() => {
      confirmName()
    }, 100)
  }

  function cancelFrameCreating() {
    S.cmd('cancel-creating-frame')
  }

  let nameTaken = $state(false)
  function checkName() {
    const newFrameName = nameEl.innerText.trim()
    nameTaken = !!S.framesComponents[newFrameName]
  }

  onMount(() => {
    nameEl.focus()
    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(nameEl)
    selection?.removeAllRanges()
    selection?.addRange(range)
    checkName()
  })
</script>

<div style={S.space.boxStyle(box)} class="absolute">
  <div
    class="bg-blue-100 tracking-wider font-mono absolute top-0 w-full rounded-t-md px2 flexcs cursor-move"
    style={`height: ${S.space.grid.size}px;`}
    role="button"
    tabindex="0"
  >
    /
    <div
      bind:this={nameEl}
      contenteditable="true"
      onkeyup={checkName}
      role="textbox"
      tabindex="0"
      class={cx(
        'cursor-text bg-transparent rounded-sm outline-blue-300 focus:(outline-solid bg-blue-50)',
        {
          'outline-red-300! bg-red-50!': nameTaken,
        },
      )}
      onkeydown={(ev) => {
        if (ev.key === 'Enter') {
          confirmName()
        } else if (ev.key === 'Escape') {
          cancelFrameCreating()
        }
      }}
      onmousedown={(ev) => ev.stopPropagation()}
      onblur={(ev) => handleBlur(ev)}
    >
      {name}
    </div>
  </div>
  <div
    class="absolute w-full bottom-0 bg-white rounded-b-md"
    style={`top: ${S.space.grid.size}px;`}
  ></div>
</div>
