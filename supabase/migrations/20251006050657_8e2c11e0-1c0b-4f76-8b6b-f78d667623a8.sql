-- Create table for chalet availability/blocked dates
CREATE TABLE public.chalet_blocked_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chalet_id UUID NOT NULL REFERENCES public.chalets(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Enable RLS
ALTER TABLE public.chalet_blocked_dates ENABLE ROW LEVEL SECURITY;

-- Chalet owners can view blocked dates for their chalets
CREATE POLICY "Chalet owners can view their blocked dates"
ON public.chalet_blocked_dates
FOR SELECT
USING (
  chalet_id IN (
    SELECT id FROM public.chalets
    WHERE owner_id = auth.uid()
  )
);

-- Chalet owners can insert blocked dates for their chalets
CREATE POLICY "Chalet owners can insert their blocked dates"
ON public.chalet_blocked_dates
FOR INSERT
WITH CHECK (
  chalet_id IN (
    SELECT id FROM public.chalets
    WHERE owner_id = auth.uid()
  )
);

-- Chalet owners can update blocked dates for their chalets
CREATE POLICY "Chalet owners can update their blocked dates"
ON public.chalet_blocked_dates
FOR UPDATE
USING (
  chalet_id IN (
    SELECT id FROM public.chalets
    WHERE owner_id = auth.uid()
  )
);

-- Chalet owners can delete blocked dates for their chalets
CREATE POLICY "Chalet owners can delete their blocked dates"
ON public.chalet_blocked_dates
FOR DELETE
USING (
  chalet_id IN (
    SELECT id FROM public.chalets
    WHERE owner_id = auth.uid()
  )
);

-- Admins can manage all blocked dates
CREATE POLICY "Admins can manage all blocked dates"
ON public.chalet_blocked_dates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public can view blocked dates to check availability
CREATE POLICY "Public can view blocked dates"
ON public.chalet_blocked_dates
FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_chalet_blocked_dates_updated_at
BEFORE UPDATE ON public.chalet_blocked_dates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_chalet_blocked_dates_chalet_id ON public.chalet_blocked_dates(chalet_id);
CREATE INDEX idx_chalet_blocked_dates_dates ON public.chalet_blocked_dates(start_date, end_date);