import React from 'react';
import styles from '../Styles/authorCard.module.css'; // Correct CSS module import

const AuthorCard = ({ name, title, imageUrl }: { name: string, title: string, imageUrl: string }) => {
  return (
    <div className={styles.authorCard}>
      <img src="/zakariaakli.png" alt={name} className={styles.authorImage} />
      <h4 className={styles.authorName}>{name}</h4>
      <p className={styles.authorTitle}>{title}</p>
      <a href="#" className={styles.viewAllPosts}>ALL AUTHOR'S POSTS</a>
    </div>
  );
};

export default AuthorCard;
