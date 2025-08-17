-- Migration: Initial Consolidated Schema
-- Description: Sets up the complete database schema with 'flashcards' and 'generations' tables.

-- Step 1: Drop tables if they exist to ensure a clean slate, cascading dependencies
DROP TABLE IF EXISTS public.flashcards CASCADE;
DROP TABLE IF EXISTS public.generations CASCADE;

-- Step 2: Drop existing types to avoid conflicts
DROP TYPE IF EXISTS public.flashcard_status;
DROP TYPE IF EXISTS public.flashcard_source;

-- Step 3: Create custom ENUM types with corrected values
CREATE TYPE public.flashcard_status AS ENUM ('pending', 'approved');
CREATE TYPE public.flashcard_source AS ENUM ('ai', 'manual');

-- Step 4: Create the 'generations' table
CREATE TABLE public.generations (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    model VARCHAR(100),
    generated_count INT NOT NULL,
    accepted_unedited_count INT NOT NULL DEFAULT 0,
    accepted_edited_count INT NOT NULL DEFAULT 0,
    source_text_hash VARCHAR(64),
    source_text_length INT NOT NULL,
    generation_duration INT, -- in milliseconds
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 5: Create the 'flashcards' table with corrected default status
CREATE TABLE public.flashcards (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    generation_id BIGINT REFERENCES public.generations(id) ON DELETE SET NULL,
    front VARCHAR(200) NOT NULL,
    back VARCHAR(400) NOT NULL,
    status public.flashcard_status NOT NULL DEFAULT 'pending',
    source public.flashcard_source NOT NULL,
    is_edited BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 6: Create indexes for performance
CREATE INDEX ON public.generations (user_id);
CREATE INDEX ON public.flashcards (user_id);
CREATE INDEX ON public.flashcards (generation_id);
CREATE INDEX ON public.flashcards (status);
CREATE INDEX ON public.flashcards (source);

-- Step 7: Enable Row-Level Security (RLS) on the tables
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Step 8: Create granular RLS policies for 'generations'
CREATE POLICY "Users can manage their own generations"
    ON public.generations
    FOR ALL
    USING ( auth.uid() = user_id );

-- Step 9: Create granular RLS policies for 'flashcards'
CREATE POLICY "Users can view their own flashcards"
    ON public.flashcards
    FOR SELECT
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own flashcards"
    ON public.flashcards
    FOR INSERT
    WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update their own flashcards"
    ON public.flashcards
    FOR UPDATE
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own flashcards"
    ON public.flashcards
    FOR DELETE
    USING ( auth.uid() = user_id );


-- Step 10: Create the trigger function to update 'updated_at'
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create the triggers on the tables
CREATE TRIGGER update_generations_updated_at
BEFORE UPDATE ON public.generations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at
BEFORE UPDATE ON public.flashcards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
