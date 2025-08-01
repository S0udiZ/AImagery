<script lang="ts">
  import type { PageData } from "./$types";
  import type { Page, Model } from "replicate";
  import {
    loadedModel,
    clearLoadedModel,
    setLoadedModel,
    type ModelParameters,
  } from "$lib/context/loadedModel";
  import {
    createdModels,
    addCreatedModel,
    removeCreatedModel,
  } from "$lib/context/createdModels";
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
  import { goto } from "$app/navigation";
  import { draggable, droppable, type DragDropState } from "@thisux/sveltednd";
  import { Select } from "bits-ui";
  import { toast } from "svelte-sonner";

  const replicate = new Replicate({
    auth: $apiKey as string | undefined,
    fetch,
  });

  async function getModelDetails(owner: string, model: string) {
    const response = await replicate.models.get(owner, model);
    return response;
  }

  // biome-ignore lint/style/useConst: <explanation>
  let { data }: { data: PageData } = $props();

  // biome-ignore lint/style/useConst: <explanation>
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
    properties: {
      [key: string]: Name;
    };
    title: string;
    type: string;
  };

  let schemaInputs: SchemaInputs | null = $state(null);

  let modelBLockSelectionDialog = $state(false);

  let owner = $state("");
  let model = $state("");
  let version = $state("");

  let refs = $state({});

  $inspect(schemaInputs);

  const typeList = {
    string: ["input", "textarea"],
    number: ["input", "slider"],
    integer: ["input", "slider"],
    boolean: ["checkbox"],
    allof: ["selection"],
  };

  let on: { [key: string]: Name } = $state({});
  let onOrder: string[] = $state([]);
  let offOrder: string[] = $state([]);

  $inspect(on);

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
    };
    refs = _modelDetails.latest_version?.openapi_schema.components.schemas;
    schemaInputs = modelDetails;
    if (schemaInputs) {
      owner = _model.owner;
      model = _model.name;
      version = _model.latest_version?.id ? _model.latest_version?.id : "";
      modelBLockSelectionDialog = true;
      // Initialize order arrays
      on = {};
      onOrder = [];
      offOrder = Object.keys(schemaInputs.properties);
    } else {
      schemaInputs = null;
      owner = "";
      model = "";
      version = "";
      modelBLockSelectionDialog = false;
      toast.error(
        "No inputs available for this model. Please select another model."
      );
    }
  }

  async function submitForm(event: Event) {
    event.preventDefault();
    // const formData = new FormData(event.target as HTMLFormElement);
    // const inputs = Object.fromEntries(formData.entries());
    const inputs = $state.snapshot(on);
    console.log("Inputs:", inputs);
    const modelParameters: ModelParameters = {
      owner,
      model,
      version,
      inputs: {},
      $ref: {},
    };
    const _refs = $state.snapshot(refs);
    for (const [key, value] of Object.entries(inputs)) {
      if (value) {
        modelParameters.inputs[key].type = value.type;
        modelParameters.inputs[key].title = value.title;
        modelParameters.inputs[key].description = value.description;
        if (value.allOf) {
          modelParameters.$ref[key] = _refs[key];
        }
        modelParameters.inputs[key].default = value.default ?? "";
        modelParameters.inputs[key].minimum = value.minimum ?? undefined;
        modelParameters.inputs[key].maximum = value.maximum ?? undefined;
      }
    }
    setLoadedModel(modelParameters);
    // Also add to persisted list of created models
    addCreatedModel(modelParameters);
    goto("/");
  }

  function deleteModel(index: number) {
    if ($loadedModel === $createdModels[index]) {
      clearLoadedModel();
    }
    removeCreatedModel(index);
  }

  function selectModelFromList(index: number) {
    if ($createdModels[index]) {
      setLoadedModel($createdModels[index]);
      goto("/");
    }
  }

  function handleDrop(state: DragDropState<SchemaInputs["properties"]>) {
    const { draggedItem, targetContainer, sourceContainer } = state;
    console.log(targetContainer)
    const [key, value] = Object.entries(draggedItem)[0];
    switch (targetContainer !== sourceContainer) {
      case true: {
        // take item from sourceContainer and put it into targetContainer
        if (sourceContainer === "on") {
          delete on[key];
          const idx = onOrder.indexOf(key);
          if (idx !== -1) onOrder.splice(idx, 1);
        } else if (sourceContainer === "off") {
          if (!schemaInputs) return;
          delete schemaInputs.properties[key];
          const idx = offOrder.indexOf(key);
          if (idx !== -1) offOrder.splice(idx, 1);
        }
        if (targetContainer === "on") {
          on[key] = value as Name;
          onOrder.splice(onOrder.length, 0, key);
        } else if (targetContainer === "off") {
          if (!schemaInputs) return;
          schemaInputs.properties[key] = value as Name;
          offOrder.splice(offOrder.length, 0, key);
        }
        break;
      }
      case false:
        // Rearranging item in the same container
        if (sourceContainer === "on") {
          const idx = onOrder.indexOf(key);
          if (idx !== -1) {
            onOrder.splice(idx, 1);
            const targetIdx = Number.parseInt(targetContainer as string);
            onOrder.splice(Number.isNaN(targetIdx) ? 0 : targetIdx, 0, key);
          }
        } else if (sourceContainer === "off") {
          const idx = offOrder.indexOf(key);
          if (idx !== -1) {
            offOrder.splice(idx, 1);
            const targetIdx = Number.parseInt(targetContainer as string);
            offOrder.splice(Number.isNaN(targetIdx) ? 0 : targetIdx, 0, key);
          }
        }
        break;
      default:
        break;
    }
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
    <Dialog.Description class="mt-4 text-sm text-gray-600">
      <div class="grid grid-cols-2">
        <div
          class="space-y-2 ring-1 p-2"
          use:droppable={{
            container: "on",
            callbacks: { onDrop: handleDrop },
          }}
        >
          {#if schemaInputs}
            {#each onOrder as key}
              {@const input = on[key]}
              {@const property = on[key] as Name}
              {@const type = typeList[(property.type as keyof typeof typeList) ?? "allof"]}
              <div
                class="text-xl flex justify-between items-center cursor-move rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:shadow-md hover:ring-2 hover:ring-blue-200 svelte-dnd-touch-feedback"
                use:draggable={{
                  container: "on",
                  dragData: { [key]: input as Name },
                  interactive: [".interactible"],
                }}
                use:droppable={{
                  container: "on",
                  callbacks: { onDrop: handleDrop },
                }}
              >
                <p class="items-center text-center flex"><span class="text-3xl">⠿</span>{key}</p>
                <Select.Root
                  type="single"
                  value={type[0]}
                  class="interactible"
                >
                  <Select.Trigger
                    class="border border-gray-300 rounded px-2 py-1 after:content-[' ▼'] interactible"
                  >
                    {type[0]}
                  </Select.Trigger>
                  <Select.Content class="interactible">
                    <Select.Group class="interactible z-10">
                      {#each type as option}
                        <Select.Item
                          class="interactible"
                          value={option}
                          label={option}>{option}</Select.Item
                        >
                      {/each}
                    </Select.Group>
                  </Select.Content>
                </Select.Root>
              </div>
            {/each}
          {/if}
        </div>
        <div
          class="space-y-2 ring-1 p-2"
          use:droppable={{
            container: "off",
            callbacks: { onDrop: handleDrop },
          }}
        >
          {#if schemaInputs}
            {#each offOrder as key}
              {@const input = schemaInputs.properties[key]}
              {@const property = schemaInputs?.properties[key] as Name}
              {@const type = typeList[(property.type as keyof typeof typeList) ?? "allof"]}
              <div
                class="text-xl flex justify-between items-center cursor-move rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:shadow-md hover:ring-2 hover:ring-blue-200 svelte-dnd-touch-feedback"
                use:draggable={{
                  container: "off",
                  dragData: { [key]: input as Name },
                  interactive: [".interactible"],
                }}
                use:droppable={{
                  container: "off",
                  callbacks: { onDrop: handleDrop },
                }}
              >
                <p class="items-center text-center flex"><span class="text-3xl">⠿</span>{key}</p>
                <Select.Root
                  type="single"
                  value={type[0]}
                  class="interactible"
                >
                  <Select.Trigger
                    class="border border-gray-300 rounded px-2 py-1 after:content-[' ▼'] interactible"
                  >
                    {type[0]}
                  </Select.Trigger>
                  <Select.Content class="interactible">
                    <Select.Group class="interactible z-10">
                      {#each type as option}
                        <Select.Item
                          class="interactible"
                          value={option}
                          label={option}>{option}</Select.Item
                        >
                      {/each}
                    </Select.Group>
                  </Select.Content>
                </Select.Root>
              </div>
            {/each}
          {/if}
        </div>
      </div>
      <Dialog.Close class="mt-4">
        <Button
          variant="default"
          class="w-full"
          onclick={submitForm}
        >
          Create model block
        </Button>
      </Dialog.Close>
    </Dialog.Description>
  </Dialog.Content>
</Dialog.Root>

<div class="py-4">
  {#each $createdModels as model, index}
    <div class="flex gap-2 items-center p-4 w-full text-wrap">
      <Button
        class="flex flex-col gap-2 h-fit cursor-pointer"
        onclick={() => selectModelFromList(index)}
      >
        <h2 class="text-xl">{model.owner}/{model.model}</h2>
        <p>{model.version}</p>
      </Button>
      <Button
        variant="destructive"
        class="size-10 hover:cursor-pointer hover:scale-105"
        onclick={() => deleteModel(index)}
      >
        <Icon icon="mdi:delete" class="!size-10" />
      </Button>
    </div>
  {/each}
</div>
