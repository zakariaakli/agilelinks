"use client";

import React, { useState } from 'react';
import styles from '../../Styles/privacy.module.css';

const PrivacyPolicyPage: React.FC = () => {
  const [language, setLanguage] = useState<'en' | 'fr'>('en');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'fr' : 'en');
  };

  const content = {
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: December 2024",
      sections: {
        introduction: {
          title: "1. Introduction",
          content: [
            "Welcome to AgileLinks. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and protect your information when you use our platform.",
            "AgileLinks is an educational technology platform that helps users achieve their personal and professional goals through AI-powered insights and personalized learning experiences."
          ]
        },
        dataCollection: {
          title: "2. Information We Collect",
          content: [
            "We collect information you provide directly to us, such as:",
            "• Account information (name, email address)",
            "• Profile information and preferences",
            "• Goal and milestone data you create",
            "• Feedback and responses to our AI-powered nudges",
            "• Communications with our support team",
            "",
            "We also automatically collect certain information:",
            "• Usage data and analytics",
            "• Device and browser information",
            "• IP address and location data",
            "• Cookies and similar tracking technologies"
          ]
        },
        dataUse: {
          title: "3. How We Use Your Information",
          content: [
            "We use your information to:",
            "• Provide and improve our services",
            "• Personalize your learning experience",
            "• Generate AI-powered insights and recommendations",
            "• Send you relevant notifications and updates",
            "• Analyze usage patterns to enhance our platform",
            "• Ensure security and prevent fraud",
            "• Comply with legal obligations"
          ]
        },
        cookies: {
          title: "4. Cookies and Tracking",
          content: [
            "We use different types of cookies:",
            "",
            "Essential Cookies: Required for the website to function properly",
            "• Authentication and security",
            "• Basic functionality and navigation",
            "",
            "Analytics Cookies: Help us understand how you use our platform",
            "• Google Analytics for usage statistics",
            "• Performance monitoring and optimization",
            "",
            "Marketing Cookies: Used for advertising and content personalization",
            "• Social media integration",
            "• Advertising campaign tracking",
            "",
            "Preference Cookies: Remember your settings and preferences",
            "• Theme and language preferences",
            "• Personalized user experience",
            "",
            "You can manage your cookie preferences through our cookie settings panel."
          ]
        },
        dataSharing: {
          title: "5. Information Sharing",
          content: [
            "We do not sell your personal information. We may share your information in the following circumstances:",
            "• With service providers who help us operate our platform",
            "• When required by law or to protect our rights",
            "• In connection with a business transaction (merger, acquisition)",
            "• With your explicit consent",
            "",
            "All service providers are bound by confidentiality agreements and data protection requirements."
          ]
        },
        dataRetention: {
          title: "6. Data Retention",
          content: [
            "We retain your personal information for as long as necessary to:",
            "• Provide our services to you",
            "• Comply with legal obligations",
            "• Resolve disputes and enforce agreements",
            "",
            "You can request deletion of your account and associated data at any time through your account settings or by contacting us."
          ]
        },
        rights: {
          title: "7. Your Rights (GDPR)",
          content: [
            "Under the General Data Protection Regulation (GDPR), you have the right to:",
            "• Access your personal data",
            "• Rectify inaccurate information",
            "• Erase your personal data",
            "• Restrict processing of your data",
            "• Data portability",
            "• Object to processing",
            "• Withdraw consent at any time",
            "",
            "To exercise these rights, please contact us using the information provided below."
          ]
        },
        security: {
          title: "8. Data Security",
          content: [
            "We implement appropriate technical and organizational measures to protect your personal information:",
            "• Encryption of data in transit and at rest",
            "• Regular security assessments",
            "• Access controls and authentication",
            "• Employee training on data protection",
            "",
            "While we strive to protect your information, no method of transmission over the internet is 100% secure."
          ]
        },
        international: {
          title: "9. International Transfers",
          content: [
            "Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place:",
            "• Adequacy decisions by the European Commission",
            "• Standard Contractual Clauses",
            "• Other legally recognized transfer mechanisms"
          ]
        },
        children: {
          title: "10. Children's Privacy",
          content: [
            "Our services are not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16.",
            "If you believe we have collected information from a child under 16, please contact us immediately."
          ]
        },
        changes: {
          title: "11. Changes to This Policy",
          content: [
            "We may update this privacy policy from time to time. We will notify you of any material changes by:",
            "• Posting the updated policy on our website",
            "• Sending you an email notification",
            "• Displaying a notice on our platform",
            "",
            "Your continued use of our services after changes become effective constitutes acceptance of the updated policy."
          ]
        },
        contact: {
          title: "12. Contact Information",
          content: [
            "If you have questions about this privacy policy or our data practices, please contact us:",
            "",
            "Email: privacy@agilelinks.com",
            "Address: [Your Company Address]",
            "",
            "Data Protection Officer: dpo@agilelinks.com",
            "",
            "For EU residents, you also have the right to lodge a complaint with your local data protection authority."
          ]
        }
      }
    },
    fr: {
      title: "Politique de Confidentialité",
      lastUpdated: "Dernière mise à jour : Décembre 2024",
      sections: {
        introduction: {
          title: "1. Introduction",
          content: [
            "Bienvenue sur AgileLinks. Nous respectons votre vie privée et nous nous engageons à protéger vos données personnelles. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations lorsque vous utilisez notre plateforme.",
            "AgileLinks est une plateforme de technologie éducative qui aide les utilisateurs à atteindre leurs objectifs personnels et professionnels grâce à des insights alimentés par l'IA et des expériences d'apprentissage personnalisées."
          ]
        },
        dataCollection: {
          title: "2. Informations que Nous Collectons",
          content: [
            "Nous collectons les informations que vous nous fournissez directement, telles que :",
            "• Informations de compte (nom, adresse e-mail)",
            "• Informations de profil et préférences",
            "• Données d'objectifs et de jalons que vous créez",
            "• Commentaires et réponses à nos notifications alimentées par l'IA",
            "• Communications avec notre équipe de support",
            "",
            "Nous collectons également automatiquement certaines informations :",
            "• Données d'utilisation et analytics",
            "• Informations sur l'appareil et le navigateur",
            "• Adresse IP et données de localisation",
            "• Cookies et technologies de suivi similaires"
          ]
        },
        dataUse: {
          title: "3. Comment Nous Utilisons Vos Informations",
          content: [
            "Nous utilisons vos informations pour :",
            "• Fournir et améliorer nos services",
            "• Personnaliser votre expérience d'apprentissage",
            "• Générer des insights et recommandations alimentés par l'IA",
            "• Vous envoyer des notifications et mises à jour pertinentes",
            "• Analyser les modèles d'utilisation pour améliorer notre plateforme",
            "• Assurer la sécurité et prévenir la fraude",
            "• Respecter les obligations légales"
          ]
        },
        cookies: {
          title: "4. Cookies et Suivi",
          content: [
            "Nous utilisons différents types de cookies :",
            "",
            "Cookies Essentiels : Nécessaires au bon fonctionnement du site web",
            "• Authentification et sécurité",
            "• Fonctionnalités de base et navigation",
            "",
            "Cookies Analytiques : Nous aident à comprendre comment vous utilisez notre plateforme",
            "• Google Analytics pour les statistiques d'utilisation",
            "• Surveillance des performances et optimisation",
            "",
            "Cookies Marketing : Utilisés pour la publicité et la personnalisation du contenu",
            "• Intégration des réseaux sociaux",
            "• Suivi des campagnes publicitaires",
            "",
            "Cookies de Préférences : Mémorisent vos paramètres et préférences",
            "• Préférences de thème et de langue",
            "• Expérience utilisateur personnalisée",
            "",
            "Vous pouvez gérer vos préférences de cookies via notre panneau de paramètres des cookies."
          ]
        },
        dataSharing: {
          title: "5. Partage d'Informations",
          content: [
            "Nous ne vendons pas vos informations personnelles. Nous pouvons partager vos informations dans les circonstances suivantes :",
            "• Avec les prestataires de services qui nous aident à exploiter notre plateforme",
            "• Lorsque requis par la loi ou pour protéger nos droits",
            "• En relation avec une transaction commerciale (fusion, acquisition)",
            "• Avec votre consentement explicite",
            "",
            "Tous les prestataires de services sont liés par des accords de confidentialité et des exigences de protection des données."
          ]
        },
        dataRetention: {
          title: "6. Conservation des Données",
          content: [
            "Nous conservons vos informations personnelles aussi longtemps que nécessaire pour :",
            "• Vous fournir nos services",
            "• Respecter les obligations légales",
            "• Résoudre les litiges et faire respecter les accords",
            "",
            "Vous pouvez demander la suppression de votre compte et des données associées à tout moment via les paramètres de votre compte ou en nous contactant."
          ]
        },
        rights: {
          title: "7. Vos Droits (RGPD)",
          content: [
            "Sous le Règlement Général sur la Protection des Données (RGPD), vous avez le droit de :",
            "• Accéder à vos données personnelles",
            "• Rectifier les informations inexactes",
            "• Effacer vos données personnelles",
            "• Restreindre le traitement de vos données",
            "• Portabilité des données",
            "• Vous opposer au traitement",
            "• Retirer votre consentement à tout moment",
            "",
            "Pour exercer ces droits, veuillez nous contacter en utilisant les informations fournies ci-dessous."
          ]
        },
        security: {
          title: "8. Sécurité des Données",
          content: [
            "Nous mettons en place des mesures techniques et organisationnelles appropriées pour protéger vos informations personnelles :",
            "• Chiffrement des données en transit et au repos",
            "• Évaluations de sécurité régulières",
            "• Contrôles d'accès et authentification",
            "• Formation des employés sur la protection des données",
            "",
            "Bien que nous nous efforcions de protéger vos informations, aucune méthode de transmission sur internet n'est sécurisée à 100%."
          ]
        },
        international: {
          title: "9. Transferts Internationaux",
          content: [
            "Vos informations peuvent être transférées et traitées dans des pays autres que le vôtre. Nous nous assurons que des garanties appropriées sont en place :",
            "• Décisions d'adéquation de la Commission européenne",
            "• Clauses Contractuelles Types",
            "• Autres mécanismes de transfert légalement reconnus"
          ]
        },
        children: {
          title: "10. Confidentialité des Enfants",
          content: [
            "Nos services ne sont pas destinés aux enfants de moins de 16 ans. Nous ne collectons pas sciemment d'informations personnelles d'enfants de moins de 16 ans.",
            "Si vous pensez que nous avons collecté des informations d'un enfant de moins de 16 ans, veuillez nous contacter immédiatement."
          ]
        },
        changes: {
          title: "11. Modifications de Cette Politique",
          content: [
            "Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Nous vous informerons de tout changement matériel par :",
            "• Publication de la politique mise à jour sur notre site web",
            "• Envoi d'une notification par e-mail",
            "• Affichage d'un avis sur notre plateforme",
            "",
            "Votre utilisation continue de nos services après que les changements deviennent effectifs constitue une acceptation de la politique mise à jour."
          ]
        },
        contact: {
          title: "12. Informations de Contact",
          content: [
            "Si vous avez des questions sur cette politique de confidentialité ou nos pratiques de données, veuillez nous contacter :",
            "",
            "E-mail : privacy@agilelinks.com",
            "Adresse : [Adresse de Votre Entreprise]",
            "",
            "Délégué à la Protection des Données : dpo@agilelinks.com",
            "",
            "Pour les résidents de l'UE, vous avez également le droit de déposer une plainte auprès de votre autorité locale de protection des données."
          ]
        }
      }
    }
  };

  const currentContent = content[language];

  return (
    <div className={`${styles.privacyContainer} container`}>
      <div className={styles.privacyHeader}>
        <div className={styles.titleSection}>
          <h1 className={styles.privacyTitle}>{currentContent.title}</h1>
          <p className={styles.lastUpdated}>{currentContent.lastUpdated}</p>
        </div>
        
        <button 
          className={styles.languageToggle}
          onClick={toggleLanguage}
          aria-label={language === 'en' ? 'Switch to French' : 'Passer en anglais'}
        >
          {language === 'en' ? '🇫🇷 Français' : '🇬🇧 English'}
        </button>
      </div>

      <div className={styles.privacyContent}>
        {Object.entries(currentContent.sections).map(([key, section]) => (
          <section key={key} className={styles.privacySection}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            <div className={styles.sectionContent}>
              {section.content.map((paragraph, index) => (
                <p key={index} className={styles.paragraph}>
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className={styles.privacyFooter}>
        <p className={styles.footerText}>
          {language === 'en' 
            ? 'This privacy policy is effective as of the date listed above and supersedes any previous versions.'
            : 'Cette politique de confidentialité est effective à partir de la date indiquée ci-dessus et remplace toutes les versions précédentes.'
          }
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;