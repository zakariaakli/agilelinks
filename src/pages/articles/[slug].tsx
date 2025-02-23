import React from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { db, collection, getDocs, query, where } from '../../../firebase'; // Import `doc` and `getDoc` methods
import styles from '../../Styles/article.module.css';
import AuthorCard from '../../Components/AuthorCard';
import InsightsSection from '../../Components/InsightsSection';
import Header from '../../Components/Header';

// Mockup data for missing fields
const mockupData = {
  author: "John Doe",
  date: new Date().toISOString(),
  featuredImage: "https://source.unsplash.com/random/800x600", // Mock image URL
};

const ArticlePage = ({ article }: { article: any }) => {
  if (!article) return <p>Article not found</p>;

  return (
    <>
    <Header />
      <Head>
        <title>{article.title} | Enneagram Insights</title>
        <meta name="description" content={article.content.substring(0, 150)} />
        <meta name="keywords" content="Enneagram, personality test, coaching, insights" />
      </Head>

      <div className={styles.articleLayout}>
        <div className={styles.leftColumn}>
          <AuthorCard
            name={article.author || mockupData.author}
            title={article.title }
            imageUrl={article.featuredImage || mockupData.featuredImage}
          />
        </div>

        <div className={styles.centerColumn}>
          <div className={styles.articleHeader}>
            <img src={ article.image } alt={article.title} className={styles.featuredImage} />
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

export const getStaticPaths: GetStaticPaths = async () => {
  const querySnapshot = await getDocs(collection(db, 'Articles'));
  const paths = querySnapshot.docs.map((doc) => ({
    params: { slug: doc.data().slug },  // Use Firestore document id as the slug
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  // Query Firestore using the `slug` field (not the document ID)
  const q = query(collection(db, 'Articles'), where('slug', '==', params?.slug));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return { props: { article: null } }; // If no matching article found, return null
  }

  const article = querySnapshot.docs[0].data();  // Get the first (and only) result

  // Convert Firestore `date` to string or timestamp
  const articleData = {
    ...article,
    date: article.date ? article.date.toDate().toISOString() : null, // Convert to ISO string
  };

  return {
    props: {
      article: articleData,
    },
  };
};

export default ArticlePage;
