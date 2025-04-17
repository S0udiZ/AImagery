<script lang="ts">
  // biome-ignore lint/style/useImportType: <explanation>
  import { Switch } from "bits-ui";
  import Icon from "@iconify/svelte";
  import { slide } from "svelte/transition";
  import type { ComponentProps } from "svelte";

  let {
    checked = $bindable(false),
    ref = $bindable(null),
    ...restProps
  }: ComponentProps<typeof Switch.Root> = $props();

  $effect(() => {
    const mode = localStorage.getItem("mode") || "light";
    checked = mode === "dark";
  });

  const onCheckedChange = (Checked: boolean) => {
    const mode = Checked ? "dark" : "light";
    document.body.setAttribute("data-mode", mode);
    localStorage.setItem("mode", mode);
    checked = Checked;
  };
</script>

<svelte:head>
  <script>
    const mode = localStorage.getItem("mode") || "light";
    document.body.setAttribute("data-mode", mode);
  </script>
</svelte:head>

<Switch.Root bind:ref bind:checked {onCheckedChange} {...restProps}>
  <Switch.Thumb>
    {#snippet child({ checked })}
      {#if checked}
        <span class="cursor-pointer block" in:slide={{ duration: 100 }} out:slide={{ duration: 100 }}>
          <Icon inline={false} icon="mdi:moon-and-stars" class="size-8" />
        </span>
      {:else}
        <span class="cursor-pointer block" in:slide={{ duration: 100 }} out:slide={{ duration: 100 }}>
          <Icon inline={false} icon="mdi:white-balance-sunny" class="size-8" />
        </span>
      {/if}
    {/snippet}
  </Switch.Thumb>
</Switch.Root>
