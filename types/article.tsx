// src/types/article.ts
export interface Article {
    title: string;
    content: string;
    description: string;
    slug: string;
    image: string;
    author: string;
    date: string;
    keywords: Array<string>;
    readingTime: string;
  }
