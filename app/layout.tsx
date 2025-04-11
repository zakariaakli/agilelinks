import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';  // Import Bootstrap CSS
import "./globals.css";

import Seo from "./Components/Seo";

import Header from "./Components/Header";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const seoProps = {
    title: 'My Website',
    description: '', 
    image: '', 
    url: ''
  };
  return (
    <html lang="en">
      <Seo {...seoProps} />
      <head>
        <title>My Website</title>
      </head>
      <body >
        <Header/>
        {children}
      </body>
    </html>
  );
}
