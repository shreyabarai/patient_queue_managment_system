
-- Drop restrictive policies on doctors
DROP POLICY IF EXISTS "Staff can insert doctors" ON public.doctors;
DROP POLICY IF EXISTS "Staff can update doctors" ON public.doctors;

-- Add permissive policies for demo mode
CREATE POLICY "Anyone can insert doctors" ON public.doctors FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update doctors" ON public.doctors FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete doctors" ON public.doctors FOR DELETE USING (true);

-- Drop restrictive policies on patients
DROP POLICY IF EXISTS "Staff can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Staff can update patients" ON public.patients;
DROP POLICY IF EXISTS "Staff can delete patients" ON public.patients;

-- Add permissive policies for demo mode
CREATE POLICY "Anyone can insert patients" ON public.patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update patients" ON public.patients FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete patients" ON public.patients FOR DELETE USING (true);

-- Drop restrictive policies on announcements
DROP POLICY IF EXISTS "Staff can insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Staff can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Staff can delete announcements" ON public.announcements;

-- Add permissive policies for demo mode
CREATE POLICY "Anyone can insert announcements" ON public.announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update announcements" ON public.announcements FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete announcements" ON public.announcements FOR DELETE USING (true);
