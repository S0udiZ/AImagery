<script lang="ts">
  import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
  import { writable, type Writable } from "svelte/store";
  const url: Writable<string[] | string> = writable("");
  import { loadedModel } from "$lib/context/loadedModel";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
  import * as Select from "$lib/components/ui/select/index.js";

  const formData: Writable<Record<string, any>> = writable({});

  const handleInputChange = (name: string, value: any) => {
    formData.update((data) => {
      data[name] = value;
      return data;
    });
  };

  (async () => {
    await onOpenUrl((urls) => {
      url.set(urls);
    });
  })();
</script>

<div
  class="max-w-full h-full flex flex-1 items-center justify-center overflow-x-hidden"
>
  {#if $loadedModel}
    <div>
      {#each $loadedModel.inputs as input}
        <div class="flex flex-col gap-2 mb-4">
          <Label
            for={Object.keys(input)[0]}
            class="text-sm font-medium text-gray-700"
          >
            {Object.keys(input)[0]}
          </Label>
          {#if input[Object.keys(input)[0]] === "string"}
            <Input
              id={Object.keys(input)[0]}
              type="text"
              placeholder={Object.keys(input)[0]}
              oninput={(e) =>
                handleInputChange(Object.keys(input)[0], (e.target as HTMLInputElement).value)}
            />
          {:else if input[Object.keys(input)[0]] === "integer"}
            <Input
              id={Object.keys(input)[0]}
              type="number"
              step="1"
              placeholder={Object.keys(input)[0]}
              oninput={(e) =>
                handleInputChange(
                  Object.keys(input)[0],
                  ((e.target as HTMLInputElement).value),
                )}
            />
          {:else if input[Object.keys(input)[0]] === "number"}
            <Input
              id={Object.keys(input)[0]}
              type="number"
              value={$loadedModel.default[Object.keys(input)[0]]}
              placeholder={Object.keys(input)[0]}
              oninput={(e) =>
                handleInputChange(
                  Object.keys(input)[0],
                  parseFloat((e.target as HTMLInputElement).value),
                )}
            />
          {:else if input[Object.keys(input)[0]] === "boolean"}
            <Checkbox
              id={Object.keys(input)[0]}
              onchange={(e) =>
                handleInputChange(Object.keys(input)[0], (e.target as HTMLInputElement)?.checked || false)}
            />
          {:else if input[Object.keys(input)[0]] === "selection"}
            <!-- <Select.Root
              id={Object.keys(input)[0]}
              onchange={(e) =>
                handleInputChange(Object.keys(input)[0], (e.target as HTMLSelectElement).value)}
              class="border border-gray-300 rounded px-2 py-1"
              value={$loadedModel.default[Object.keys(input)[0]]}
            >
              {#each $loadedModel.$ref[Object.keys(input)[0]] as option}
                <option value={option}>{option}</option>
              {/each}
            </Select.Root> -->
            <Select.Root type="single" onValueChange={(e) =>
              handleInputChange(Object.keys(input)[0], e)}
              value={$loadedModel.default[Object.keys(input)[0]]}
              >
              <Select.Trigger class="border border-gray-300 rounded px-2 py-1">
                {$loadedModel.default[Object.keys(input)[0]]}
              </Select.Trigger>
              <Select.Content>
                <Select.Group>
                  {#each $loadedModel.$ref[Object.keys(input)[0]] as option}
                    <Select.Item value={option} label={option}
                      >{option}</Select.Item
                    >
                  {/each}
                </Select.Group>
              </Select.Content>
            </Select.Root>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div class="w-full h-full flex flex-col items-center justify-center">
      <h1 class="text-2xl font-bold">No Model Loaded</h1>
      <p>
        Go to <a href="/models" class="text-primary">Models</a> and create one
      </p>
    </div>
  {/if}
</div>
