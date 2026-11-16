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
    /** For ordering the index, newest first. */
    date: z.coerce.date(),
    /** The end-of-post credit. */
    byline: z.string().default("Gary Giambatista and Claude"),
    /** The kanji on the post's card in the index, with its reading and meaning. */
    mark: z.object({ kanji: z.string(), reading: z.string(), meaning: z.string() }),
    /** The card's hover pattern (lib/patterns.ts MON). */
    mon: z.enum(["work", "project", "learning", "teaching", "marketing", "education"]),
    readingTime: z.string(),
    /** The table of contents: each h2's id and label. */
    toc: z.array(z.object({ id: z.string(), label: z.string() })),
  }),
});

export const collections = { blog };
