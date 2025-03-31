import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';  // Import Bootstrap CSS
import "./globals.css";

import Header from './Components/Header';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">

      <body>
      <header>
        <Header />
      </header>
        {children}
      </body>
    </html>
  );
}
