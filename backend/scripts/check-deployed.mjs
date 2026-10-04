async function main() {
  try {
    const res = await fetch('https://campusone-ai.vercel.app/');
    const text = await res.text();
    console.log('HTML from live site:\n', text);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

main();
