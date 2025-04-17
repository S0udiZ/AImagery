<script lang="ts">
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
  import { writable, type Writable } from "svelte/store";
const url: Writable<string[] | string> = writable("");
import { loadedModel, loadedModelName, loadedModelVersion } from "$lib/context/loadedModel"

(async () => {
  await onOpenUrl((urls) => {
    url.set(urls);
  });
})();

</script>

<div class="w-full h-full flex items-center justify-center">
  {#if $loadedModel}
    <div class="w-full h-full flex flex-col items-center justify-center">
      <h1 class="text-2xl font-bold">Model Loaded</h1>
      <p>Model Name: {$loadedModelName}</p>
      <p>Model Version: {$loadedModelVersion}</p>
    </div>
  {:else}
    <div class="w-full h-full flex flex-col items-center justify-center">
      <h1 class="text-2xl font-bold">No Model Loaded</h1>
      <p>Go to <a href="/models" class="text-primary">Models</a> and create one</p>
    </div>
  {/if}
</div>