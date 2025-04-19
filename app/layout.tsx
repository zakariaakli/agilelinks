import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./globals.css";

import Seo from "./Components/Seo";
import Header from "./Components/Header";

// app/layout.tsx
export const metadata = {
  title: 'Enneagram Type for Free!',
  description: 'Enneagram personality test for free',
  icons: {
    icon: '/favicon.ico',
    apple: '/logo192.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const seoProps = {
    title: 'Free Enneagram Test!',
    description: '',
    image: '',
    url: ''
  };

  return (
    <html lang="en">
      <Seo {...seoProps} />
      <head>
        <title>Free Enneagram Test!</title>
      </head>
      <body>
        <Header />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
