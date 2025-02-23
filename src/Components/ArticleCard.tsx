import Link from 'next/link';
import styles from '../Styles/articles.module.css'; // CSS module for styles

const ArticleCard = ({ title, slug, description, image }: { title: string, slug: string, description: string, image: string }) => {
 const imgUrl = "https://firebasestorage.googleapis.com/v0/b/enneachat-3883f.firebasestorage.app/o/EnneagramLogo.png?alt=media&token=cfd1fed4-a56e-4a2a-8d22-442c2e11c285"
  return (
    <div className={styles.articleCard}>
      <img src={image} alt={title} className={styles.articleImage} />
      <h3 className={styles.articleTitle}>
        <Link href={`/articles/${slug}`}>{title}</Link>
      </h3>
      <p className={styles.articleDescription}>{description}</p>
      <Link href={`/articles/${slug}`}>
        <span className={styles.readMore}>Read More</span>
      </Link>
    </div>
  );
};

export default ArticleCard;
