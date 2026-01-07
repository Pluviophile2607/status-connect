-- Allow business owners to delete their own campaigns
CREATE POLICY "Business owners can delete own campaigns"
ON public.campaigns
FOR DELETE
USING (business_id IN (
  SELECT id FROM businesses WHERE owner_id = auth.uid()
));

-- Allow business owners to delete campaign analytics for their campaigns
CREATE POLICY "Business owners can delete analytics for own campaigns"
ON public.campaign_analytics
FOR DELETE
USING (campaign_id IN (
  SELECT c.id FROM campaigns c
  JOIN businesses b ON c.business_id = b.id
  WHERE b.owner_id = auth.uid()
));

-- Allow business owners to insert agent earnings when approving campaigns
CREATE POLICY "Business owners can create agent earnings for their campaigns"
ON public.agent_earnings
FOR INSERT
WITH CHECK (campaign_id IN (
  SELECT c.id FROM campaigns c
  JOIN businesses b ON c.business_id = b.id
  WHERE b.owner_id = auth.uid()
));