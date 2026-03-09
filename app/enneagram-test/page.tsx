'use client';

import React from 'react';
import Link from 'next/link';
import AIEnneagramTest from '../../Components/AIEnneagramTest';
import styles from '../../Styles/enneagramTest.module.css';

export default function EnneagramTestPage() {
  return (
    <div className={styles.pageShell}>
      <header className={styles.pageHeader}>
        <Link href="/about" className={styles.logoMark}>
          Stepiva
        </Link>
        <Link href="/about" className={styles.backLink}>
          ← Back to home
        </Link>
      </header>
      <AIEnneagramTest />
    </div>
  );
}
