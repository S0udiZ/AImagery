import { writable, type Writable } from "svelte/store";
import { derived } from "svelte/store";

type ModelParameters = {
    owner: string;
    model: string;
    version: string;
    inputs: Array<Record<string, string>>;
    default: Record<string, string>;
    $ref: Record<string, string | string[]>;
  };

const localStorage = window.localStorage;

export const loadedModel: Writable<ModelParameters | null> = writable<ModelParameters | null>(
    JSON.parse(localStorage.getItem("loadedModel") || "null") || null
);

export const setLoadedModel = (model: ModelParameters | null) => {
    loadedModel.set(model);
    if (model) {
        localStorage.setItem("loadedModel", JSON.stringify(model));
    } else {
        localStorage.removeItem("loadedModel");
    }
}

export const clearLoadedModel = () => {
    loadedModel.set(null);
    localStorage.removeItem("loadedModel");
}

// biome-ignore lint/style/useConst: <explanation>
export let loadedModelVersion = derived(loadedModel, ($loadedModel) => {
    $loadedModel?.version || null;
}
);
// biome-ignore lint/style/useConst: <explanation>
export let loadedModelName = derived(loadedModel, ($loadedModel) => {
    $loadedModel?.model || null;
}
);

// biome-ignore lint/style/useConst: <explanation>
export let loadedModelOwner = derived(loadedModel, ($loadedModel) => {
    $loadedModel?.owner || null;
}
);