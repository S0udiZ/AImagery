<script lang="ts">
  import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
  import { writable, type Writable } from "svelte/store";
  import { loadedModel } from "$lib/context/loadedModel";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import Replicate from "replicate";
  import type { Prediction } from "replicate";
  import { parseProgressFromLogs } from "replicate";
  import { apiKey } from "$lib/context/settings";
  import { Button } from "$lib/components/ui/button";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import { toast } from "svelte-sonner";
  import { fetch } from "@tauri-apps/plugin-http";

  const replicate = new Replicate({
    auth: $apiKey as string | undefined,
    fetch,
    useFileOutput: false,
  });

  // Use a Svelte store for outputs
  const outputs = writable<string[]>([]);

  let generating: boolean = $state(false);

  let outputLog: string = $state("");
  let outputError: boolean = $state(false)

  // Compute grid dimensions (rows & columns) for a square-like layout
  let columns = $derived.by(() => {
    const n = $outputs.length;
    if (n > 0) {
      const c = Math.ceil(Math.sqrt(n));
      return Math.min(c, n);
    }
    return 1;
  });
  let rows = $derived.by(() => {
    const n = $outputs.length;
    if (n > 0) {
      const c = columns;
      return Math.ceil(n / c);
    }
    return 1;
  });

  const formData: Writable<Record<string, any>> = writable({});
  const url: Writable<string[] | string> = writable("");

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

  // Preprocess inputs to extract key and type
  let processedInputs = $derived(
    $loadedModel?.inputs.map((input) => {
      const key = Object.keys(input)[0];
      const type = input[key];
      return { key, type };
    }) || [],
  );

  async function handleSubmit() {
    const urlPath: `${string}/${string}:${string}` = `${$loadedModel?.owner}/${$loadedModel?.model}:${$loadedModel?.version}`;
    const input = $formData;

    // Basic sanitization and validation
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === "string") {
        // Remove potentially dangerous characters and trim whitespace
        input[key] = value.replace(/[<>`"'\\]/g, "").trim();
      }
      // Add more type-specific validation as needed
    }

    if (!input.prompt) {
      toast.error("Prompt is required");
      return;
    }
    // Optionally, validate prompt length or allowed characters here

    try {
      await replicate.run(
        urlPath,
        {
          input,
          wait: {
            mode: "poll",
            interval: 100
          }
        },
        handleProgress,
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate output: " + error);
      outputLog += "\n" + error;
      outputError = true;
    }
  }

  async function handleProgress(prediction: Prediction) {
    switch (prediction.status) {
      case "succeeded":
        generating = false;
        outputs.set(
          Array.isArray(prediction.output)
            ? prediction.output
            : [prediction.output],
        );
        break;
      case "starting":
        outputLog = "";
        outputError = false;
        generating = true;
        break;
      case "processing":
        outputLog = prediction.logs as string;
        break;
      case "failed":
        outputs.set([]);
        generating = false;
        toast.error(prediction.error as string);
        outputLog += "\n" + prediction.error as string;
        outputError = true;
        break;
      case "canceled":
        outputs.set([]);
        generating = false;
        toast.info("Prediction was canceled");
        outputLog += "\n Prediction was canceled"
        break;
      default:
        break;
    }
  }
</script>

<div
  class="max-w-full h-full flex flex-1 items-center justify-center overflow-x-hidden"
>
  {#if $loadedModel}
    <div class="w.full grid grid-cols-2 gap-4 p-4 pb-0 flex-1">
      <ScrollArea class="w-full h-full]">
        {#each processedInputs as { key, type }}
          <div class="flex flex-col gap-2 mb-4">
            <Label for={key} class="text-sm font-medium text-gray-700">
              {key}
            </Label>
            {#if type === "string"}
              <Input
                id={key}
                type="text"
                placeholder={key}
                oninput={(e) =>
                  handleInputChange(key, (e.target as HTMLInputElement).value)}
              />
            {:else if type === "integer"}
              <Input
                id={key}
                type="number"
                step="1"
                value={$loadedModel.default[key]}
                oninput={(e) =>
                  handleInputChange(
                    key,
                    Number.parseInt((e.target as HTMLInputElement).value),
                  )}
              />
            {:else if type === "number"}
              <Input
                id={key}
                type="number"
                value={$loadedModel.default[key]}
                oninput={(e) =>
                  handleInputChange(
                    key,
                    Number.parseFloat((e.target as HTMLInputElement).value),
                  )}
              />
            {:else if type === "boolean"}
              <Checkbox
                id={key}
                onchange={(e) =>
                  handleInputChange(
                    key,
                    (e.target as HTMLInputElement)?.checked || false,
                  )}
              />
            {:else if type === "selection"}
              <Select.Root
                type="single"
                onValueChange={(e) => handleInputChange(key, e)}
                value={$loadedModel.default[key]}
              >
                <Select.Trigger
                  class="border border-gray-300 rounded px-2 py-1"
                >
                  {$loadedModel.default[key]}
                </Select.Trigger>
                <Select.Content>
                  <Select.Group>
                    {#each $loadedModel.$ref[key] as option}
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
        <Button variant="secondary" onclick={handleSubmit}>Generate</Button>
      </ScrollArea>
      {#if generating}
        <pre class="overflow-auto max-h-full" class:text-red-500={outputError}>{@html outputLog}</pre>
      {:else}
        <div
          class="grid gap-4"
          style={`
          grid-template-columns: repeat(${columns}, minmax(0, 1fr));
          grid-template-rows: repeat(${rows}, auto);
        `}
        >
          {#each $outputs as output}
            <img
              src={output}
              alt=""
              class="w-full h-auto object-cover"
              loading="lazy"
            />
          {/each}
        </div>
      {/if}
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
