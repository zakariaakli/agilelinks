import React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, collection, getDocs } from '../../../firebase';
import ArticleCard from '../../Components/ArticleCard';
import styles from '../../Styles/articles.module.css';

const ArticlesPage = () => {
  const [articles, setArticles] = useState<any[]>([]);

  // Fetch articles from Firestore when component mounts
  useEffect(() => {
    const fetchArticles = async () => {
      const querySnapshot = await getDocs(collection(db, 'Articles'));
      const fetchedArticles = querySnapshot.docs.map((doc) => ({
         slug: doc.data().slug,
         title: doc.data().title,
         image: doc.data().image,
        ...doc.data(),
      }));

      setArticles(fetchedArticles); // Store the articles in the state
    };

    fetchArticles();
  }, []); // Empty dependency array ensures this runs once when component mounts

  return (
    <div className={styles.articlesListing}>
      <div className={styles.articlesGrid}>
        {articles.map((article) => (
          <ArticleCard
            key={article.slug}
            title={article.title}
            slug={article.slug}
            description="{article.description}"
            image={article.image}
          />
        ))}
      </div>
    </div>
  );
};

export default ArticlesPage;
