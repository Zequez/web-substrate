<script lang="ts">
  import CodeIcon from '~icons/fa6-solid/code'
  import InnerIcon from '~icons/fa6-solid/shapes'
  import MainIcon from '~icons/fa6-solid/layer-group'
  import SS from '../store/store.svelte.ts'
  import { cx } from '../center/snippets/utils.ts'
  import type { FrameBody } from '../store/lands-types'

  const gridSize = SS.store.space.grid.size

  const {
    startFocused,
    name,
    namesTaken,
    onNameChange,
    onCancelNameChange,
    onToggleBody,
    bodiesVisibility,
    onDragStart,
    onPreviewBodyStateChange,
    focusHighlight,
  }: {
    startFocused: boolean
    name: string
    namesTaken: string[]
    onCancelNameChange?: () => void
    onNameChange: (newName: string) => void
    onToggleBody?: (ev: MouseEvent, body: FrameBody, value: boolean) => void
    bodiesVisibility: Record<FrameBody, boolean>
    onDragStart?: (ev: MouseEvent) => void
    onPreviewBodyStateChange?: (body: FrameBody, state: boolean) => void
    focusHighlight?: boolean
  } = $props()

  let editMode = $state<boolean>(startFocused)
  let editValue = $state<string>(name)
  let trimmedEditValue = $derived(editValue.trim())
  let editValueNameIsTaken = $derived(namesTaken.includes(trimmedEditValue))
  let editValueIsValid = $derived(
    trimmedEditValue.length > 0 && !editValueNameIsTaken,
  )

  function edit() {
    editValue = name
    editMode = true
  }

  function doneEditing() {
    console.log('Done!')
    if (editValueIsValid) {
      onNameChange(trimmedEditValue)
    } else {
      onCancelNameChange?.()
    }

    editMode = false
  }

  function cancelEditing() {
    editMode = false
    onCancelNameChange?.()
  }

  let nameInputEl: HTMLInputElement | null = $state(null)

  $effect(() => {
    if (nameInputEl) {
      nameInputEl.focus()
      nameInputEl.select()
    }
  })
</script>

<div
  class={cx(
    'tracking-wider font-mono absolute top-0 w-full rounded-t-md px2 flexcs',
    {
      'cursor-move': !!onDragStart,
      'bg-blue-300': focusHighlight,
      'bg-blue-100': !focusHighlight,
      'rounded-b-md': !bodiesVisibility.main,
    },
  )}
  style={`height: ${gridSize}px;`}
  role="presentation"
  onmousedown={(ev) => onDragStart?.(ev)}
>
  /
  {#if editMode}
    <div class="flex-grow w-full relative">
      <input
        bind:this={nameInputEl}
        placeholder={'name-your-frame'}
        type="text"
        bind:value={editValue}
        class={cx(
          'w-full focus:outline-none shadow-[inset_0_1px_3px_0px_#0006,inset_0_0_1px_1px_#0003] rounded-[3px] placeholder-color-black/25',
          {
            'bg-white': editValueIsValid,
            'bg-yellow-500/30': trimmedEditValue.length === 0,
            'bg-red-500/30': editValueNameIsTaken,
          },
        )}
        onblur={() => {
          doneEditing()
        }}
        onmousedown={(ev) => ev.stopPropagation()}
        onkeydown={(ev) => {
          ev.stopPropagation()
        }}
        onkeypress={(ev) => {
          ev.stopPropagation()
          if (ev.key === 'Enter') {
            doneEditing()
          } else if (ev.key === 'Escape') {
            cancelEditing()
          }
        }}
      />
      {#if editValueNameIsTaken}
        <div
          class="absolute pointer-events-none text-xs text-red-500 left-0 bottom-full mb1 z-100 h-full flexcc"
        >
          <span class="bg-black/50 px1 rounded-[3px]">Name taken</span>
        </div>
      {/if}
    </div>
  {:else}
    <button
      onmousedown={(ev) => ev.stopPropagation()}
      class="cursor-text whitespace-nowrap overflow-hidden text-ellipsis"
      onclick={edit}
    >
      {name}
    </button>
  {/if}
  <div class="flex-grow"></div>
  {#if onToggleBody}
    {#snippet bodyToggle(body: FrameBody, Icon: any)}
      <button
        class={cx('hover:text-green-6 relative flexcc', {
          'text-green-500': bodiesVisibility[body],
          'text-black/50': !bodiesVisibility[body],
        })}
        onmousedown={(ev) => ev.stopPropagation()}
        onfocus={() => onPreviewBodyStateChange?.(body, true)}
        onblur={() => onPreviewBodyStateChange?.(body, false)}
        onmouseover={() => onPreviewBodyStateChange?.(body, true)}
        onmouseout={() => onPreviewBodyStateChange?.(body, false)}
        onclick={(ev) => onToggleBody(ev, body, !bodiesVisibility[body])}
      >
        <Icon class="h3.5 relative z-10" />
        {#if bodiesVisibility[body]}
          <div class="absolute z-5 inset-0 flexcc text-green-400">
            <Icon class="h3.5 filter-blur-[3px]" />
          </div>
          <div class="absolute z-8 inset-0 flexcc text-black/70 scale-108">
            <Icon class="h3.5 " />
          </div>
        {/if}
      </button>
    {/snippet}

    {@render bodyToggle('main', MainIcon)}
    {@render bodyToggle('code', CodeIcon)}
    {@render bodyToggle('inner', InnerIcon)}
  {/if}
</div>
