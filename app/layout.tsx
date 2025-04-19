import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./globals.css";

import Seo from "./Components/Seo";
import Header from "./Components/Header";

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
