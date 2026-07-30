const { Client } = require('pg');

const connectionString = 'postgres://postgres:Teamiimlconnect@db.yrnllcupnbwlzaxdcngz.supabase.co:5432/postgres';

const setupDB = async () => {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL.");

    const sql = `
      -- 1. Create the listings table
      CREATE TABLE IF NOT EXISTS public.listings (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        title text NOT NULL,
        description text,
        price numeric NOT NULL,
        category text NOT NULL,
        condition text NOT NULL,
        pickup text NOT NULL,
        image_url text,
        location text NOT NULL,
        seller_name text NOT NULL,
        seller_batch text NOT NULL,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- 2. Enable RLS
      ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

      -- 3. Policy: Anyone can read listings
      DO $$ BEGIN
        CREATE POLICY "Listings are viewable by everyone."
          ON public.listings FOR SELECT
          USING ( true );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      -- 4. Policy: Users can insert their own listings
      DO $$ BEGIN
        CREATE POLICY "Users can insert their own listings."
          ON public.listings FOR INSERT
          WITH CHECK ( auth.uid() = seller_id );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      -- 5. Policy: Users can update their own listings
      DO $$ BEGIN
        CREATE POLICY "Users can update their own listings."
          ON public.listings FOR UPDATE
          USING ( auth.uid() = seller_id );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      -- 6. Policy: Users can delete their own listings
      DO $$ BEGIN
        CREATE POLICY "Users can delete their own listings."
          ON public.listings FOR DELETE
          USING ( auth.uid() = seller_id );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      -- 7. Create Storage Bucket
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('marketplace-images', 'marketplace-images', true)
      ON CONFLICT (id) DO NOTHING;

      -- 8. Storage Policies
      DO $$ BEGIN
        CREATE POLICY "Avatar images are publicly accessible."
          ON storage.objects FOR SELECT
          USING ( bucket_id = 'marketplace-images' );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE POLICY "Anyone can upload an avatar."
          ON storage.objects FOR INSERT
          WITH CHECK ( bucket_id = 'marketplace-images' );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `;

    console.log("Executing SQL...");
    await client.query(sql);
    console.log("Success! Database schema and storage buckets created.");

  } catch (err) {
    console.error("Error setting up database:", err);
  } finally {
    await client.end();
  }
};

setupDB();
