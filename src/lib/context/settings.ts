import { writable, type Writable } from "svelte/store";
import { derived } from "svelte/store";

const localStorage = window.localStorage;

export const apiKey: Writable<string | null> = writable<string | null>(
    localStorage.getItem("apiKey") || null
);
export const setApiKey = (key: string | null) => {
    apiKey.set(key);
    if (key) {
        localStorage.setItem("apiKey", key);
    } else {
        localStorage.removeItem("apiKey");
    }
}
export const clearApiKey = () => {
    apiKey.set(null);
    localStorage.removeItem("apiKey");
}