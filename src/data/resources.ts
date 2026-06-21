import type { Resource } from "./types";

/**
 * Your study resources. Add/edit freely — `id`s are referenced from
 * curriculum.ts subtopics via `resourceIds`. Keep ids stable.
 */
export const resources: Resource[] = [
  {
    id: "mml-book",
    title: "Mathematics for Machine Learning",
    type: "book",
    url: "https://mml-book.github.io/",
    author: "Deisenroth, Faisal, Ong",
    pillarIds: ["math"],
    note: "Primary text for the math foundations.",
  },
  {
    id: "cs229",
    title: "CS229: Machine Learning",
    type: "course",
    url: "https://cs229.stanford.edu/",
    author: "Stanford / Andrew Ng",
    pillarIds: ["ml"],
    note: "Core classical ML coverage.",
  },
  {
    id: "iitm-dl",
    title: "Deep Learning (NPTEL / IIT Madras)",
    type: "course",
    url: "https://nptel.ac.in/courses/106106184",
    author: "Mitesh Khapra, IIT Madras",
    pillarIds: ["dl"],
    note: "Deep learning fundamentals.",
  },
  {
    id: "transformers-web",
    title: "Transformers & LLMs (the web)",
    type: "web",
    url: "https://jalammar.github.io/illustrated-transformer/",
    author: "Various (blogs, papers)",
    pillarIds: ["llms"],
    note: "Illustrated Transformer, papers, blog posts — curate links here.",
  },
  {
    id: "neetcode",
    title: "NeetCode 150",
    type: "practice",
    url: "https://neetcode.io/practice",
    author: "NeetCode",
    pillarIds: ["dsa"],
    note: "DSA roadmap & problem set.",
  },
];
