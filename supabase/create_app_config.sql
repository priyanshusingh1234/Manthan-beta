-- Create the app_config table
CREATE TABLE public.app_config (
    id TEXT PRIMARY KEY,
    min_android_version INTEGER NOT NULL DEFAULT 118,
    force_update BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert the default configuration
INSERT INTO public.app_config (id, min_android_version, force_update)
VALUES ('default', 118, false);

-- Enable Row Level Security (RLS)
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the config
CREATE POLICY "Allow public read access on app_config"
    ON public.app_config FOR SELECT
    USING (true);

-- Allow authenticated users with an 'admin' role (if you have one) to update it, 
-- or you can just manage it directly from the Supabase Dashboard UI.
