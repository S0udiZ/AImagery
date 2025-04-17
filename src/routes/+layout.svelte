<script lang="ts">
  import "../app.css";

  import AppSidebar from "$lib/elements/sidebar/sidebar.svelte";

  // biome-ignore lint/style/useImportType: <explanation>
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import Icon from "@iconify/svelte";
  import type { ComponentProps } from "svelte";

  // biome-ignore lint/style/useConst: <explanation>
  let { collapsible = "icon" }: ComponentProps<typeof Sidebar.Root> = {
    collapsible: "icon",
  };

  // biome-ignore lint/style/useConst: <explanation>
  let { children } = $props();
</script>

<Dialog.Root>
  <Sidebar.Provider>
    <AppSidebar />
    <main class="w-full flex-1 flex relative">
      <Sidebar.Trigger />
      {@render children?.()}
    </main>
  </Sidebar.Provider>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>This is the settings dialog</Dialog.Title>
      <Dialog.Description>
        This is a description of the settings dialog. You can put any content
        you want here.
      </Dialog.Description>
    </Dialog.Header>
  </Dialog.Content>
</Dialog.Root>
