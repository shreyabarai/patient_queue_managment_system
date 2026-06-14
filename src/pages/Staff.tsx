import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  ArrowLeft,
  BarChart3,
  Tv,
  LogOut,
  Users,
  UserPlus,
  Stethoscope,
  Megaphone,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import hospitalLogo from "@/assets/hospital-logo.png";
import { getAuthorizedStaffUser, signOutStaff } from "@/lib/staffAuth";

import PatientRegistrationForm from "@/components/staff/PatientRegistrationForm";
import PatientQueueTable from "@/components/staff/PatientQueueTable";
import DoctorManagement from "@/components/staff/DoctorManagement";
import AnnouncementManager from "@/components/staff/AnnouncementManager";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  counter_number: number;
  room_number: string;
  status: string;
  avg_consultation_minutes: number;
  is_active: boolean;
}

interface Patient {
  id: string;
  token_number: number;
  patient_name: string;
  email: string | null;
  phone_number: string | null;
  status: string;
  priority: string;
  reason_for_visit: string | null;
  registration_time: string;
  billing_done: boolean;
  waiting_for_tests: boolean;
  notes: string | null;
  cancel_reason: string | null;
  doctor_id: string;
  doctors: {
    name: string;
    counter_number: number;
    room_number: string;
  };
}

const Staff = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [nextToken, setNextToken] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    let patientsChannel: ReturnType<typeof supabase.channel> | null = null;
    let doctorsChannel: ReturnType<typeof supabase.channel> | null = null;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const initializeStaffDashboard = async () => {
      const access = await getAuthorizedStaffUser();

      if (!access.user || !access.staff) {
        navigate("/auth", { replace: true });
        return;
      }

      setUser(access.user);

      fetchDoctors();
      fetchAllDoctors();
      fetchPatients();
      fetchNextToken();

      patientsChannel = supabase
        .channel("staff-patients")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "patients" },
          () => {
            fetchPatients();
            fetchNextToken();
          }
        )
        .subscribe();

      doctorsChannel = supabase
        .channel("staff-doctors")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "doctors" },
          () => {
            fetchDoctors();
            fetchAllDoctors();
          }
        )
        .subscribe();
    };

    void initializeStaffDashboard();

    return () => {
      if (patientsChannel) {
        supabase.removeChannel(patientsChannel);
      }
      if (doctorsChannel) {
        supabase.removeChannel(doctorsChannel);
      }
      clearInterval(timer);
    };
  }, [navigate]);

  const fetchDoctors = async () => {
    const { data } = await supabase
      .from('doctors')
      .select('*')
      .eq('is_active', true)
      .order('counter_number');
    if (data) setDoctors(data);
  };

  const fetchAllDoctors = async () => {
    const { data } = await supabase
      .from('doctors')
      .select('*')
      .order('counter_number');
    if (data) setAllDoctors(data);
  };

  const fetchPatients = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data } = await supabase
      .from('patients')
      .select(`*, doctors (name, counter_number, room_number)`)
      .gte('registration_time', today.toISOString())
      .is('cancel_reason', null)
      .order('priority', { ascending: true })
      .order('token_number');
    if (data) setPatients(data as Patient[]);
  };

  const fetchNextToken = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data } = await supabase
      .from('patients')
      .select('token_number')
      .gte('registration_time', today.toISOString())
      .order('token_number', { ascending: false })
      .limit(1);
    setNextToken(data && data.length > 0 ? data[0].token_number + 1 : 1);
  };

  const handleLogout = async () => {
    await signOutStaff();
    navigate("/auth", { replace: true });
  };

  // Calculate patient counts per doctor
  const patientCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    patients
      .filter(p => p.status === 'waiting')
      .forEach(p => {
        counts[p.doctor_id] = (counts[p.doctor_id] || 0) + 1;
      });
    return counts;
  }, [patients]);

  // Queue stats
  const queueStats = useMemo(() => ({
    waiting: patients.filter(p => p.status === 'waiting').length,
    consulting: patients.filter(p => p.status === 'consulting').length,
    completed: patients.filter(p => p.status === 'completed').length,
    missed: patients.filter(p => p.status === 'missed').length,
  }), [patients]);

  return (
    <div className="min-h-screen bg-background">
      {/* Quick Stats Bar */}
      <div className="bg-card border-b px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="secondary" className="gap-1">
              <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              {queueStats.waiting} waiting
            </Badge>
            <Badge variant="outline" className="gap-1">
              <span className="w-2 h-2 rounded-full bg-success" />
              {queueStats.consulting} consulting
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                {currentTime.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                {currentTime.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        <Tabs defaultValue="queue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            <TabsTrigger value="queue" className="flex items-center gap-2 py-3">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Queue</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {queueStats.waiting + queueStats.consulting}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-2 py-3">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Register</span>
            </TabsTrigger>
            <TabsTrigger value="doctors" className="flex items-center gap-2 py-3">
              <Stethoscope className="h-4 w-4" />
              <span className="hidden sm:inline">Doctors</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2 py-3">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Announce</span>
            </TabsTrigger>
          </TabsList>

          {/* Queue Management Tab */}
          <TabsContent value="queue" className="mt-6">
            <PatientQueueTable 
              patients={patients}
              doctors={doctors}
              onRefresh={fetchPatients}
            />
          </TabsContent>

          {/* Register Patient Tab */}
          <TabsContent value="register" className="mt-6">
            <div className="max-w-2xl mx-auto">
              <PatientRegistrationForm 
                doctors={doctors}
                nextToken={nextToken}
                userId={user?.id}
                onSuccess={() => {
                  fetchPatients();
                  fetchNextToken();
                }}
              />
            </div>
          </TabsContent>

          {/* Doctor Management Tab */}
          <TabsContent value="doctors" className="mt-6">
            <DoctorManagement 
              doctors={allDoctors}
              patientCounts={patientCounts}
              onRefresh={() => {
                fetchDoctors();
                fetchAllDoctors();
              }}
            />
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="mt-6">
            <div className="max-w-3xl mx-auto">
              <AnnouncementManager />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Staff;
