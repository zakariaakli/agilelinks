import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import "../globals.css";
import "../Styles/dark-mode.css";
import Seo from "../Components/Seo";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import ThemeProvider from "../Components/ThemeProvider";

// app/layout.tsx
export const metadata = {
  title: 'Know yourself. Grow every day!',
  description: 'Know yourself. Grow every day! AI Companion',
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
    title: 'Know yourself. Grow every day! ',
    description: '',
    image: '',
    url: ''
  };

  return (
    <html lang="en">
      <Seo {...seoProps} />
      <head>
        <title>Know yourself. Grow every day!</title>
      </head>
      <body>
        <ThemeProvider>
          <Header />
          <main>
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
