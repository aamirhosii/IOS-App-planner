-- Check if the profiles table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        -- Create profiles table if it doesn't exist
        CREATE TABLE profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            username TEXT UNIQUE,
            full_name TEXT,
            avatar_url TEXT,
            bio TEXT,
            website TEXT,
            location TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create RLS policies
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

        -- Create policy to allow users to view any profile
        CREATE POLICY "Profiles are viewable by everyone" 
        ON profiles FOR SELECT 
        USING (true);

        -- Create policy to allow users to update their own profile
        CREATE POLICY "Users can update their own profile" 
        ON profiles FOR UPDATE 
        USING (auth.uid() = id);

        -- Create policy to allow authenticated users to insert their own profile
        CREATE POLICY "Users can insert their own profile" 
        ON profiles FOR INSERT 
        WITH CHECK (auth.uid() = id);

        -- Create trigger to create profile on user creation
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
            INSERT INTO public.profiles (id, username, full_name, avatar_url)
            VALUES (
                NEW.id,
                LOWER(SPLIT_PART(NEW.email, '@', 1)), -- Default username from email
                NEW.raw_user_meta_data->>'name', -- Name from metadata if available
                NEW.raw_user_meta_data->>'avatar_url' -- Avatar from metadata if available
            );
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Create trigger on auth.users
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

        -- Create function to update username if it's available
        CREATE OR REPLACE FUNCTION public.check_username_availability(username TEXT)
        RETURNS BOOLEAN AS $$
        BEGIN
            RETURN NOT EXISTS (
                SELECT 1 FROM profiles WHERE profiles.username = username
            );
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Create storage bucket for profile images if it doesn't exist
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    ELSE
        -- Add any missing columns to the profiles table if it already exists
        BEGIN
            IF NOT EXISTS (SELECT FROM information_schema.columns 
                          WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'bio') THEN
                ALTER TABLE profiles ADD COLUMN bio TEXT;
            END IF;

            IF NOT EXISTS (SELECT FROM information_schema.columns 
                          WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'website') THEN
                ALTER TABLE profiles ADD COLUMN website TEXT;
            END IF;

            IF NOT EXISTS (SELECT FROM information_schema.columns 
                          WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'location') THEN
                ALTER TABLE profiles ADD COLUMN location TEXT;
            END IF;

            IF NOT EXISTS (SELECT FROM information_schema.columns 
                          WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at') THEN
                ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            END IF;
        END;
    END IF;
END
$$;

-- Create storage bucket for profile images if it doesn't exist
DO $$
BEGIN
    -- This is a placeholder since we can't directly create storage buckets via SQL
    -- You'll need to create the 'profiles' bucket in the Supabase dashboard
    -- with public read access and authenticated write access
    RAISE NOTICE 'Remember to create a "profiles" storage bucket in the Supabase dashboard';
END
$$;
