<script lang="ts">
</script>

{#snippet link(url: string, service: string, address: string)}
  <div>
    <a
      href={url}
      target="_blank"
      class="group text-blue-400 b-blue-400 b-0 b-solid rounded-t-md px1 hover:(b-b bg-blue-400/10)"
    >
      <span class="b-b b-dashed b-blue-400 group-hover:b-none">
        <span class="font-bold inline-block w-22">{service}</span>
        <span class="text-blue-400">@</span>
        <span class="text-blue-300">{address}</span>
      </span>
    </a>
  </div>
{/snippet}

<div class="rounded-md size-full bg-black/50 rounded-md p4 text-lg">
  {@render link("https://t.me/zequez", "Telegram", "Zequez")}
  {@render link("https://github.com/zequez", "Github", "Zequez")}
  {@render link(
    "https://medium.com/@ezequiel.schwartzman",
    "Medium",
    "ezequiel.schwartzman"
  )}
  {@render link(
    "https://www.youtube.com/@EzequielSchwartzman",
    "YouTube",
    "EzequielSchwartzman"
  )}
  {@render link(
    "https://instagram.com/ezequiel.servicio",
    "Instagram",
    "ezequiel.servicio"
  )}
</div>
