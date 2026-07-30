const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yrnllcupnbwlzaxdcngz.supabase.co';
const supabaseKey = 'sb_publishable_iJuPcPvdUBWS50oxjcLKdA_5SATF6tq';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Checking listings table...");
  const { data, error } = await supabase.from('listings').select('*').limit(1);
  if (error) {
    console.error("Table check failed:", error.message);
  } else {
    console.log("Table check passed! Listings found:", data.length);
  }

  console.log("Checking storage bucket...");
  const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('marketplace-images');
  if (bucketError) {
    console.error("Bucket check failed:", bucketError.message);
  } else {
    console.log("Bucket check passed! Bucket name:", bucketData.name);
  }
}

test();
