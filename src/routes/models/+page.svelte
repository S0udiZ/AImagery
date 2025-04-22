<script lang="ts">
  import type { PageData } from "./$types";
  import type { Page, Model } from "replicate";
  import {
    loadedModel,
    clearLoadedModel,
    setLoadedModel,
  } from "$lib/context/loadedModel";
  import { apiKey } from "$lib/context/settings";
  import { fetch } from "@tauri-apps/plugin-http";
  import Replicate from "replicate";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import Icon from "@iconify/svelte";
  import { Input } from "$lib/components/ui/input";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";

  const replicate = new Replicate({
    auth: $apiKey as string | undefined,
    fetch,
  });

  async function getModelDetails(owner: string, model: string) {
    const response = await replicate.models.get(owner, model);
    return response;
  }

  let { data }: { data: PageData } = $props();

  let searchTerm = $state("");

  let filteredModels: Page<Model> | null = $state(null);

  let debounceTimeout: number | null = null;

  async function search() {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      debounceTimeout = setTimeout(async () => {
        filteredModels = await replicate.models.search(searchTerm);
      }, 300);
    };

  async function selectForCreation(model: Model) {
    const modelDetails = await getModelDetails(model.owner, model.name);
    console.log(modelDetails.latest_version?.openapi_schema);
  }
</script>

<Dialog.Root>
  <Dialog.Trigger class="fixed bottom-8 right-8">
    <Button
      variant="default"
      class="size-12 rounded-full hover:cursor-pointer hover:scale-110"
    >
      <Icon icon="mdi:plus" class="!size-10" />
    </Button>
  </Dialog.Trigger>

  <Dialog.Content class="">
    <Dialog.Title class="text-lg font-bold">Search models</Dialog.Title>
    <Dialog.Description class="mt-4 text-sm text-gray-600 w-md mx-auto">
      <div class="flex gap-2 items-center">
        <Input
          type="text"
          placeholder="Search for models..."
          class="w-full"
          bind:value={searchTerm}
          oninput={search}
        />
        <Button
          variant="default"
          class="size-10 hover:cursor-pointer hover:scale-105"
          onclick={async () => {
            filteredModels = await replicate.models.search(searchTerm);
          }}
        >
          <Icon icon="mdi:magnify-scan" class="!size-10" />
        </Button>
      </div>
      <Separator class="my-4" />
      <ScrollArea class="h-96 w-md">
        {#each filteredModels?.results ?? [] as model}
          <Button
            onclick={() => {
              selectForCreation(model);
            }}
            class="flex flex-col relative gap-2 p-4 border-b border-gray-200 hover:cursor-pointer hover:bg-gray-50 w-full text-wrap"
          >
            <div class="flex justify-between gap-2">
              <div class="flex flex-col justify-between flex-1">
                <h2 class="text-lg font-semibold">{model.name}</h2>
                <p class="text-sm text-gray-500">{model.description}</p>
                <p class="text-sm text-gray-400">Owner: {model.owner}</p>
              </div>
              <img
                src={model.cover_image_url}
                alt={model.name}
                class="h-20 my-auto"
              />
            </div>
            <p class="text-sm text-gray-400 truncate">
              Version: {model.latest_version?.id}
            </p>
          </Button>
        {/each}
      </ScrollArea>
    </Dialog.Description>
  </Dialog.Content>
</Dialog.Root>
