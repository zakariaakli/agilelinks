import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import "../globals.css";
import Seo from "../Components/Seo";
import Header from "../Components/Header";
import MobileBottomNav from "../Components/MobileBottomNav";
import CookieConsent from "../Components/CookieConsent";
import ClientProviders from "../Components/ClientProviders";
import FeedbackButton from "../Components/FeedbackButton";

// app/layout.tsx
export const metadata = {
  title: 'Stepiva - AI Companion for Personal Growth',
  description: 'Know yourself. Grow every day! AI-powered goal planning with personality insights.',
  icons: {
    icon: '/stepiva-favicon.svg',
    apple: '/stepiva-favicon.svg',
  },
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const seoProps = {
    title: 'Stepiva - AI Companion for Personal Growth',
    description: 'Know yourself. Grow every day! AI-powered goal planning with personality insights.',
    image: '/stepiva-logo-blue.svg',
    url: 'https://stepiva.com'
  };

  return (
    <html lang="en">
      <Seo {...seoProps} />
      <head>
        <title>Stepiva - AI Companion for Personal Growth</title>
        <link rel="icon" href="/stepiva-favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <Header />
        <main>
          {children}
        </main>
        <MobileBottomNav />
        <CookieConsent />
        <FeedbackButton />
        <ClientProviders />
      </body>
    </html>
  );
}
