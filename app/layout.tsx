import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import "../globals.css";
import Seo from "../Components/Seo";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import CookieConsent from "../Components/CookieConsent";

// app/layout.tsx
export const metadata = {
  title: 'Stepiva - AI Companion for Personal Growth',
  description: 'Know yourself. Grow every day! AI-powered goal planning with personality insights.',
  icons: {
    icon: '/stepiva-favicon.svg',
    apple: '/stepiva-favicon.svg',
  },
  manifest: '/manifest.json',
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
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
