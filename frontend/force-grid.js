const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { error } = await supabase.from('broadcast_control').update({ is_live: false }).eq('id', 1);
  if (error) console.error(error);
  else console.log('Successfully forced is_live to false!');
}

run();
