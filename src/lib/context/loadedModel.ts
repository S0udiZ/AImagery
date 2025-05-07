import { writable, type Writable } from "svelte/store";

export type ModelParameters = {
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