async function main() {
  try {
    const res = await fetch('https://campusone-ai.vercel.app/assets/index-Cbw8ZhiL.js');
    const text = await res.text();
    const urls = text.match(/https:\/\/[a-zA-Z0-9.-]+\.vercel\.app/g);
    console.log('Deployed bundle Vercel URLs:', [...new Set(urls || [])]);

    const apiUrls = [
      'https://campusone-ai.vercel.app/api/health',
      'https://campusone-ai-backend.vercel.app/api/health',
      'https://campusone-backend.vercel.app/api/health',
      'https://bramhaji345-campusone-ai.vercel.app/api/health',
    ];

    for (const u of apiUrls) {
      try {
        const r = await fetch(u, { signal: AbortSignal.timeout(4000) });
        console.log(`Endpoint ${u}: ${r.status}`);
      } catch (err) {
        console.log(`Endpoint ${u}: error (${err.message})`);
      }
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

main();
