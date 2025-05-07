import { writable, type Writable } from "svelte/store";
import type { ModelParameters } from "./loadedModel";

const localStorage = window.localStorage;
const localStorageKey = "createdModels";

// Store for keeping track of created models
export const createdModels: Writable<ModelParameters[]> = writable<
  ModelParameters[]
>(
  // Initialize from localStorage or empty array
  JSON.parse(localStorage.getItem(localStorageKey) || "[]") || []
);

// Add a new model to the list and persist
export function addCreatedModel(model: ModelParameters) {
  createdModels.update((models) => {
    const newModels = [...models, model];
    localStorage.setItem(localStorageKey, JSON.stringify(newModels));
    return newModels;
  });
}

// Remove a model by index and persist
export function removeCreatedModel(index: number) {
  createdModels.update((models) => {
    const newModels = models.filter((_, i) => i !== index);
    localStorage.setItem(localStorageKey, JSON.stringify(newModels));
    return newModels;
  });
}

// Clear all created models
export function clearCreatedModels() {
  createdModels.set([]);
  localStorage.removeItem(localStorageKey);
}