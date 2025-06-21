"use client";

import React, { useState, useEffect } from 'react';
import { 
  shouldShowCookieBanner, 
  acceptAllCookies, 
  acceptEssentialOnly,
  initializeCookieManager 
} from '../lib/cookieManager';
import CookieSettings from './CookieSettings';
import styles from '../Styles/cookieConsent.module.css';

interface CookieTexts {
  title: string;
  description: string;
  acceptAll: string;
  essentialOnly: string;
  customize: string;
  learnMore: string;
  privacyPolicy: string;
}

const texts: Record<string, CookieTexts> = {
  en: {
    title: "We value your privacy",
    description: "We use cookies to enhance your experience, analyze performance, and personalize content. You can customize your preferences or accept our recommended settings.",
    acceptAll: "Accept all",
    essentialOnly: "Essential only", 
    customize: "Customize",
    learnMore: "Learn more",
    privacyPolicy: "Privacy Policy"
  },
  fr: {
    title: "Nous respectons votre vie privée",
    description: "Nous utilisons des cookies pour améliorer votre expérience, analyser les performances et personnaliser le contenu. Vous pouvez personnaliser vos préférences ou accepter nos paramètres recommandés.",
    acceptAll: "Tout accepter",
    essentialOnly: "Essentiels uniquement",
    customize: "Personnaliser", 
    learnMore: "En savoir plus",
    privacyPolicy: "Politique de confidentialité"
  }
};

const CookieConsent: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [language, setLanguage] = useState<'en' | 'fr'>('en');

  useEffect(() => {
    // Initialize cookie manager
    initializeCookieManager();
    
    // Check if banner should be shown
    const shouldShow = shouldShowCookieBanner();
    if (shouldShow) {
      // Small delay for better UX
      setTimeout(() => {
        setShowBanner(true);
        setIsAnimating(true);
      }, 1000);
    }

    // Detect language from browser or URL
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('fr')) {
      setLanguage('fr');
    }
  }, []);

  const handleAcceptAll = () => {
    setIsAnimating(false);
    setTimeout(() => {
      acceptAllCookies();
      setShowBanner(false);
    }, 300);
  };

  const handleEssentialOnly = () => {
    setIsAnimating(false);
    setTimeout(() => {
      acceptEssentialOnly();
      setShowBanner(false);
    }, 300);
  };

  const handleCustomize = () => {
    setShowSettings(true);
  };

  const handleSettingsClose = () => {
    setShowSettings(false);
    setShowBanner(false);
  };

  const currentTexts = texts[language];

  if (!showBanner) return null;

  return (
    <>
      <div className={`${styles.cookieBanner} ${isAnimating ? styles.visible : ''}`}>
        <div className={styles.cookieContent}>
          <div className={styles.cookieInfo}>
            <div className={styles.cookieIcon}>
              🍪
            </div>
            <div className={styles.cookieText}>
              <h3 className={styles.cookieTitle}>
                {currentTexts.title}
              </h3>
              <p className={styles.cookieDescription}>
                {currentTexts.description}
              </p>
              <a 
                href="/privacy-policy" 
                className={styles.privacyLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {currentTexts.learnMore}
              </a>
            </div>
          </div>
          
          <div className={styles.cookieActions}>
            <button
              onClick={handleEssentialOnly}
              className={`${styles.cookieButton} ${styles.essentialButton}`}
            >
              {currentTexts.essentialOnly}
            </button>
            
            <button
              onClick={handleCustomize}
              className={`${styles.cookieButton} ${styles.customizeButton}`}
            >
              {currentTexts.customize}
            </button>
            
            <button
              onClick={handleAcceptAll}
              className={`${styles.cookieButton} ${styles.acceptButton}`}
            >
              {currentTexts.acceptAll}
            </button>
          </div>
        </div>
      </div>

      {/* Cookie Settings Modal */}
      {showSettings && (
        <CookieSettings 
          onClose={handleSettingsClose}
          language={language}
        />
      )}
    </>
  );
};

export default CookieConsent;