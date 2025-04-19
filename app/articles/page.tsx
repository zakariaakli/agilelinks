
// app/articles/page.tsx
import React from 'react';
import Link from 'next/link';
import { db, collection, getDocs } from '../../firebase';
import ArticleCard from '../../Components/ArticleCard';
import styles from '../../Styles/articles.module.css';

// Define a type for the article
interface Article {
  slug: string;
  title: string;
  image: string;
  description: string; // Add the description field
  // Add other fields if necessary
}

// Create a separate function to fetch data
async function getData(): Promise<Article[]> {
  const querySnapshot = await getDocs(collection(db, 'Articles'));
  const fetchedArticles = querySnapshot.docs.map((doc) => ({
    slug: doc.data().slug,
    title: doc.data().title,
    image: doc.data().image,
    description: doc.data().description, // Add the description field
    ...doc.data(),
  })) as Article[];

  return fetchedArticles;
}

const ArticlesPage = async () => {
  const articles = await getData();

  return (
    <div className={styles.articlesListing}>
      <div className={styles.header}>
      <h1>Discover insights and knowledge from our articles.</h1>
      </div>
      <div className={styles.articlesGrid}>
        {articles.map((article) => (
          <Link href={`/articles/${article.slug}`} key={article.slug}>
          <ArticleCard

            title={article.title}
            slug={article.slug}
            description={article.description} // Pass the description as a prop
            image={article.image}
          />
           </Link>
        ))}
      </div>
      {/* Call to Action */}
      <div className={styles.cta}>
        <p>
          Liked our articles? <a href="/subscribe">Sign up for more insights!</a>
        </p>
      </div>
    </div>
  );
};

export default ArticlesPage;
