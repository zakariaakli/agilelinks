// src/app/articles/[slug]/page.tsx
import React from 'react';
import { db, collection, getDocs, query, where } from '../../../firebase';
import { Article } from '../../../types/article';
import styles from '../../../Styles/article.module.css';
import AuthorCard from '../../../Components/AuthorCard';
import InsightsSection from '../../../Components/InsightsSection';
import Script from 'next/script';

// Mockup data for fallback
const mockupData = {
  author: "John Doe",
  date: new Date().toISOString(),
  featuredImage: "https://source.unsplash.com/random/800x600",
};

// Fetch article data
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
  };
};

// Used by Next.js to prebuild paths
export async function generateStaticParams() {
  const querySnapshot = await getDocs(collection(db, 'Articles'));
  return querySnapshot.docs.map((doc) => ({
    slug: doc.data().slug,
  }));
}

// ✅ SEO Metadata with keywords
export async function generateMetadata({ params }: { params: { slug: string } }) {
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

// ✅ Main Page Component
const ArticlePage = async ({ params }: { params: { slug: string } }) => {
  const article = await fetchArticle(params.slug);

  if (!article) return <p>Article not found</p>;

  return (
    <>
      {/* JSON-LD Structured Data for Rich Results */}
      <Script type="application/ld+json" id="article-jsonld">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.description,
          image: article.image,
          author: {
            "@type": "Person",
            name: article.author || mockupData.author,
          },
          datePublished: article.date,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://agilelinks.vercel.app/articles/${article.slug}`,
          }
        })}
      </Script>

      <div className={styles.articleLayout}>
        <div className={styles.leftColumn}>
          <AuthorCard
            name={article.author || mockupData.author}
            title={article.title}
            imageUrl={article.image || mockupData.featuredImage}
          />
        </div>

        <div className={styles.centerColumn}>
          <div className={styles.articleHeader}>
            <img src={article.image || mockupData.featuredImage} alt={article.title} className={styles.featuredImage} />
            <h1 className={styles.articleTitle}>{article.title}</h1>
            <div className={styles.articleMeta}>
              <span className={styles.author}>{article.author || mockupData.author}</span> |
              <span className={styles.date}>{article.date || mockupData.date}</span>
            </div>
          </div>

          <div className={styles.articleContent}>
            <div>{article.content}</div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <InsightsSection />
        </div>
      </div>

      <div className={styles.cta}>
        <p>Liked this article? <a href="/subscribe">Sign up for more insights!</a></p>
      </div>
    </>
  );
};

export default ArticlePage;
