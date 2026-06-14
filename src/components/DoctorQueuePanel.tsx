import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import { Clock, Users, MapPin } from "lucide-react";

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
  priority: string;
}

interface DoctorQueuePanelProps {
  doctors: Doctor[];
  patientsByDoctor: Record<string, Patient[]>;
}

const DoctorQueuePanel = ({ doctors, patientsByDoctor }: DoctorQueuePanelProps) => {
  const { t } = useLanguage();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'delayed': return 'bg-warning text-warning-foreground';
      case 'unavailable': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success animate-pulse';
      case 'delayed': return 'bg-warning';
      case 'unavailable': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const calculateWaitTime = (doctor: Doctor, position: number) => {
    return doctor.avg_consultation_minutes * position;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'emergency': return <Badge className="bg-destructive text-destructive-foreground text-xs">🚨</Badge>;
      case 'senior': return <Badge className="bg-warning text-warning-foreground text-xs">👴</Badge>;
      case 'postop': return <Badge className="bg-primary text-primary-foreground text-xs">🏥</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <Users className="h-6 w-6" />
        {t('doctorWise')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctors.map((doctor) => {
          const patients = patientsByDoctor[doctor.id] || [];
          const waitingCount = patients.length;
          
          return (
            <Card key={doctor.id} className="p-4 relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${getStatusDot(doctor.status)}`} />
              
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg text-foreground">{doctor.name}</h3>
                  <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                </div>
                <Badge className={getStatusColor(doctor.status)}>
                  {t(doctor.status)}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {doctor.room_number} | {t('counter')} {doctor.counter_number}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-semibold text-primary">{waitingCount}</span>
                <span className="text-sm text-muted-foreground">{t('patientsWaiting')}</span>
              </div>
              
              {patients.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  {patients.slice(0, 3).map((patient, index) => (
                    <div key={patient.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">#{patient.token_number}</span>
                        <span className="text-foreground truncate max-w-24">{patient.patient_name}</span>
                        {getPriorityBadge(patient.priority)}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>~{calculateWaitTime(doctor, index + 1)} {t('minutes')}</span>
                      </div>
                    </div>
                  ))}
                  {patients.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{patients.length - 3} more
                    </p>
                  )}
                </div>
              )}
              
              {patients.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  {t('noPatients')}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DoctorQueuePanel;
