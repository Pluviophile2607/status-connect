-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('agent', 'business_owner');

-- Create enum for campaign status
CREATE TYPE public.campaign_status AS ENUM ('draft', 'pending', 'approved', 'sent', 'live', 'completed');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'paid');

-- Create enum for payment mode
CREATE TYPE public.payment_mode AS ENUM ('upi', 'bank_transfer', 'cash');

-- Create enum for media type
CREATE TYPE public.media_type AS ENUM ('image', 'video');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_roles table for secure role checking
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  category TEXT,
  whatsapp_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  media_url TEXT,
  media_type media_type DEFAULT 'image',
  caption TEXT,
  cta_text TEXT,
  status campaign_status DEFAULT 'draft' NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_status payment_status DEFAULT 'unpaid' NOT NULL,
  payment_mode payment_mode,
  marked_by UUID REFERENCES auth.users(id),
  marked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create agent_earnings table
CREATE TABLE public.agent_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  commission_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create campaign_analytics table
CREATE TABLE public.campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL UNIQUE,
  views INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'agent')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'agent')
  );
  
  -- If business owner, create a default business
  IF (NEW.raw_user_meta_data ->> 'role')::app_role = 'business_owner' THEN
    INSERT INTO public.businesses (owner_id, business_name, whatsapp_number)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'My Business'),
      COALESCE(NEW.raw_user_meta_data ->> 'whatsapp_number', '')
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for businesses
CREATE POLICY "Business owners can view own business" ON public.businesses
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Business owners can update own business" ON public.businesses
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Agents can view all businesses" ON public.businesses
  FOR SELECT USING (public.has_role(auth.uid(), 'agent'));

-- RLS Policies for campaigns
CREATE POLICY "Agents can view own campaigns" ON public.campaigns
  FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY "Agents can create campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agents can update own campaigns" ON public.campaigns
  FOR UPDATE USING (auth.uid() = agent_id);

CREATE POLICY "Business owners can view assigned campaigns" ON public.campaigns
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Business owners can update campaign status" ON public.campaigns
  FOR UPDATE USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

-- RLS Policies for payments
CREATE POLICY "Agents can view payments for own campaigns" ON public.payments
  FOR SELECT USING (
    campaign_id IN (SELECT id FROM public.campaigns WHERE agent_id = auth.uid())
  );

CREATE POLICY "Business owners can view own payments" ON public.payments
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Business owners can update own payments" ON public.payments
  FOR UPDATE USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "System can insert payments" ON public.payments
  FOR INSERT WITH CHECK (true);

-- RLS Policies for agent_earnings
CREATE POLICY "Agents can view own earnings" ON public.agent_earnings
  FOR SELECT USING (auth.uid() = agent_id);

-- RLS Policies for campaign_analytics
CREATE POLICY "Agents can view analytics for own campaigns" ON public.campaign_analytics
  FOR SELECT USING (
    campaign_id IN (SELECT id FROM public.campaigns WHERE agent_id = auth.uid())
  );

CREATE POLICY "Business owners can view analytics for assigned campaigns" ON public.campaign_analytics
  FOR SELECT USING (
    campaign_id IN (SELECT id FROM public.campaigns WHERE business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  );