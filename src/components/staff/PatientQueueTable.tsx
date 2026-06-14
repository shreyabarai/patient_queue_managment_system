import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAudioAnnouncement } from "@/hooks/useAudioAnnouncement";
import { 
  Search, Volume2, Play, CheckCircle, X, Edit, Filter,
  Clock, Phone, Mail, AlertTriangle, RefreshCw, ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Doctor {
  id: string;
  name: string;
  counter_number: number;
  room_number: string;
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

interface PatientQueueTableProps {
  patients: Patient[];
  doctors: Doctor[];
  onRefresh: () => void;
}

const PatientQueueTable = ({ patients, doctors, onRefresh }: PatientQueueTableProps) => {
  const { toast } = useToast();
  const { announceToken } = useAudioAnnouncement();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDoctor, setFilterDoctor] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [editDoctor, setEditDoctor] = useState("");

  const promoteNextPatient = async (doctorId: string) => {
    // Find the next waiting token for this doctor, ordered by priority then token number
    const { data: nextPatients, error } = await supabase
      .from("patients")
      .select("id, token_number")
      .eq("doctor_id", doctorId)
      .eq("status", "waiting")
      .order("priority", { ascending: true })
      .order("token_number", { ascending: true })
      .limit(1);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const next = nextPatients && nextPatients[0];
    if (!next) return;

    const { error: updateError } = await supabase
      .from("patients")
      .update({
        status: "consulting",
        consultation_time: new Date().toISOString(),
        arrived_at: new Date().toISOString(),
      })
      .eq("id", next.id);

    if (updateError) {
      toast({
        title: "Error",
        description: updateError.message,
        variant: "destructive",
      });
    }
  };

  // Filter patients
  const filteredPatients = patients.filter(p => {
    const matchesSearch = 
      p.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.token_number.toString().includes(searchQuery);
    const matchesDoctor = filterDoctor === "all" || p.doctor_id === filterDoctor;
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    const matchesPriority = filterPriority === "all" || p.priority === filterPriority;
    
    return matchesSearch && matchesDoctor && matchesStatus && matchesPriority;
  });

  const handleCall = async (patient: Patient) => {
    if (patient.status === 'waiting') {
      const { error } = await supabase
        .from('patients')
        .update({ 
          status: 'consulting', 
          consultation_time: new Date().toISOString(),
          arrived_at: new Date().toISOString()
        })
        .eq('id', patient.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    }

    announceToken(
      patient.token_number,
      patient.doctors.counter_number,
      patient.patient_name,
      patient.doctors.name,
      patient.doctors.room_number
    );
    toast({ title: "Patient Called", description: `Token ${patient.token_number} called to Counter ${patient.doctors.counter_number}` });
    onRefresh();
  };

  const handleComplete = async (patient: Patient, promptBilling = false) => {
    if (promptBilling && !patient.billing_done) {
      setSelectedPatient(patient);
      setShowBillingDialog(true);
      return;
    }
    
    const { error } = await supabase
      .from('patients')
      .update({ status: 'completed' })
      .eq('id', patient.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Completed", description: `Token ${patient.token_number} marked as completed` });
      await promoteNextPatient(patient.doctor_id);
      onRefresh();
    }
  };

  const handleCompleteWithBilling = async (markBilling: boolean) => {
    if (!selectedPatient) return;
    
    const { error } = await supabase
      .from('patients')
      .update({ 
        status: 'completed',
        billing_done: markBilling
      })
      .eq('id', selectedPatient.id);

    if (error || !selectedPatient) {
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Completed", description: `Token ${selectedPatient.token_number} marked as completed` });
      await promoteNextPatient(selectedPatient.doctor_id);
      setShowBillingDialog(false);
      setSelectedPatient(null);
      onRefresh();
    }
  };

  const handleNoShow = async (patient: Patient) => {
    const { error } = await supabase
      .from('patients')
      .update({ status: 'missed' })
      .eq('id', patient.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "No Show", description: `Token ${patient.token_number} marked as missed` });
      await promoteNextPatient(patient.doctor_id);
      onRefresh();
    }
  };

  const handleCancel = async () => {
    if (!selectedPatient || !cancelReason.trim()) {
      toast({ title: "Error", description: "Please provide a reason for cancellation", variant: "destructive" });
      return;
    }

    const patientToCancel = selectedPatient;

    const { error } = await supabase
      .from('patients')
      .update({
        status: 'missed',
        cancel_reason: cancelReason.trim(),
      })
      .eq('id', patientToCancel.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Cancelled", description: `Token ${patientToCancel.token_number} has been removed from the live queue` });

    if (patientToCancel.status === 'consulting') {
      await promoteNextPatient(patientToCancel.doctor_id);
    }

    setShowCancelDialog(false);
    setCancelReason("");
    setSelectedPatient(null);
    onRefresh();
  };

  const handleReassign = async () => {
    if (!selectedPatient || !editDoctor) return;
    
    const { error } = await supabase
      .from('patients')
      .update({ doctor_id: editDoctor })
      .eq('id', selectedPatient.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reassigned", description: `Token ${selectedPatient.token_number} reassigned to new doctor` });
      setShowEditDialog(false);
      setEditDoctor("");
      setSelectedPatient(null);
      onRefresh();
    }
  };

  const handleMarkTests = async (patient: Patient, waiting: boolean) => {
    const { error } = await supabase
      .from('patients')
      .update({ waiting_for_tests: waiting })
      .eq('id', patient.id);

    if (!error) {
      toast({ title: waiting ? "Marked for Tests" : "Tests Completed" });
      onRefresh();
    }
  };

  const handleMarkBilling = async (patient: Patient) => {
    const { error } = await supabase
      .from('patients')
      .update({ billing_done: true })
      .eq('id', patient.id);

    if (!error) {
      toast({ title: "Billing Done" });
      onRefresh();
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'emergency': return <Badge className="bg-destructive text-destructive-foreground">🚨 Emergency</Badge>;
      case 'senior': return <Badge className="bg-warning text-warning-foreground">👴 Senior</Badge>;
      case 'postop': return <Badge className="bg-primary text-primary-foreground">🏥 Post-Op</Badge>;
      default: return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting': return <Badge variant="secondary">⏳ Waiting</Badge>;
      case 'consulting': return <Badge className="bg-success text-success-foreground">🩺 Consulting</Badge>;
      case 'completed': return <Badge variant="outline">✓ Completed</Badge>;
      case 'missed': return <Badge className="bg-destructive/20 text-destructive">✗ Missed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getPurposeLabel = (purpose: string | null) => {
    const purposes: Record<string, string> = {
      'consultation': '👁️ Consultation',
      'follow-up': '🔄 Follow-up',
      'post-op': '🏥 Post-op',
      'test-scan': '🔬 Test/Scan',
      'medicine-refill': '💊 Medicine',
      'emergency': '🚨 Emergency',
      'other': '📋 Other',
    };
    return purposes[purpose || ''] || purpose || 'N/A';
  };

  return (
    <Card className="p-6">
      {/* Filters Header */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Select value={filterDoctor} onValueChange={setFilterDoctor}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Doctor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Doctors</SelectItem>
              {doctors.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="waiting">Waiting</SelectItem>
              <SelectItem value="consulting">Consulting</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="missed">Missed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
              <SelectItem value="postop">Post-op</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Patient Count */}
      <div className="flex gap-4 mb-4 text-sm text-muted-foreground">
        <span>Total: {filteredPatients.length}</span>
        <span>Waiting: {filteredPatients.filter(p => p.status === 'waiting').length}</span>
        <span>Consulting: {filteredPatients.filter(p => p.status === 'consulting').length}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Token</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No patients found
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((patient) => (
                <TableRow key={patient.id} className="group">
                  <TableCell>
                    <span className="text-xl font-bold text-primary">{patient.token_number}</span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{patient.patient_name}</div>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {patient.phone_number && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />{patient.phone_number}
                          </span>
                        )}
                        {patient.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />{patient.email}
                          </span>
                        )}
                      </div>
                      {patient.notes && (
                        <div className="text-xs text-muted-foreground italic mt-1">{patient.notes}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{patient.doctors.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {patient.doctors.room_number} | C{patient.doctors.counter_number}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getPurposeLabel(patient.reason_for_visit)}</TableCell>
                  <TableCell>{getPriorityBadge(patient.priority)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(patient.status)}
                      {patient.waiting_for_tests && <Badge variant="outline" className="text-xs">🧪 Tests</Badge>}
                      {patient.billing_done && <Badge variant="outline" className="text-xs bg-success/20">💵 Billed</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(patient.registration_time), 'HH:mm')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      {(patient.status === 'waiting' || patient.status === 'consulting') && (
                        <Button size="sm" onClick={() => handleCall(patient)}>
                          <Volume2 className="h-4 w-4 mr-1" /> Call
                        </Button>
                      )}

                      {patient.status === 'waiting' && (
                        <>
                          <Button size="sm" variant="destructive" onClick={() => handleNoShow(patient)}>
                            No Show
                          </Button>
                        </>
                      )}
                      
                      {patient.status === 'consulting' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMarkTests(patient, !patient.waiting_for_tests)}
                          >
                            {patient.waiting_for_tests ? '✓ Tests' : '🧪'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMarkBilling(patient)}
                            disabled={patient.billing_done}
                          >
                            💵
                          </Button>
                          <Button size="sm" onClick={() => handleComplete(patient, true)}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Complete
                          </Button>
                        </>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => {
                            setSelectedPatient(patient);
                            setEditDoctor(patient.doctor_id);
                            setShowEditDialog(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" /> Reassign Doctor
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setShowCancelDialog(true);
                            }}
                          >
                            <X className="h-4 w-4 mr-2" /> Cancel Token
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Token {selectedPatient?.token_number}</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancellation. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for cancellation..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleCancel}>Confirm Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/Reassign Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Token {selectedPatient?.token_number}</DialogTitle>
            <DialogDescription>
              Select a new doctor for this patient.
            </DialogDescription>
          </DialogHeader>
          <Select value={editDoctor} onValueChange={setEditDoctor}>
            <SelectTrigger>
              <SelectValue placeholder="Select Doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map(d => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name} ({d.room_number})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleReassign}>Reassign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Billing Prompt Dialog */}
      <Dialog open={showBillingDialog} onOpenChange={setShowBillingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Token {selectedPatient?.token_number}</DialogTitle>
            <DialogDescription>
              Has the billing been completed for this patient?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => handleCompleteWithBilling(false)}>
              Complete without Billing
            </Button>
            <Button onClick={() => handleCompleteWithBilling(true)}>
              Complete with Billing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PatientQueueTable;
