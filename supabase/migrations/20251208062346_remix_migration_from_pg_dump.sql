CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'staff'
);


--
-- Name: patient_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.patient_status AS ENUM (
    'waiting',
    'consulting',
    'completed',
    'missed'
);


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: update_patients_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_patients_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_en text NOT NULL,
    message_hi text,
    message_mr text,
    type text DEFAULT 'info'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone
);


--
-- Name: doctors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doctors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    specialty text DEFAULT 'General'::text NOT NULL,
    counter_number integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    room_number text DEFAULT 'OPD-1'::text,
    status text DEFAULT 'active'::text,
    avg_consultation_minutes integer DEFAULT 10
);


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_number integer NOT NULL,
    patient_name text NOT NULL,
    doctor_id uuid,
    status public.patient_status DEFAULT 'waiting'::public.patient_status,
    registration_time timestamp with time zone DEFAULT now(),
    consultation_time timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    age integer,
    gender text,
    phone_number text,
    address text,
    reason_for_visit text,
    priority text DEFAULT 'normal'::text,
    arrived_at timestamp with time zone,
    billing_done boolean DEFAULT false,
    waiting_for_tests boolean DEFAULT false,
    email text,
    notes text,
    registered_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    cancel_reason text,
    CONSTRAINT patients_gender_check CHECK ((gender = ANY (ARRAY['Male'::text, 'Female'::text, 'Other'::text])))
);


--
-- Name: queue_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.queue_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hospital_name text DEFAULT 'Mahatme Eye Hospital'::text,
    display_mode text DEFAULT 'all'::text,
    auto_progress boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL
);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: queue_settings queue_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queue_settings
    ADD CONSTRAINT queue_settings_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_patients_doctor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_doctor_id ON public.patients USING btree (doctor_id);


--
-- Name: idx_patients_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_status ON public.patients USING btree (status);


--
-- Name: patients update_patients_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_patients_updated_at();


--
-- Name: patients patients_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;


--
-- Name: patients patients_registered_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_registered_by_fkey FOREIGN KEY (registered_by) REFERENCES auth.users(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: queue_settings Admin can update settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update settings" ON public.queue_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: announcements Anyone can view announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (true);


--
-- Name: doctors Anyone can view doctors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view doctors" ON public.doctors FOR SELECT USING (true);


--
-- Name: patients Anyone can view patients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view patients" ON public.patients FOR SELECT USING (true);


--
-- Name: queue_settings Anyone can view settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view settings" ON public.queue_settings FOR SELECT USING (true);


--
-- Name: announcements Staff can delete announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can delete announcements" ON public.announcements FOR DELETE USING ((public.has_role(auth.uid(), 'staff'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: patients Staff can delete patients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can delete patients" ON public.patients FOR DELETE TO authenticated USING ((public.has_role(auth.uid(), 'staff'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: announcements Staff can insert announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can insert announcements" ON public.announcements FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'staff'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: doctors Staff can insert doctors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can insert doctors" ON public.doctors FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'staff'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: patients Staff can insert patients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can insert patients" ON public.patients FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'staff'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: announcements Staff can update announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can update announcements" ON public.announcements FOR UPDATE USING ((public.has_role(auth.uid(), 'staff'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: doctors Staff can update doctors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can update doctors" ON public.doctors FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'staff'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: patients Staff can update patients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can update patients" ON public.patients FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'staff'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: announcements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

--
-- Name: doctors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

--
-- Name: patients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

--
-- Name: queue_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.queue_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


