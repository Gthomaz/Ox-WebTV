const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.production', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, ...value] = line.split('=');
    env[key.trim()] = value.join('=').trim();
  }
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function fix() {
  console.log("Fixing images...");
  const { data } = await supabase.from('filmes').select('id');
  for (let i = 0; i < data.length; i++) {
    // Picsum seed based on ID ensures the same image for the same ID, and it never 404s
    const newCover = `https://picsum.photos/seed/filme${data[i].id}/400/600`;
    await supabase.from('filmes').update({ cover_url: newCover }).eq('id', data[i].id);
  }
  console.log('Fixed covers!');
}

fix();
