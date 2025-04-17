<script lang="ts">
  // biome-ignore lint/style/useImportType: <explanation>
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import Icon from "@iconify/svelte";
  import type { ComponentProps } from "svelte";

  import LightSwitch from "$lib/elements/light-switch/light-switch.svelte";

  // biome-ignore lint/style/useConst: <explanation>
  let {
    ref = $bindable(null),
    collapsible = "icon",
    variant = "floating",
    ...restProps
  }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref {collapsible} {...restProps} {variant}>
  <Sidebar.Content class="py-2">
    <Sidebar.Menu class="gap-2">
      <Sidebar.MenuItem>
        <Sidebar.MenuButton class="sidebar-menu-button">
          <a href="/" class="flex items-center gap-2">
            <Icon icon="mdi:brush-variant" class="size-8" />
            <span class="text-sm">Generate</span>
          </a>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton class="sidebar-menu-button">
          <a href="/models" class="flex items-center gap-2">
            <Icon icon="mdi:robot" class="size-8" />
            <span class="text-sm">Models</span>
          </a>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton class="sidebar-menu-button">
          <a href="/iamges" class="flex items-center gap-2">
            <Icon icon="mdi:images" class="size-8" />
            <span class="text-sm">Images</span>
          </a>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Content>
  <Sidebar.Footer class="px-0">
    <Sidebar.Menu class="gap-2">
      <Sidebar.MenuItem>
        <Sidebar.MenuButton class="sidebar-menu-button gap-3">
          <LightSwitch />
          <span class="text-sm">Toggle Dark Mode</span>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton class="sidebar-menu-button">
          <a href="/help" class="flex items-center gap-2">
            <Icon icon="mdi:help-circle" class="size-8" />
            <span class="text-sm">Help</span>
          </a>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton class="sidebar-menu-button">
          <Dialog.Trigger class="flex items-center gap-3 hover:cursor-pointer">
            <Icon icon="mdi:settings" class="size-8" />
            <span class="text-sm">Settings</span>
          </Dialog.Trigger>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>
</Sidebar.Root>
