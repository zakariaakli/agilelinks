// src/components/Seo.tsx
import React from 'react';

import Head from 'next/head';

interface SeoProps {
  title: string;
  description: string;
  image: string;
  url: string;
}

const Seo: React.FC<SeoProps> = ({ title, description, image, url }) => {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="Enneagram, leadership, coaching, personal growth, self-discovery" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
  );
};

export default Seo;
