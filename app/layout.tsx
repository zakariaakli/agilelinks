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
  title: 'Stepiva - The Coaching Memory Layer',
  description: 'Stepiva keeps coaching insights alive between sessions. Personality-aware AI companion (Enneagram, MBTI) that reactivates insights through structured reflection and nudges applied to real goals.',
  keywords: ['coaching companion', 'AI coaching', 'coaching memory', 'Enneagram', 'MBTI', 'personal growth', 'coaching insights', 'executive coaching', 'leadership development', 'Stepiva'],
  authors: [{ name: 'Stepiva' }],
  creator: 'Stepiva',
  metadataBase: new URL('https://stepiva.ai'),
  alternates: {
    canonical: 'https://stepiva.ai',
  },
  openGraph: {
    title: 'Stepiva - The Coaching Memory Layer',
    description: 'AI companion that keeps coaching insights alive. Works after coaching, not instead of it. Personality-aware from day one.',
    url: 'https://stepiva.ai',
    siteName: 'Stepiva',
    images: [{ url: '/stepiva-logo-blue.svg', width: 1200, height: 630, alt: 'Stepiva - The Coaching Memory Layer' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stepiva - The Coaching Memory Layer',
    description: 'AI companion that keeps coaching insights alive. Works after coaching, not instead of it.',
    images: ['/stepiva-logo-blue.svg'],
  },
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
    title: 'Stepiva - The Coaching Memory Layer',
    description: 'AI companion that keeps coaching insights alive. Works after coaching, not instead of it. Personality-aware from day one.',
    image: '/stepiva-logo-blue.svg',
    url: 'https://stepiva.ai'
  };

  return (
    <html lang="en">
      <Seo {...seoProps} />
      <head>
        <title>Stepiva - The Coaching Memory Layer</title>
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
