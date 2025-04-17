<script lang="ts">
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
  import { writable, type Writable } from "svelte/store";
const url: Writable<string[] | string> = writable("");

(async () => {
  await onOpenUrl((urls) => {
    url.set(urls);
  });
})();

</script>

<div class="w-full h-full flex items-center justify-center">
  <p>Hello world</p>
</div>