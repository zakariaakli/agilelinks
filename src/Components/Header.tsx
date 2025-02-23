import React from 'react';
import Link from 'next/link';
import styles from '../Styles/header.module.css'; // CSS module for styling

const Header = () => {
  return (
    <header className={styles.header}>
      {/* Logo */}
      <div className={styles.logo}>
        <Link href="/">
          <img
            src="/logo.jpg" // This should be the path to your logo file
            alt="AgileLinks Logo"
            className={styles.logoImage}
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/articles">Articles</Link></li>
          <li><Link href="/about">About</Link></li>
          <li><Link href="/contact">Contact</Link></li>
        </ul>
      </nav>

      {/* Language Selector and Icons */}
      <div className={styles.cta}>
        <Link href="#" className={styles.languageSelector}>FR | EN</Link> {/* Language selection */}
        <div className={styles.socialIcons}>
          {/* Add your social media icons here */}
          <a href="#"><img src="/icons/facebook.svg" alt="Facebook" /></a>
          <a href="#"><img src="/icons/instagram.svg" alt="Instagram" /></a>
          <a href="#"><img src="/icons/twitter.svg" alt="Twitter" /></a>
          <a href="#"><img src="/icons/linkedin.svg" alt="LinkedIn" /></a>
        </div>
      </div>

    </header>
  );
};

export default Header;
