// scripts/generate-sitemap.mjs
import { db } from '../firebase-admin.js'; // or .ts depending on config
import fs from 'fs';
import { SitemapStream, streamToPromise } from 'sitemap';

async function generateSitemap() {
  const smStream = new SitemapStream({ hostname: 'https://agilelinks.vercel.app/' }); // Replace

  // 🔥 Get articles from Firestore
  const snapshot = await db.collection('Articles').get();

  snapshot.forEach((doc) => {
    const slug = doc.data().slug;
    smStream.write({ url: `/articles/${slug}`, changefreq: 'weekly', priority: 0.8 });
  });

  smStream.end();
  const sitemap = await streamToPromise(smStream);
  fs.writeFileSync('./public/sitemap.xml', sitemap.toString());
}

generateSitemap().then(() => {
  console.log('✅ Sitemap generated!');
}).catch((err) => {
  console.error('❌ Error generating sitemap:', err);
});
