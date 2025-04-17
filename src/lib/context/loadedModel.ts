import { writable, type Writable } from "svelte/store";
import { derived } from "svelte/store";

const localStorage = window.localStorage;

export const loadedModel: Writable<string | null> = writable<string | null>(
    localStorage.getItem("loadedModel") || null
);

export const setLoadedModel = (model: string | null) => {
    loadedModel.set(model);
    if (model) {
        localStorage.setItem("loadedModel", model);
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
    if ($loadedModel) {
        const parts = $loadedModel.split(":");
        if (parts.length > 1) {
            return parts[1];
        }
    }
    return null;
}
);
// biome-ignore lint/style/useConst: <explanation>
export let loadedModelName = derived(loadedModel, ($loadedModel) => {
    if ($loadedModel) {
        const parts = $loadedModel.split(":");
        if (parts.length > 0) {
            return parts[0].split("/").pop() || null;
        }
    }
    return null;
}
);

// biome-ignore lint/style/useConst: <explanation>
export let loadedModelOwner = derived(loadedModel, ($loadedModel) => {
    if ($loadedModel) {
        const parts = $loadedModel.split(":");
        if (parts.length > 0) {
            return parts[0].split("/")[0];
        }
    }
    return null;
}
);