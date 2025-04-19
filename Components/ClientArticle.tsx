'use client';

import React from 'react';
import SocialShare from './SocialShare';
import styles from '../Styles/article.module.css';
import AuthorCard from './AuthorCard';
import InsightsSection from './InsightsSection';

interface Props {
  title: string;
  author: string;
  date: string;
  image: string;
  content: string;
  slug: string;
}

const ClientArticle: React.FC<Props> = ({ title, author, date, image, content, slug }) => {
  return (
    <>
      <div className={styles.articleLayout}>
        <div className={styles.leftColumn}>
          <AuthorCard
            name={author}
            title={title}
            imageUrl={image}
          />
        </div>

        <div className={styles.centerColumn}>
          <div className={styles.articleHeader}>
            <img src={image} alt={title} className={styles.featuredImage} />
            <h1 className={styles.articleTitle}>{title}</h1>
            <div className={styles.articleMeta}>
              <span className={styles.author}>{author}</span> |
              <span className={styles.date}>{date}</span>
            </div>
          </div>

          <div className={styles.articleContent}>
            <div>{content}</div>
          </div>

          <SocialShare url={`https://agilelinks.vercel.app/articles/${slug}`} title={title} />
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

export default ClientArticle;
