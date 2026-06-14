import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import hospitalLogo from "@/assets/hospital-logo.png";
import { LanguageProvider, useLanguage } from "@/hooks/useLanguage";
import { useAudioAnnouncement } from "@/hooks/useAudioAnnouncement";
import DoctorQueuePanel from "@/components/DoctorQueuePanel";
import AnnouncementsPanel from "@/components/AnnouncementsPanel";
import LanguageSelector from "@/components/LanguageSelector";
import AudioToggle from "@/components/AudioToggle";
import { Clock, MapPin, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  counter_number: number;
  room_number: string;
  status: string;
  avg_consultation_minutes: number;
}

interface Patient {
  id: string;
  token_number: number;
  patient_name: string;
  status: string;
  reason_for_visit: string | null;
  priority: string;
  doctor_id: string;
  doctors: {
    name: string;
    counter_number: number;
    room_number: string;
    status: string;
    avg_consultation_minutes: number;
  };
}

const DisplayContent = () => {
  const { t, language } = useLanguage();
  const { announceToken, isEnabled, toggleAudio, isSpeaking } = useAudioAnnouncement();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [currentPatients, setCurrentPatients] = useState<Patient[]>([]);
  const [waitingPatients, setWaitingPatients] = useState<Patient[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastCalledToken, setLastCalledToken] = useState<number | null>(null);

  useEffect(() => {
    fetchDoctors();
    fetchPatients();
    
    const channel = supabase
      .channel('queue-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
        fetchPatients();
        // Auto announce when patient status changes to consulting
        if (payload.eventType === 'UPDATE' && payload.new.status === 'consulting' && payload.old.status === 'waiting') {
          const patient = payload.new as Patient;
          if (patient.token_number !== lastCalledToken) {
            setLastCalledToken(patient.token_number);
            // Fetch doctor info for announcement
            supabase.from('doctors').select('counter_number, name, room_number').eq('id', patient.doctor_id).single()
              .then(({ data }) => {
                if (data) {
                  announceToken(
                    patient.token_number,
                    data.counter_number,
                    patient.patient_name,
                    data.name,
                    data.room_number
                  );
                }
              });
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, () => fetchDoctors())
      .subscribe();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [lastCalledToken]);

  const fetchDoctors = async () => {
    const { data } = await supabase
      .from('doctors')
      .select('*')
      .eq('is_active', true)
      .order('counter_number');
    if (data) setDoctors(data);
  };

  const fetchPatients = async () => {
    const { data: consulting } = await supabase
      .from('patients')
      .select(`*, doctors (name, counter_number, room_number, status, avg_consultation_minutes)`)
      .eq('status', 'consulting')
      .order('token_number', { ascending: true });

    const { data: waiting } = await supabase
      .from('patients')
      .select(`*, doctors (name, counter_number, room_number, status, avg_consultation_minutes)`)
      .eq('status', 'waiting')
      .order('priority', { ascending: true })
      .order('token_number', { ascending: true });

    setCurrentPatients(consulting || []);
    setWaitingPatients(waiting || []);
  };

  const patientsByDoctor = useMemo(() => {
    const grouped: Record<string, Patient[]> = {};
    waitingPatients.forEach(patient => {
      if (!grouped[patient.doctor_id]) grouped[patient.doctor_id] = [];
      grouped[patient.doctor_id].push(patient);
    });
    return grouped;
  }, [waitingPatients]);

  const calculateWaitTime = (position: number, avgTime: number) => {
    return position * avgTime;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'emergency': return <Badge className="bg-destructive text-destructive-foreground">🚨 Emergency</Badge>;
      case 'senior': return <Badge className="bg-warning text-warning-foreground">👴 Senior</Badge>;
      case 'postop': return <Badge className="bg-primary text-primary-foreground">🏥 Post-Op</Badge>;
      default: return null;
    }
  };

  const getDoctorStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success';
      case 'delayed': return 'bg-warning';
      case 'unavailable': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const nextPatients = waitingPatients.slice(0, 4);

  return (
    <div className="min-h-screen bg-display-bg p-6">
      <header className="bg-display-card rounded-2xl shadow-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={hospitalLogo} alt="Hospital Logo" className="h-16 w-auto" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mahatme Eye Hospital</h1>
              <p className="text-lg text-muted-foreground">OPD Queue Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <AudioToggle isEnabled={isEnabled} onToggle={toggleAudio} isSpeaking={isSpeaking} />
            <LanguageSelector />
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">
                {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-lg text-muted-foreground">
                {currentTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Current Patients */}
        <div className="col-span-2">
          <div className="bg-display-current text-primary-foreground rounded-xl p-3 mb-4">
            <h2 className="text-2xl font-bold text-center">{t('currentPatients').toUpperCase()}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {currentPatients.length === 0 ? (
              <Card className="col-span-2 p-8 text-center">
                <p className="text-xl text-muted-foreground">No patients currently consulting</p>
              </Card>
            ) : (
              currentPatients.map((patient) => (
                <Card key={patient.id} className="p-6 bg-display-card border-4 border-display-current relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-3 h-3 rounded-full m-3 ${getDoctorStatusColor(patient.doctors.status)}`} />
                  {patient.priority !== 'normal' && (
                    <div className="absolute top-2 left-2">
                      {getPriorityBadge(patient.priority)}
                    </div>
                  )}
                  <div className="mt-6">
                    <div className="text-5xl font-bold text-display-current mb-2">
                      {t('token')} {patient.token_number}
                    </div>
                    <div className="text-2xl font-semibold text-foreground mb-1">
                      {patient.patient_name}
                    </div>
                    {patient.reason_for_visit && (
                      <div className="text-sm text-muted-foreground italic mb-3">
                        {patient.reason_for_visit}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-lg">
                      <span className="flex items-center gap-1 text-accent font-bold">
                        <MapPin className="h-5 w-5" />
                        {patient.doctors.room_number}
                      </span>
                      <span className="text-muted-foreground">
                        {t('counter')} {patient.doctors.counter_number}
                      </span>
                    </div>
                    <div className="text-muted-foreground mt-1">
                      {patient.doctors.name}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Announcements Panel */}
        <div>
          <AnnouncementsPanel />
        </div>
      </div>

      {/* Next in Queue */}
      <div className="mb-6">
        <div className="bg-display-next text-success-foreground rounded-xl p-3 mb-4">
          <h2 className="text-2xl font-bold text-center">{t('nextInQueue').toUpperCase()}</h2>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {nextPatients.length === 0 ? (
            <Card className="col-span-4 p-6 text-center">
              <p className="text-lg text-muted-foreground">{t('noPatients')}</p>
            </Card>
          ) : (
            nextPatients.map((patient, index) => (
              <Card key={patient.id} className="p-4 bg-display-card border-2 border-display-next relative">
                {patient.priority !== 'normal' && (
                  <div className="absolute top-2 right-2">
                    {getPriorityBadge(patient.priority)}
                  </div>
                )}
                <div className="text-3xl font-bold text-display-next mb-1">
                  {t('token')} {patient.token_number}
                </div>
                <div className="text-lg font-medium text-foreground mb-1">
                  {patient.patient_name}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" />
                  {patient.doctors.room_number} | {t('counter')} {patient.doctors.counter_number}
                </div>
                <div className="flex items-center gap-1 text-sm text-warning">
                  <Clock className="h-4 w-4" />
                  {t('estimatedWait')}: ~{calculateWaitTime(index + 1, patient.doctors.avg_consultation_minutes)} {t('minutes')}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Doctor-wise Queue */}
      <div className="mb-6">
        <DoctorQueuePanel doctors={doctors} patientsByDoctor={patientsByDoctor} />
      </div>

      {/* Emergency Priority Marquee */}
      <div className="bg-destructive text-destructive-foreground py-3 overflow-hidden relative rounded-xl mb-4">
        <div className="animate-marquee whitespace-nowrap inline-block">
          <span className="text-xl font-bold mx-8">
            🚨 EMERGENCY CASES GET PRIORITY • {t('pleaseListenToken')} • आपातकालीन मामलों को प्राथमिकता दी जाती है • आणीबाणीच्या प्रकरणांना प्राधान्य दिले जाते 🚨
          </span>
          <span className="text-xl font-bold mx-8">
            🚨 EMERGENCY CASES GET PRIORITY • {t('pleaseListenToken')} • आपातकालीन मामलों को प्राथमिकता दी जाती है • आणीबाणीच्या प्रकरणांना प्राधान्य दिले जाते 🚨
          </span>
        </div>
      </div>
    </div>
  );
};

const Display = () => {
  return (
    <LanguageProvider>
      <DisplayContent />
    </LanguageProvider>
  );
};

export default Display;
