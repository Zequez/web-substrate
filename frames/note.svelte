<script lang="ts">
  const {
    data,
    onDataChange,
  }: {
    data: { text: string }
    onDataChange: (data: { text: string }) => void
  } = $props()
</script>

<div class="bg-black text-white text-xl rounded-b-md size-full flexcc">
  <div
    contenteditable={true}
    class="bg-yellow-5 block w-full h-full text-center text-[40px] p4 flexcc flex-col line-height-10 whitespace-pre-line"
    onblur={(e) => onDataChange({ text: e.currentTarget.innerText })}
    >{data?.text || ''}</div
  >
</div>
