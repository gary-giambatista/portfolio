/** Read once at load, like the prototype: motion preferences rarely change mid-visit. */
export const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
