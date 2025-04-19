import React from 'react';
import { db, collection, getDocs, query, where } from '../../../firebase';
import { Article } from '../../../types/article';
import Script from 'next/script';
import ClientArticle from '../../../Components/ClientArticle';

const fetchArticle = async (slug: string): Promise<Article | null> => {
  const q = query(collection(db, 'Articles'), where('slug', '==', slug));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return null;

  const article = querySnapshot.docs[0].data();

  return {
    title: article.title,
    content: article.content || "",
    description: article.description || "",
    slug: article.slug || "",
    image: article.image || "",
    author: article.author || "",
    date: article.date ? article.date.toDate().toISOString() : new Date().toISOString(),
    keywords: Array.isArray(article.keywords) ? article.keywords : [],
    readingTime: article.readingTime || "",
  };
};

export async function generateStaticParams() {
  const querySnapshot = await getDocs(collection(db, 'Articles'));
  return querySnapshot.docs.map((doc) => ({ slug: doc.data().slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  // ✅ Await the article before accessing its properties
  const article = await fetchArticle(params.slug);

  const title = article?.title ?? "Article Not Found";
  const description = article?.description ?? "Explore insights on agile, enneagram, and teams.";
  const image = article?.image ?? "https://yourdomain.com/default-og-image.jpg";
  const keywords = article?.keywords?.length ? article.keywords : [
    "Enneagram",
    "Agile Teams",
    "Leadership",
    "Team Dynamics",
    "Personality Insights"
  ];

  return {
    title: `${title} - Enneagram Insights`,
    description,
    keywords,
    alternates: {
      canonical: `https://agilelinks.vercel.app/articles/${params.slug}`, // ✅ Canonical URL
    },
    openGraph: {
      title,
      description,
      images: [{ url: image }],
      url: `https://agilelinks.vercel.app/articles/${params.slug}`,
      type: 'article',
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    }
  };
}


const ArticlePage = async ({ params }: { params: { slug: string } }) => {
  const article = await fetchArticle(params.slug);
  if (!article) return <p>Article not found</p>;

  return (
    <>
      <Script type="application/ld+json" id="article-jsonld">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.description,
          image: article.image,
          author: {
            "@type": "Person",
            name: article.author,
          },
          datePublished: article.date,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://agilelinks.vercel.app/articles/${article.slug}`,
          }
        })}
      </Script>

      <ClientArticle
        title={article.title}
        author={article.author}
        date={article.date}
        image={article.image}
        content={article.content}
        slug={article.slug}
      />
    </>
  );
};

export default ArticlePage;
