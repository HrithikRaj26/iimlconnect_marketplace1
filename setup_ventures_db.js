const { Client } = require('pg');

const connectionString = 'postgres://postgres.yrnllcupnbwlzaxdcngz:Teamiimlconnect@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres';

const setupVenturesDB = async () => {
  const client = new Client({ connectionString });
  
  try {
    console.log("Connecting to Supabase PostgreSQL at aws-1-ap-northeast-2.pooler.supabase.com...");
    await client.connect();
    console.log("Connected successfully!");

    // First, let's try to find an existing user ID to link seed data to
    let testUserId = '00000000-0000-0000-0000-000000000000';
    try {
      const res = await client.query('SELECT id FROM auth.users LIMIT 1');
      if (res.rows.length > 0) {
        testUserId = res.rows[0].id;
        console.log(`Found active user ID for seeding: ${testUserId}`);
      } else {
        console.log("No users found in auth.users. Seeding with a fallback UUID.");
      }
    } catch (e) {
      console.warn("Could not query auth.users, using default UUID.", e.message);
    }

    const sql = `
      -- 1. Create the ventures table
      CREATE TABLE IF NOT EXISTS public.ventures (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        owner_id uuid NOT NULL,
        name text NOT NULL,
        tagline text NOT NULL,
        description text NOT NULL,
        category text NOT NULL,
        logo_url text,
        offerings text[] NOT NULL DEFAULT '{}',
        contact_links jsonb NOT NULL DEFAULT '{}'::jsonb,
        status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected')),
        is_featured boolean NOT NULL DEFAULT false,
        average_rating numeric(3,2) NOT NULL DEFAULT 0.00,
        reviews_count integer NOT NULL DEFAULT 0,
        owner_name text NOT NULL,
        owner_batch text NOT NULL,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- 2. Create the reviews table
      CREATE TABLE IF NOT EXISTS public.reviews (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        venture_id uuid REFERENCES public.ventures(id) ON DELETE CASCADE NOT NULL,
        reviewer_id uuid NOT NULL,
        rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
        content text,
        reviewer_name text NOT NULL,
        reviewer_batch text NOT NULL,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        CONSTRAINT unique_reviewer_venture UNIQUE (venture_id, reviewer_id)
      );

      -- 3. Create the posts table
      CREATE TABLE IF NOT EXISTS public.posts (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        venture_id uuid REFERENCES public.ventures(id) ON DELETE CASCADE NOT NULL,
        author_id uuid NOT NULL,
        type text NOT NULL CHECK (type IN ('event', 'promotion', 'update')),
        title text NOT NULL,
        content text NOT NULL,
        event_date timestamp with time zone,
        event_location text,
        likes integer NOT NULL DEFAULT 0,
        shares integer NOT NULL DEFAULT 0,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- 4. Create post_likes table
      CREATE TABLE IF NOT EXISTS public.post_likes (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
        user_id uuid NOT NULL,
        CONSTRAINT unique_user_post_like UNIQUE (post_id, user_id)
      );

      -- 5. Create user_badges table
      CREATE TABLE IF NOT EXISTS public.user_badges (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id uuid NOT NULL,
        badge_type text NOT NULL CHECK (badge_type IN ('top_reviewer', 'serial_entrepreneur', 'active_supporter')),
        reason text NOT NULL,
        granted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        CONSTRAINT unique_user_badge UNIQUE (user_id, badge_type)
      );

      -- 6. Enable RLS
      ALTER TABLE public.ventures ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

      -- 7. Policies for public.ventures
      DO $$ BEGIN
        CREATE POLICY "Ventures are viewable by everyone if approved or if owner/admin"
          ON public.ventures FOR SELECT
          USING ( status = 'approved' OR auth.uid() = owner_id OR auth.jwt() ->> 'email' IN ('pgp41298@iiml.ac.in', 'pgp41103@iiml.ac.in') );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE POLICY "Users can insert their own ventures"
          ON public.ventures FOR INSERT
          WITH CHECK ( auth.uid() = owner_id );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE POLICY "Owners or admin can update ventures"
          ON public.ventures FOR UPDATE
          USING ( auth.uid() = owner_id OR auth.jwt() ->> 'email' IN ('pgp41298@iiml.ac.in', 'pgp41103@iiml.ac.in') );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE POLICY "Owners or admin can delete ventures"
          ON public.ventures FOR DELETE
          USING ( auth.uid() = owner_id OR auth.jwt() ->> 'email' IN ('pgp41298@iiml.ac.in', 'pgp41103@iiml.ac.in') );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      -- 8. Policies for public.reviews
      DO $$ BEGIN
        CREATE POLICY "Reviews are viewable by everyone"
          ON public.reviews FOR SELECT
          USING ( true );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE POLICY "Users can insert reviews for other ventures"
          ON public.reviews FOR INSERT
          WITH CHECK ( auth.uid() = reviewer_id );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE POLICY "Reviewers can update their own reviews"
          ON public.reviews FOR UPDATE
          USING ( auth.uid() = reviewer_id );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE POLICY "Reviewers or admin can delete reviews"
          ON public.reviews FOR DELETE
          USING ( auth.uid() = reviewer_id OR auth.jwt() ->> 'email' IN ('pgp41298@iiml.ac.in', 'pgp41103@iiml.ac.in') );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      -- 9. Policies for public.posts
      DO $$ BEGIN
        CREATE POLICY "Posts are viewable by everyone"
          ON public.posts FOR SELECT
          USING ( true );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE POLICY "Venture authors can insert posts"
          ON public.posts FOR INSERT
          WITH CHECK ( auth.uid() = author_id );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE POLICY "Authors or admin can update posts"
          ON public.posts FOR UPDATE
          USING ( auth.uid() = author_id OR auth.jwt() ->> 'email' IN ('pgp41298@iiml.ac.in', 'pgp41103@iiml.ac.in') );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE POLICY "Authors or admin can delete posts"
          ON public.posts FOR DELETE
          USING ( auth.uid() = author_id OR auth.jwt() ->> 'email' IN ('pgp41298@iiml.ac.in', 'pgp41103@iiml.ac.in') );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      -- 10. Policies for public.post_likes
      DO $$ BEGIN
        CREATE POLICY "Likes are viewable by everyone"
          ON public.post_likes FOR SELECT
          USING ( true );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE POLICY "Users can toggle like for themselves"
          ON public.post_likes FOR INSERT
          WITH CHECK ( auth.uid() = user_id );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE POLICY "Users can remove their own likes"
          ON public.post_likes FOR DELETE
          USING ( auth.uid() = user_id );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      -- 11. Policies for public.user_badges
      DO $$ BEGIN
        CREATE POLICY "Badges are viewable by everyone"
          ON public.user_badges FOR SELECT
          USING ( true );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE POLICY "System/user can grant badges"
          ON public.user_badges FOR INSERT
          WITH CHECK ( auth.uid() = user_id );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `;

    console.log("Executing schema SQL...");
    await client.query(sql);
    console.log("Database schema successfully created.");

    // 12. Seed initial mockup ventures if not already existing
    const seedCheck = await client.query("SELECT COUNT(*) FROM public.ventures");
    if (parseInt(seedCheck.rows[0].count) === 0 && testUserId !== '00000000-0000-0000-0000-000000000000') {
      console.log("Seeding initial ventures, reviews, and posts...");

      // Insert 3 mock ventures: Tech, F&B, Services
      const venturesSeedSql = `
        INSERT INTO public.ventures (owner_id, name, tagline, description, category, logo_url, offerings, contact_links, status, is_featured, owner_name, owner_batch)
        VALUES 
        (
          '${testUserId}',
          'L-Byte Solutions',
          'Tailored technical development and consulting for student startups.',
          'L-Byte Solutions provides professional website building, database setup, and mobile app design services for IIM Lucknow student projects. Run by senior PGP developers with backgrounds in software engineering.',
          'Tech',
          'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=150&h=150&fit=crop',
          ARRAY['Custom React/NextJS Websites', 'Supabase Database Integration', 'MVP Technical Consultation', 'Landing Pages Design'],
          '{"website": "https://lbyte.solutions", "instagram": "lbyte_consulting", "whatsapp": "+919876543210"}'::jsonb,
          'approved',
          true,
          'Shinjan Patra',
          'PGP 2024-26'
        ),
        (
          '${testUserId}',
          'Chai & Bytes',
          'Late-night tea, coffee, and quick bites delivered straight to your hostel door.',
          'Craving warm tea or coffee at 2:00 AM during exam weeks? Chai & Bytes has you covered! We serve fresh hand-beaten coffee, ginger chai, and hot Maggi with campus delivery between 11 PM and 4 AM.',
          'F&B',
          'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=150&h=150&fit=crop',
          ARRAY['Ginger/Cardamom Masala Chai', 'Premium Hand-beaten Coffee', 'Egg/Cheese Hot Maggi', 'Butter Toast & Omelette'],
          '{"whatsapp": "+918888888888", "instagram": "chai_bytes_iiml"}'::jsonb,
          'approved',
          true,
          'Ayush Barya',
          'PGP 2025-27'
        ),
        (
          '${testUserId}',
          'ResuPrep Consulting',
          'Professional resume review and mock summer internship interviews.',
          'Get coached by students who secured top investment banking and management consulting internships. We offer thorough resume critiques, CV formatting according to IIM Lucknow standards, and case/fit mock interviews.',
          'Services',
          'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=150&h=150&fit=crop',
          ARRAY['1-on-1 CV Critique Session', 'Consulting Case Interview Mock', 'Finance Fit/Technical Mock', 'Resume Formatting Template'],
          '{"website": "https://resuprep.in", "whatsapp": "+917777777777"}'::jsonb,
          'approved',
          false,
          'Sayan Maithi',
          'PGP 2024-26'
        );
      `;
      await client.query(venturesSeedSql);
      console.log("Seeding ventures complete.");

      // Fetch the created ventures' IDs to reference in reviews and posts
      const venturesRes = await client.query("SELECT id, name FROM public.ventures");
      const ventureMap = {};
      venturesRes.rows.forEach(r => {
        ventureMap[r.name] = r.id;
      });

      // Seeding reviews
      const reviewsSeedSql = `
        INSERT INTO public.reviews (venture_id, reviewer_id, rating, content, reviewer_name, reviewer_batch)
        VALUES 
        ('${ventureMap['L-Byte Solutions']}', '${testUserId}', 5, 'Highly recommend! Shinjan and team built our startup MVP in just a week. RLS and Supabase queries run perfectly.', 'N Ashwin Kumar', 'PGP 2025-27'),
        ('${ventureMap['Chai & Bytes']}', '${testUserId}', 4, 'Life saver during end-terms. The hot ginger tea is amazing and delivery is quick even at 3 AM.', 'Jyotsna', 'PGP 2025-27'),
        ('${ventureMap['ResuPrep Consulting']}', '${testUserId}', 5, 'The mock interview was incredibly detailed. Got great feedback that helped me restructure my intro.', 'Ankita', 'PGP 2024-26');
      `;
      await client.query(reviewsSeedSql);

      // Update the rating counts and average ratings in ventures table
      await client.query(`
        UPDATE public.ventures v
        SET 
          average_rating = COALESCE((SELECT AVG(rating) FROM public.reviews r WHERE r.venture_id = v.id), 0.00),
          reviews_count = (SELECT COUNT(*) FROM public.reviews r WHERE r.venture_id = v.id)
      `);
      console.log("Seeding reviews complete & aggregations updated.");

      // Seeding feed posts
      const postsSeedSql = `
        INSERT INTO public.posts (venture_id, author_id, type, title, content, event_date, event_location)
        VALUES
        (
          '${ventureMap['Chai & Bytes']}', 
          '${testUserId}', 
          'promotion', 
          'Mid-Term Exam Special Combo Offer!', 
          'Get a piping hot Ginger Chai + Cheese Maggi for just ₹60! Offer valid from 11:00 PM to 3:00 AM throughout the mid-term week. Mention code EXAMBITE when ordering.',
          NULL,
          NULL
        ),
        (
          '${ventureMap['ResuPrep Consulting']}', 
          '${testUserId}', 
          'event', 
          'Crack the Case: Live Consulting Workshop', 
          'Join us for a live walk-through of a profitability case and a pricing case. Learn how to construct logical MECE frameworks quickly. Refreshments will be served.',
          timezone('utc'::text, now() + interval '2 days' + interval '18 hours'),
          'Samanvaya Hall, Academic Block'
        ),
        (
          '${ventureMap['L-Byte Solutions']}', 
          '${testUserId}', 
          'update', 
          'Portfolio Updates: 3 Campus MVPs Launched', 
          'We are proud to have helped three new student-led platforms go live this term! Head over to our website to see their projects and read the technical case studies.',
          NULL,
          NULL
        );
      `;
      await client.query(postsSeedSql);
      console.log("Seeding feed posts complete.");
    } else {
      console.log("Ventures table already seeded or no users present to assign ownership.");
    }

  } catch (err) {
    console.error("Error executing database queries:", err);
  } finally {
    await client.end();
  }
};

setupVenturesDB();
