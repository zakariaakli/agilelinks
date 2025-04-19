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
  readingTime?: string;
}

const ClientArticle: React.FC<Props> = ({ title, author, date, image, content, slug, readingTime }) => {
  return (
    <article className={styles.articleContainer}>
      <header className={styles.articleHeader}>
        <img src={image} alt={title} className={styles.featuredImage} />
        <h1 className={styles.articleTitle}>{title}</h1>
        <div className={styles.metaInfo}>
          <span>{author}</span>
          <span> | {new Date(date).toLocaleDateString()}</span>
          {readingTime && <span> | {readingTime} min read</span>}
        </div>
      </header>

      <section className={styles.articleContent} dangerouslySetInnerHTML={{ __html: content }} />

      <div className={styles.shareSection}>
        <SocialShare url={`https://agilelinks.vercel.app/articles/${slug}`} title={title} />
      </div>

      <aside className={styles.sidebarSection}>
        <AuthorCard name={author} title="Digital Strategy & AI Consultant" imageUrl="/zakariaakli.png" />
        <InsightsSection />
      </aside>

      <footer className={styles.cta}>
        <p>
          Liked this article? <a href="/subscribe">Sign up for more insights!</a>
        </p>
      </footer>
    </article>
  );
};

export default ClientArticle;
