import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ pattern: "*.mdx", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** Shown in the eyebrow, e.g. "October 2026". */
    published: z.string(),
    readingTime: z.string(),
    /** The table of contents: each h2's id and label. */
    toc: z.array(z.object({ id: z.string(), label: z.string() })),
  }),
});

export const collections = { blog };
