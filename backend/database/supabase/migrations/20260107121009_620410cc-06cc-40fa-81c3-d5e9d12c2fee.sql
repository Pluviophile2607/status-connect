-- Drop existing campaign_status type and recreate with new values
ALTER TABLE public.campaigns ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.campaigns ALTER COLUMN status TYPE text;
DROP TYPE IF EXISTS public.campaign_status;

CREATE TYPE public.campaign_status AS ENUM (
  'draft',        -- Business is creating
  'open',         -- Published, available for agents
  'assigned',     -- Agent claimed it
  'pending_review', -- Agent submitted for business review
  'approved',     -- Business approved
  'live',         -- Campaign is running
  'completed',    -- Done
  'rejected'      -- Business rejected
);

ALTER TABLE public.campaigns ALTER COLUMN status TYPE campaign_status USING status::campaign_status;
ALTER TABLE public.campaigns ALTER COLUMN status SET DEFAULT 'draft';

-- Make agent_id nullable (campaigns start without an agent)
ALTER TABLE public.campaigns ALTER COLUMN agent_id DROP NOT NULL;

-- Update RLS policies for new flow

-- Drop old agent policies
DROP POLICY IF EXISTS "Agents can create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Agents can update own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Agents can view own campaigns" ON public.campaigns;

-- Business owners can create campaigns
CREATE POLICY "Business owners can create campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

-- Business owners can view their own campaigns
DROP POLICY IF EXISTS "Business owners can view assigned campaigns" ON public.campaigns;
CREATE POLICY "Business owners can view own campaigns" ON public.campaigns
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

-- Agents can view open campaigns (available to claim)
CREATE POLICY "Agents can view open campaigns" ON public.campaigns
  FOR SELECT USING (
    status = 'open' OR agent_id = auth.uid()
  );

-- Agents can claim/update campaigns assigned to them
CREATE POLICY "Agents can update claimed campaigns" ON public.campaigns
  FOR UPDATE USING (
    agent_id = auth.uid() OR (status = 'open' AND agent_id IS NULL)
  );

-- Allow campaign_analytics insert for campaign owners
DROP POLICY IF EXISTS "Agents can view analytics for own campaigns" ON public.campaign_analytics;

CREATE POLICY "Users can insert analytics for their campaigns" ON public.campaign_analytics
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT id FROM public.campaigns 
      WHERE business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can view analytics for relevant campaigns" ON public.campaign_analytics
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM public.campaigns 
      WHERE business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
      OR agent_id = auth.uid()
    )
  );