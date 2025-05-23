<script lang="ts">
  // import SS from '../store/store.svelte.ts'
  import Land from './Land.svelte'
  import landsStore from '../store/lands.svelte.ts'
  import landNavigationStore from '../store/land-navigation-store.svelte.ts'

  landsStore.createLandsStoreContext({})
  landNavigationStore.createContext({ initialPath: [] })

  const landNav = landNavigationStore.store
</script>

{#snippet trail(text: string, nav: number)}
  <button
    class="relative overflow-hidden pr4 group -mr4"
    onclick={() => landNav.up(landNav.path.length - nav)}
  >
    <div class="bg-green-500 group-hover:bg-green-400 pl5 text-white">
      <div class="relative z-10">{text}</div>
      <div
        class="absolute z-5 right-2 top-0 rotate-45 bg-green-500 group-hover:(bg-green-400 b-green-600) b-t b-r b-green-700 h8 w8 -mt1"
      ></div>
    </div>
  </button>
{/snippet}

<div class="flex flex-col h-full w-full">
  <div class="flex h6 flex-shrink-0 bg-gray-200 b-b b-green-700">
    {@render trail('Root', 0)}

    {#each landNav.path as p, i}
      {@render trail(p, i + 1)}
    {/each}
  </div>
  <div class="flex flex-grow">
    {#key landNav.path.join('/')}
      <Land at={landNav.path.join('/')} />
    {/key}
  </div>
</div>

<!-- <div class="grid grid-cols-2 gap-2 w-full h-full absolute top-0 bg-red-500"> -->
<!-- <Land at="" /> -->
<!-- <Land at="ezequiel" />
  <Land at="ezequiel/test" />
  <Land at="example" /> -->
<!-- </div> -->
