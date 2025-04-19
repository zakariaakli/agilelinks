import React from 'react';
import styles from '../Styles/authorCard.module.css';

const AuthorCard = ({ name, title, imageUrl }: { name: string, title: string, imageUrl: string }) => {
  return (
    <div className={styles.authorCard}>
      <img src={imageUrl} alt={name} className={styles.authorImage} />
      <h4 className={styles.authorName}>{name}</h4>
      <p className={styles.authorTitle}>{title}</p>
      {/* <a href="#" className={styles.viewAllPosts}>View all posts by {name}</a> */}
    </div>
  );
};

export default AuthorCard;
