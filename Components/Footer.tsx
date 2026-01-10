"use client";

import React from "react";
import Link from "next/link";
import styles from "../Styles/footer.module.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Main Footer Content */}
        <div className={styles.footerContent}>
          {/* Company Section */}
          <div className={styles.footerSection}>
            <div className={styles.brandSection}>
              <div className={styles.logoSection}>
                <img
                  src="/logo.jpg"
                  alt="AgileLinks Logo"
                  className={styles.footerLogo}
                />
                <div className={styles.brandName}>AgileLinks</div>
              </div>
              <p className={styles.brandDescription}>
                Empowering personal growth through intelligent coaching and
                personalized insights. Discover your potential and achieve your
                goals with personalized guidance.
              </p>
              <div className={styles.socialLinks}>
                <a
                  href="#"
                  className={styles.socialLink}
                  aria-label="Follow us on Twitter"
                >
                  <svg
                    className={styles.socialIcon}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a
                  href="#"
                  className={styles.socialLink}
                  aria-label="Follow us on LinkedIn"
                >
                  <svg
                    className={styles.socialIcon}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className={styles.socialLink}
                  aria-label="Follow us on Instagram"
                >
                  <svg
                    className={styles.socialIcon}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.618 5.367 11.986 11.988 11.986s11.987-5.368 11.987-11.986C24.014 5.367 18.635.001 12.017.001zM8.449 16.988c-1.297 0-2.348-1.051-2.348-2.348s1.051-2.348 2.348-2.348 2.348 1.051 2.348 2.348-1.051 2.348-2.348 2.348zm7.718 0c-1.297 0-2.348-1.051-2.348-2.348s1.051-2.348 2.348-2.348 2.348 1.051 2.348 2.348-1.051 2.348-2.348 2.348z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Product Section */}
          <div className={styles.footerSection}>
            <h3 className={styles.sectionTitle}>Product</h3>
            <ul className={styles.linkList}>
              <li>
                <Link href="/profile/companion" className={styles.footerLink}>
                  Goal Planner
                </Link>
              </li>
              <li>
                <Link href="/articles" className={styles.footerLink}>
                  Insights & Articles
                </Link>
              </li>
              <li>
                <Link href="/profile" className={styles.footerLink}>
                  Personal Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Section */}
          <div className={styles.footerSection}>
            <h3 className={styles.sectionTitle}>Resources</h3>
            <ul className={styles.linkList}>
              <li>
                <Link href="/about" className={styles.footerLink}>
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div className={styles.footerSection}>
            <h3 className={styles.sectionTitle}>Company</h3>
            <ul className={styles.linkList}>
              <li>
                <a href="#" className={styles.footerLink}>
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter Section */}
          <div className={styles.footerSection}>
            <h3 className={styles.sectionTitle}>Stay Updated</h3>
            <p className={styles.newsletterDescription}>
              Get the latest insights on personal development and goal
              achievement.
            </p>
            <form className={styles.newsletterForm}>
              <input
                type="email"
                placeholder="Enter your email"
                className={styles.newsletterInput}
                aria-label="Email for newsletter"
              />
              <button type="submit" className={styles.newsletterButton}>
                Subscribe
              </button>
            </form>
            <p className={styles.newsletterNote}>
              No spam, unsubscribe at any time.
            </p>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className={styles.footerBottom}>
          <div className={styles.bottomContent}>
            <p className={styles.copyright}>
              © {currentYear} AgileLinks. All rights reserved.
            </p>
            <div className={styles.bottomLinks}>
              <a href="#" className={styles.bottomLink}>
                Privacy
              </a>
              <a href="#" className={styles.bottomLink}>
                Terms
              </a>
              <a href="#" className={styles.bottomLink}>
                Accessibility
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
