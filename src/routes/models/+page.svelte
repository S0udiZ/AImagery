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
  import { writable, type Writable } from "svelte/store";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
    import { redirect } from "@sveltejs/kit";

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

  type Name = {
    type: string;
    title: string;
    description: string;
    allOf?: {
      $ref: string;
    };
    default?: string;
    minimum?: number;
    maximum?: number;
  };

  type SchemaInputs = {
    required: string[];
    properties: Name[];
    title: string;
    type: string;
  };

  const schemaInputs: Writable<SchemaInputs | null> = writable(null);

  let modelBLockSelectionDialog = $state(false);

  let owner = $state("");
  let model = $state("");
  let version = $state("");

  let refs = $state({})

  $inspect($schemaInputs);

  async function search() {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    debounceTimeout = setTimeout(async () => {
      filteredModels = await replicate.models.search(searchTerm);
    }, 300);
  }

  async function selectForCreation(_model: Model) {
    const _modelDetails = await getModelDetails(_model.owner, _model.name);
    const modelDetails: SchemaInputs = {
      ..._modelDetails.latest_version?.openapi_schema.components.schemas.Input,
    }
    refs = _modelDetails.latest_version?.openapi_schema.components.schemas;
    schemaInputs.set(
      modelDetails
    );
    if ($schemaInputs) {
      owner = _model.owner;
      model = _model.name;
      version = _model.latest_version?.id ? _model.latest_version?.id : "";
      modelBLockSelectionDialog = true;
    } else {
      schemaInputs.set(null);
    }
  }

  async function submitForm(event: Event) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const inputs = Object.fromEntries(formData.entries());
    console.log("Inputs:", inputs);
    const modelParameters = {
      owner,
      model,
      version,
      inputs: [],
      default: {},
      $ref: {}
    }
    const _refs = $state.snapshot(refs);
    for (const [key, value] of Object.entries(inputs)) {
      if (value) {
        modelParameters.inputs.push({ [key]: $schemaInputs?.properties[key].type ? $schemaInputs?.properties[key].type : "selection" });
        modelParameters.default[key] = $schemaInputs?.properties[key].default ? $schemaInputs?.properties[key].default : "";
        modelParameters.$ref[key] = _refs[key] ? (_refs[key].enum) : "";
      }
    }
    setLoadedModel({
      ...modelParameters
    });
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
          <Dialog.Close
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
          </Dialog.Close>
        {/each}
      </ScrollArea>
    </Dialog.Description>
  </Dialog.Content>
</Dialog.Root>

<!-- Model input blocks creation -->
<Dialog.Root bind:open={modelBLockSelectionDialog}>
  <Dialog.Content class="max-w-5xl max-h-10/12 overflow-auto">
    <Dialog.Title class="text-lg font-bold">Model inputs</Dialog.Title>
    <form action="" onsubmit={submitForm}>
      <Dialog.Description class="mt-4 text-sm text-gray-600">
        {#if $schemaInputs}
          <p class="text-sm text-gray-500">
            Please select the inputs for the model:
          </p>
          <Separator class="my-4" />
          {#each Object.entries($schemaInputs.properties) as [key, input]}
            <Label 
            class={"flex gap-2 p-4 border-b border-gray-200 hover:cursor-pointer hover:bg-gray-50 w-full text-wrap items-center"}
            >
              <!-- Sets the value to true and disable the checkbox if $schemaInputs.requred contains the input.title -->
              <Checkbox
                id={key}
                name={key}
                class="w-4 h-4 mr-2"
                checked={$schemaInputs.required.includes(key) ? true : false}
              />
              <div class="flex flex-col">
                <h2 class="text-lg font-semibold">
                  {input.title
                    ? input.title
                    : key} | {input.type ? input.type : "selection"} | 
                    {$schemaInputs.required.includes(key) ? "Required" : "Optional"}
                </h2>
                <p class="text-sm text-gray-500">{input.description}</p>
              </div>
            </Label>
          {/each}
        {:else}
          <p class="text-sm text-gray-500">No inputs available.</p>
        {/if}
      </Dialog.Description>
      <Dialog.Close class="mt-4">
        <Button type="submit" variant="default" class="w-full">Save</Button>
      </Dialog.Close>
    </form>
  </Dialog.Content>
</Dialog.Root>
