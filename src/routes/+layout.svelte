<script lang="ts">
  import "../app.css";

  import AppSidebar from "$lib/elements/sidebar/sidebar.svelte";

  // biome-ignore lint/style/useImportType: <explanation>
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import Icon from "@iconify/svelte";
  import type { ComponentProps } from "svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Label from "$lib/components/ui/label/label.svelte";
  import { Input } from "$lib/components/ui/input";
  import { Checkbox } from "$lib/components/ui/checkbox";

  // Context
  import { apiKey, setApiKey } from "$lib/context/settings";
  import { writable } from "svelte/store";

  // biome-ignore lint/style/useConst: <explanation>
  let { collapsible = "icon" }: ComponentProps<typeof Sidebar.Root> = {
    collapsible: "icon",
  };

  // biome-ignore lint/style/useConst: <explanation>
  let open = $state(true);

  let settingsApiKey = $state($apiKey);

  // Derived value for masked API key
  let maskedApiKey = $derived(
    settingsApiKey
      ? settingsApiKey.slice(0, 6) + "*".repeat(settingsApiKey.length - 6)
      : ""
  );

  let showSecrets = $state(false);

  // biome-ignore lint/style/useConst: <explanation>
  let { children } = $props();

  function saveSettings() {
    setApiKey(settingsApiKey);
  }
</script>

<Dialog.Root>
  <Sidebar.Provider bind:open>
    <AppSidebar />
    <main class="w-full flex-1 flex relative">
      <Button
        type="button"
        onclick={(e) => {
          open = !open;
          e.stopPropagation();
        }}
        data-sidebar="trigger"
        variant="ghost"
        class="size-12 absolute top-2 left-2 p-2 hover:cursor-pointer"
      >
        <Icon icon="mdi:dock-left" class="!size-8" />
        <span class="sr-only">Toggle Sidebar</span>
      </Button>
      {@render children?.()}
    </main>
  </Sidebar.Provider>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Settings</Dialog.Title>
    </Dialog.Header>
    <div>
      <div class="flex gap-2 items-center">
        <Label class="text-base">Show sensitive secrets</Label>
        <Checkbox
          bind:checked={showSecrets}
        />
      </div>
      <div class="flex gap-2 items-center relative">
        <Label class="text-base">Replicate Api Key:</Label>
        <Input
          value={showSecrets ? settingsApiKey : maskedApiKey}
          oninput={(e) => {
            const target = e.target as HTMLInputElement | null;
            if (target) settingsApiKey = target.value;
          }}
          class="flex-1"
          placeholder="replicate_api_key"
        />
        <Icon
          icon="mdi:lock-open-outline"
          class="absolute right-2 size-6 text-accent"
        />
      </div>
    </div>
    <Dialog.Footer>
      <Dialog.Close>
        <Button onclick={saveSettings}>Save</Button>
      </Dialog.Close>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
