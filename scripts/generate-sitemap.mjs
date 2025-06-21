// scripts/generate-sitemap.mjs
import { db } from '../firebase-admin.js'; // or .ts depending on config
import fs from 'fs';
import { SitemapStream, streamToPromise } from 'sitemap';

async function generateSitemap() {
  const smStream = new SitemapStream({ hostname: 'https://agilelinks.vercel.app/' }); // Replace

  // Add static pages
  smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });
  smStream.write({ url: '/about', changefreq: 'monthly', priority: 0.8 });
  smStream.write({ url: '/product', changefreq: 'weekly', priority: 0.8 });
  smStream.write({ url: '/articles', changefreq: 'weekly', priority: 0.9 });
  smStream.write({ url: '/login', changefreq: 'monthly', priority: 0.5 });
  smStream.write({ url: '/signup', changefreq: 'monthly', priority: 0.5 });
  smStream.write({ url: '/privacy-policy', changefreq: 'monthly', priority: 0.3 });

  // 🔥 Get articles from Firestore if available
  if (db) {
    try {
      const snapshot = await db.collection('Articles').get();
      snapshot.forEach((doc) => {
        const slug = doc.data().slug;
        smStream.write({ url: `/articles/${slug}`, changefreq: 'weekly', priority: 0.8 });
      });
      console.log(`✅ Added ${snapshot.size} articles to sitemap from Firestore`);
    } catch (error) {
      console.warn('⚠️ Could not fetch articles from Firestore, using static sitemap only:', error.message);
    }
  } else {
    console.warn('⚠️ Firebase not initialized, generating sitemap with static pages only');
    
    // Add hardcoded article URLs as fallback
    const staticArticles = [
      'transforming-agile-it-teams-enneagram-solved-conflicts-motivation',
      'unlocking-team-potential-enneagram-agile-workplaces', 
      'leveraging-enneagram-personality-type-enhances-agile-teams'
    ];
    
    staticArticles.forEach(slug => {
      smStream.write({ url: `/articles/${slug}`, changefreq: 'weekly', priority: 0.8 });
    });
    
    console.log(`✅ Added ${staticArticles.length} static articles to sitemap`);
  }

  smStream.end();
  const sitemap = await streamToPromise(smStream);
  fs.writeFileSync('./public/sitemap.xml', sitemap.toString());
}

generateSitemap().then(() => {
  console.log('✅ Sitemap generated!');
}).catch((err) => {
  console.error('❌ Error generating sitemap:', err);
});
