import { writable, type Writable } from "svelte/store";

export type ModelParameters = {
    owner: string;
    model: string;
    version: string;
    inputs: {
        [key: string]: {
            type: string;
            inputType: string;
            title: string;
            description: string;
            default?: string | number | boolean | null;
            minimum?: number;
            maximum?: number;
        }[]
    };
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