import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, Clock, MapPin } from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  counter_number: number;
  room_number: string;
  status: string;
  avg_consultation_minutes: number;
}

interface DoctorStatusPanelProps {
  doctors: Doctor[];
  patientCounts: Record<string, number>;
  onRefresh: () => void;
}

const DoctorStatusPanel = ({ doctors, patientCounts, onRefresh }: DoctorStatusPanelProps) => {
  const { toast } = useToast();

  const updateDoctorStatus = async (doctorId: string, status: string) => {
    const { error } = await supabase
      .from('doctors')
      .update({ status })
      .eq('id', doctorId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status Updated" });
      onRefresh();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'delayed': return 'bg-warning text-warning-foreground';
      case 'unavailable': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success';
      case 'delayed': return 'bg-warning';
      case 'unavailable': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {doctors.map((doctor) => (
        <Card key={doctor.id} className="p-5 relative overflow-hidden">
          {/* Status indicator dot */}
          <div className={`absolute top-0 right-0 w-3 h-3 rounded-bl-lg ${getStatusDot(doctor.status)}`} />
          
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg">{doctor.name}</h3>
              <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
            </div>
            <Badge className={getStatusColor(doctor.status)}>
              {doctor.status.charAt(0).toUpperCase() + doctor.status.slice(1)}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {doctor.room_number}
            </span>
            <span>Counter {doctor.counter_number}</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm mb-4">
            <span className="flex items-center gap-1 text-primary font-medium">
              <Users className="h-4 w-4" />
              {patientCounts[doctor.id] || 0} waiting
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              ~{doctor.avg_consultation_minutes} min/patient
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant={doctor.status === 'active' ? 'default' : 'outline'}
              className={doctor.status === 'active' ? 'bg-success hover:bg-success/90' : ''}
              onClick={() => updateDoctorStatus(doctor.id, 'active')}
            >
              Active
            </Button>
            <Button 
              size="sm" 
              variant={doctor.status === 'delayed' ? 'default' : 'outline'}
              className={doctor.status === 'delayed' ? 'bg-warning hover:bg-warning/90' : ''}
              onClick={() => updateDoctorStatus(doctor.id, 'delayed')}
            >
              Delayed
            </Button>
            <Button 
              size="sm" 
              variant={doctor.status === 'unavailable' ? 'destructive' : 'outline'}
              onClick={() => updateDoctorStatus(doctor.id, 'unavailable')}
            >
              Unavailable
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default DoctorStatusPanel;