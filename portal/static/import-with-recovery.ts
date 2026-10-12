type DeferredModule = "ingredient-lab" | "product-sheet" | "recipe-sheet" | "fire-almanac";

/** Retry an already failed local module URL only after explicit page recovery. */
export async function importWithRecovery<T>(name: DeferredModule, load: () => Promise<T>, retryKey = "section_retry"): Promise<T> {
  try { return await load(); }
  catch (error) {
    // WebKit may keep a rejected module URL across reloads. Vite's preload links
    // identify the current build; never guess a hash or fetch a different origin.
    const retry = new URL(window.location.href).searchParams.get(retryKey);
    if (retry && /^\d+$/.test(retry)) {
      for (const link of document.querySelectorAll<HTMLLinkElement>('link[rel="modulepreload"]')) {
        const url = new URL(link.href);
        if (url.origin === window.location.origin && new RegExp(`^/assets/${name}-[\\w-]+\\.js$`).test(url.pathname)) {
          url.searchParams.set("retry", retry);
          return await import(/* @vite-ignore */ url.href);
        }
      }
    }
    throw error;
  }
}
