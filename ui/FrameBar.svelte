<script lang="ts">
  import CodeIcon from '~icons/fa6-solid/code'
  import SS from '../store/store.svelte.ts'
  import { cx } from '../center/snippets/utils.ts'

  const gridSize = SS.store.space.grid.size

  const {
    startFocused,
    name,
    namesTaken,
    onNameChange,
    onCancelNameChange,
    onToggleCode,
    onDragStart,
  }: {
    startFocused: boolean
    name: string
    namesTaken: string[]
    onCancelNameChange?: () => void
    onNameChange: (newName: string) => void
    onToggleCode?: (ev: MouseEvent) => void
    onDragStart?: (ev: MouseEvent) => void
  } = $props()

  let editMode = $state<boolean>(startFocused)
  let editValue = $state<string>(name)
  let trimmedEditValue = $derived(editValue.trim())
  let editValueNameIsTaken = $derived(namesTaken.includes(trimmedEditValue))
  let editValueIsValid = $derived(
    trimmedEditValue.length > 0 && !editValueNameIsTaken,
  )

  // let editingValue = $state<string | null>(startFocused ? name : null)
  // let trimmedValue = $derived(
  //   editingValue !== null ? editingValue.trim() : null,
  // )
  // let nameIsTaken = $derived(
  //   trimmedValue !== null ? namesTaken.includes(trimmedValue) : null,
  // )
  // let nameIsValid = $derived(
  //   trimmedValue !== null && nameIsTaken !== null ? trimmedValue.length > 0 && !nameIsTaken : null,
  // )

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
    'bg-blue-100 tracking-wider font-mono absolute top-0 w-full rounded-t-md px2 flexcs',
    {
      'cursor-move': !!onDragStart,
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
        onkeypress={(ev) => {
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
          ><span class="bg-black/50 px1 rounded-[3px]">Name taken</span></div
        >
      {/if}
    </div>
  {:else}
    <button
      onmousedown={(ev) => ev.stopPropagation()}
      class="cursor-text whitespace-nowrap overflow-hidden text-ellipsis"
      onclick={edit}>{name}</button
    >
  {/if}
  <div class="flex-grow"></div>
  {#if onToggleCode}
    <button
      onmousedown={(ev) => ev.stopPropagation()}
      onclick={(ev) => onToggleCode(ev)}><CodeIcon class="h3" /></button
    >
  {/if}
</div>
