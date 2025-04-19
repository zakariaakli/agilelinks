// src/app/articles/[slug]/page.tsx
import React from 'react';
import { db, collection, getDocs, query, where } from '../../../firebase'; // Firebase methods
import { Article } from '../../types/article'; // Import Article type
import Head from 'next/head'; // SEO Head for page metadata
import styles from '../../Styles/article.module.css'; // Import styles for article
import AuthorCard from '../../Components/AuthorCard'; // Import Author Card
import InsightsSection from '../../Components/InsightsSection'; // Import Insights Section
import Seo from '../../Components/Seo'; // Import Seo for SEO optimization

// Mockup data for missing fields
const mockupData = {
  author: "John Doe",
  date: new Date().toISOString(),
  featuredImage: "https://source.unsplash.com/random/800x600", // Mock image URL
};

const fetchArticle = async (slug: string): Promise<Article | null> => {
  const q = query(collection(db, 'Articles'), where('slug', '==', slug));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null; // Return null if article is not found
  }

  const article = querySnapshot.docs[0].data(); // Get the article data

  // Return the article data with proper types
  return {
    title: article.title,
    content: article.content ? article.content : "",
    description: article.description ? article.description : "",
    slug: article.slug ? article.slug : "",
    image: article.image ? article.image : "",
    author: article.author ? article.author : "",
    date: article.date ? article.date.toDate().toISOString() : new Date().toISOString(),
  };
};

// Fetch article params using async/await
export async function generateStaticParams() {
  const querySnapshot = await getDocs(collection(db, 'Articles'));
  const slugs = querySnapshot.docs.map((doc) => ({ slug: doc.data().slug }));

  return slugs.map(({ slug }) => ({
    slug,
  }));
}

// SEO Metadata
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const article = await fetchArticle(slug);

  const title = article ? article.title : 'Article Not Found';
  const description = article ? article.description : 'Description not available';

  return {
    title: `${title} - Enneagram Insights`,
    description: description,
    openGraph: {
      title: `${title} - Enneagram Insights`,
      description: description,
      url: `https://yourwebsite.com/articles/${slug}`,
    },
  };
}

// Article Page Rendering
const ArticlePage = async ({ params }: { params: { slug: string } }) => {
  const { slug } = params; // Await params before accessing
  const article = await fetchArticle(slug);

  if (!article) {
    return <p>Article not found</p>; // Show this if the article is not found
  }

  return (
    <>
      <Head>
        <title>{article.title} | Enneagram Insights</title>
        <meta name="description" content={article.content.substring(0, 150)} />
        <meta name="keywords" content="Enneagram, personality test, coaching, insights" />
      </Head>

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

      {/* Call to Action */}
      <div className={styles.cta}>
        <p>Liked this article? <a href="/subscribe">Sign up for more insights!</a></p>
      </div>
    </>
  );
};

export default ArticlePage;
