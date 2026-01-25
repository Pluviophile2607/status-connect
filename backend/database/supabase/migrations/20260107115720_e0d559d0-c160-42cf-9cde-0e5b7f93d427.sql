-- Fix overly permissive RLS policy on payments table
DROP POLICY IF EXISTS "System can insert payments" ON public.payments;

-- Create proper insert policy for payments - only allow when campaign is assigned to business
CREATE POLICY "Allow payment insert for assigned campaigns" ON public.payments
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c 
      WHERE c.business_id = business_id
    )
  );