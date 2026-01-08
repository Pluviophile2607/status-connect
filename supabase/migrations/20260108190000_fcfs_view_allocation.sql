-- Add target_views and pending_views columns to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN target_views INTEGER NOT NULL DEFAULT 0,
ADD COLUMN pending_views INTEGER NOT NULL DEFAULT 0;

-- Create agent_campaign_claims table for partial view commitments
CREATE TABLE public.agent_campaign_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  views_committed INTEGER NOT NULL,
  views_delivered INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (campaign_id, agent_id)
);

-- Enable RLS on agent_campaign_claims
ALTER TABLE public.agent_campaign_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_campaign_claims
CREATE POLICY "Agents can view own claims" ON public.agent_campaign_claims
  FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY "Agents can create claims" ON public.agent_campaign_claims
  FOR INSERT WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agents can update own claims" ON public.agent_campaign_claims
  FOR UPDATE USING (auth.uid() = agent_id);

CREATE POLICY "Business owners can view claims for their campaigns" ON public.agent_campaign_claims
  FOR SELECT USING (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      JOIN public.businesses b ON c.business_id = b.id
      WHERE b.owner_id = auth.uid()
    )
  );

-- Function to atomically claim views (FCFS concurrency-safe)
CREATE OR REPLACE FUNCTION public.claim_campaign_views(
  p_campaign_id UUID,
  p_agent_id UUID,
  p_views_to_commit INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available_views INTEGER;
  v_campaign_budget DECIMAL(10,2);
  v_target_views INTEGER;
  v_claim_id UUID;
  v_agent_earnings DECIMAL(10,2);
BEGIN
  -- Lock the campaign row to prevent race conditions
  SELECT pending_views, price, target_views 
  INTO v_available_views, v_campaign_budget, v_target_views
  FROM public.campaigns
  WHERE id = p_campaign_id
  FOR UPDATE;

  -- Check if campaign exists and is open
  IF v_available_views IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Campaign not found');
  END IF;

  -- Check if enough views are available
  IF v_available_views < p_views_to_commit THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough views available. Only ' || v_available_views || ' views remaining.');
  END IF;

  -- Check if views to commit is positive
  IF p_views_to_commit <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Views must be greater than 0');
  END IF;

  -- Calculate agent earnings
  v_agent_earnings := (p_views_to_commit::DECIMAL / v_target_views::DECIMAL) * v_campaign_budget;

  -- Update pending views
  UPDATE public.campaigns
  SET pending_views = pending_views - p_views_to_commit,
      agent_id = COALESCE(agent_id, p_agent_id), -- Set first agent as primary
      status = CASE WHEN pending_views - p_views_to_commit = 0 THEN 'assigned' ELSE status END
  WHERE id = p_campaign_id;

  -- Create claim record
  INSERT INTO public.agent_campaign_claims (campaign_id, agent_id, views_committed)
  VALUES (p_campaign_id, p_agent_id, p_views_to_commit)
  ON CONFLICT (campaign_id, agent_id) 
  DO UPDATE SET views_committed = agent_campaign_claims.views_committed + p_views_to_commit
  RETURNING id INTO v_claim_id;

  RETURN jsonb_build_object(
    'success', true, 
    'claim_id', v_claim_id,
    'views_committed', p_views_to_commit,
    'earnings', v_agent_earnings,
    'remaining_views', v_available_views - p_views_to_commit
  );
END;
$$;
