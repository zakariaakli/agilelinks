"use client";

import React, { useState, useEffect } from 'react';
import { 
  CookiePreferences, 
  saveCookieConsent, 
  getCookieConsent,
  cookieCategories 
} from '../lib/cookieManager';
import styles from '../Styles/cookieSettings.module.css';

interface CookieSettingsProps {
  onClose: () => void;
  language: 'en' | 'fr';
}

interface SettingsTexts {
  title: string;
  description: string;
  categories: {
    essential: {
      name: string;
      description: string;
      note: string;
    };
    analytics: {
      name: string;
      description: string;
    };
    marketing: {
      name: string;
      description: string;
    };
    preferences: {
      name: string;
      description: string;
    };
  };
  buttons: {
    acceptAll: string;
    acceptSelected: string;
    rejectAll: string;
    close: string;
  };
  toggle: {
    enabled: string;
    disabled: string;
  };
}

const settingsTexts: Record<string, SettingsTexts> = {
  en: {
    title: "Cookie preferences",
    description: "We use cookies to enhance your experience. Choose which types of cookies you'd like to allow.",
    categories: {
      essential: {
        name: "Essential cookies",
        description: "Required for the website to function properly. These cannot be disabled.",
        note: "Always active"
      },
      analytics: {
        name: "Analytics cookies",
        description: "Help us understand how you use our platform so we can improve it."
      },
      marketing: {
        name: "Marketing cookies", 
        description: "Used to show you relevant content and advertisements."
      },
      preferences: {
        name: "Preference cookies",
        description: "Remember your settings and personalize your experience."
      }
    },
    buttons: {
      acceptAll: "Accept all",
      acceptSelected: "Accept selected",
      rejectAll: "Essential only",
      close: "Close"
    },
    toggle: {
      enabled: "Enabled",
      disabled: "Disabled"
    }
  },
  fr: {
    title: "Préférences des cookies",
    description: "Nous utilisons des cookies pour améliorer votre expérience. Choisissez les types de cookies que vous souhaitez autoriser.",
    categories: {
      essential: {
        name: "Cookies essentiels",
        description: "Nécessaires au bon fonctionnement du site web. Ils ne peuvent pas être désactivés.",
        note: "Toujours actif"
      },
      analytics: {
        name: "Cookies analytiques",
        description: "Nous aident à comprendre comment vous utilisez notre plateforme pour l'améliorer."
      },
      marketing: {
        name: "Cookies marketing",
        description: "Utilisés pour vous montrer du contenu et des publicités pertinents."
      },
      preferences: {
        name: "Cookies de préférences",
        description: "Mémorisent vos paramètres et personnalisent votre expérience."
      }
    },
    buttons: {
      acceptAll: "Tout accepter",
      acceptSelected: "Accepter la sélection",
      rejectAll: "Essentiels uniquement",
      close: "Fermer"
    },
    toggle: {
      enabled: "Activé",
      disabled: "Désactivé"
    }
  }
};

const CookieSettings: React.FC<CookieSettingsProps> = ({ onClose, language }) => {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Load existing preferences
    const existingConsent = getCookieConsent();
    if (existingConsent) {
      setPreferences(existingConsent.preferences);
    }

    // Animate modal in
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleToggle = (category: keyof CookiePreferences) => {
    if (category === 'essential') return; // Cannot disable essential cookies
    
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleAcceptAll = () => {
    const allEnabled: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    saveCookieConsent(allEnabled);
    handleClose();
  };

  const handleAcceptSelected = () => {
    saveCookieConsent(preferences);
    handleClose();
  };

  const handleRejectAll = () => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    saveCookieConsent(essentialOnly);
    handleClose();
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const texts = settingsTexts[language];

  return (
    <div 
      className={`${styles.modal} ${isVisible ? styles.visible : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{texts.title}</h2>
          <button 
            className={styles.closeButton}
            onClick={handleClose}
            aria-label={texts.buttons.close}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.modalDescription}>
            {texts.description}
          </p>

          <div className={styles.cookieCategories}>
            {/* Essential Cookies */}
            <div className={styles.categoryItem}>
              <div className={styles.categoryHeader}>
                <div className={styles.categoryInfo}>
                  <h3 className={styles.categoryName}>
                    {texts.categories.essential.name}
                  </h3>
                  <p className={styles.categoryDescription}>
                    {texts.categories.essential.description}
                  </p>
                </div>
                <div className={styles.categoryToggle}>
                  <div className={`${styles.toggle} ${styles.toggleDisabled}`}>
                    <span className={styles.toggleLabel}>
                      {texts.categories.essential.note}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className={styles.categoryItem}>
              <div className={styles.categoryHeader}>
                <div className={styles.categoryInfo}>
                  <h3 className={styles.categoryName}>
                    {texts.categories.analytics.name}
                  </h3>
                  <p className={styles.categoryDescription}>
                    {texts.categories.analytics.description}
                  </p>
                </div>
                <div className={styles.categoryToggle}>
                  <button
                    className={`${styles.toggle} ${preferences.analytics ? styles.toggleEnabled : styles.toggleDisabled}`}
                    onClick={() => handleToggle('analytics')}
                  >
                    <span className={styles.toggleSlider}></span>
                    <span className={styles.toggleLabel}>
                      {preferences.analytics ? texts.toggle.enabled : texts.toggle.disabled}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className={styles.categoryItem}>
              <div className={styles.categoryHeader}>
                <div className={styles.categoryInfo}>
                  <h3 className={styles.categoryName}>
                    {texts.categories.marketing.name}
                  </h3>
                  <p className={styles.categoryDescription}>
                    {texts.categories.marketing.description}
                  </p>
                </div>
                <div className={styles.categoryToggle}>
                  <button
                    className={`${styles.toggle} ${preferences.marketing ? styles.toggleEnabled : styles.toggleDisabled}`}
                    onClick={() => handleToggle('marketing')}
                  >
                    <span className={styles.toggleSlider}></span>
                    <span className={styles.toggleLabel}>
                      {preferences.marketing ? texts.toggle.enabled : texts.toggle.disabled}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Preferences Cookies */}
            <div className={styles.categoryItem}>
              <div className={styles.categoryHeader}>
                <div className={styles.categoryInfo}>
                  <h3 className={styles.categoryName}>
                    {texts.categories.preferences.name}
                  </h3>
                  <p className={styles.categoryDescription}>
                    {texts.categories.preferences.description}
                  </p>
                </div>
                <div className={styles.categoryToggle}>
                  <button
                    className={`${styles.toggle} ${preferences.preferences ? styles.toggleEnabled : styles.toggleDisabled}`}
                    onClick={() => handleToggle('preferences')}
                  >
                    <span className={styles.toggleSlider}></span>
                    <span className={styles.toggleLabel}>
                      {preferences.preferences ? texts.toggle.enabled : texts.toggle.disabled}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            className={`${styles.footerButton} ${styles.rejectButton}`}
            onClick={handleRejectAll}
          >
            {texts.buttons.rejectAll}
          </button>
          
          <button
            className={`${styles.footerButton} ${styles.acceptSelectedButton}`}
            onClick={handleAcceptSelected}
          >
            {texts.buttons.acceptSelected}
          </button>
          
          <button
            className={`${styles.footerButton} ${styles.acceptAllButton}`}
            onClick={handleAcceptAll}
          >
            {texts.buttons.acceptAll}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieSettings;