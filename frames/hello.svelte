<script lang="ts">
  import Note from './note.svelte'
  const { data, onDataChange } = $props()
</script>

<Note {data} {onDataChange} />
