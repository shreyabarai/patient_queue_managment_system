import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Users, Clock, MapPin } from "lucide-react";

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

interface DoctorManagementProps {
  doctors: Doctor[];
  patientCounts: Record<string, number>;
  onRefresh: () => void;
}

const SPECIALTIES = [
  "Ophthalmologist",
  "Retina Specialist",
  "Glaucoma Specialist",
  "Cornea Specialist",
  "Pediatric Ophthalmologist",
  "Oculoplastic Surgeon",
  "General Eye Care",
  "Cataract Surgeon",
  "Neuro-Ophthalmologist",
];

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
      status?: number;
      statusText?: string;
    };

    const combinedText = [
      maybeError.message,
      maybeError.details,
      maybeError.hint,
      maybeError.code,
      maybeError.statusText,
    ]
      .filter(Boolean)
      .join(" ");

    if (
      maybeError.status === 404 ||
      maybeError.code === "PGRST205" ||
      combinedText.includes("/rest/v1/doctors") ||
      combinedText.toLowerCase().includes("not found")
    ) {
      return "The new Supabase project is missing the doctors API/table. Run this project's Supabase migrations on the new project first.";
    }

    if (maybeError.message) {
      if (
        maybeError.message.includes("Failed to fetch") ||
        maybeError.message.includes("fetch failed")
      ) {
        return "Unable to reach Supabase. Check your internet connection and confirm VITE_SUPABASE_URL points to a live project.";
      }

      const parts = [
        maybeError.message,
        maybeError.details,
        maybeError.hint,
      ].filter(Boolean);

      return parts.join(" ");
    }
  }

  if (error instanceof Error) {
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("fetch failed")
    ) {
      return "Unable to reach Supabase. Check your internet connection and confirm VITE_SUPABASE_URL points to a live project.";
    }

    return error.message;
  }

  return "Something went wrong while saving the doctor.";
};

const DoctorManagement = ({ doctors, patientCounts, onRefresh }: DoctorManagementProps) => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [counterNumber, setCounterNumber] = useState("");
  const [avgTime, setAvgTime] = useState("10");

  const resetForm = () => {
    setName("");
    setSpecialty("");
    setRoomNumber("");
    setCounterNumber("");
    setAvgTime("10");
    setEditingDoctor(null);
  };

  const openAddDialog = () => {
    resetForm();
    // Auto-assign next counter number
    const maxCounter = doctors.reduce((max, d) => Math.max(max, d.counter_number), 0);
    setCounterNumber(String(maxCounter + 1));
    setRoomNumber(`Room ${maxCounter + 1}`);
    setShowDialog(true);
  };

  const openEditDialog = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setName(doctor.name);
    setSpecialty(doctor.specialty);
    setRoomNumber(doctor.room_number);
    setCounterNumber(String(doctor.counter_number));
    setAvgTime(String(doctor.avg_consultation_minutes));
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !specialty || !roomNumber.trim() || !counterNumber) {
      toast({ title: "Validation Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const doctorData = {
      name: name.trim(),
      specialty,
      room_number: roomNumber.trim(),
      counter_number: parseInt(counterNumber),
      avg_consultation_minutes: parseInt(avgTime) || 10,
    };

    try {
      if (editingDoctor) {
        const { error } = await supabase
          .from('doctors')
          .update(doctorData)
          .eq('id', editingDoctor.id);

        if (error) throw error;

        toast({ title: "Doctor Updated", description: `${name} has been updated` });
      } else {
        const { error } = await supabase
          .from('doctors')
          .insert({ ...doctorData, status: 'active', is_active: true });

        if (error) throw error;

        toast({ title: "Doctor Added", description: `${name} has been added` });
      }

      setShowDialog(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error("Doctor save failed", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateDoctorStatus = async (doctorId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('doctors')
        .update({ status })
        .eq('id', doctorId);

      if (error) throw error;

      toast({ title: "Status Updated" });
      onRefresh();
    } catch (error) {
      console.error("Doctor status update failed", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const toggleDoctorActive = async (doctor: Doctor) => {
    try {
      const { error } = await supabase
        .from('doctors')
        .update({ is_active: !doctor.is_active })
        .eq('id', doctor.id);

      if (error) throw error;

      toast({ 
        title: doctor.is_active ? "Doctor Deactivated" : "Doctor Activated",
        description: `${doctor.name} is now ${doctor.is_active ? 'inactive' : 'active'}`
      });
      onRefresh();
    } catch (error) {
      console.error("Doctor active toggle failed", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
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

  // Show all doctors including inactive ones for management
  const allDoctors = doctors;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Doctor Management</h2>
          <p className="text-sm text-muted-foreground">Add, edit, and manage doctor availability</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Doctor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allDoctors.length === 0 ? (
          <Card className="col-span-full p-8 text-center">
            <p className="text-muted-foreground mb-4">No doctors added yet</p>
            <Button onClick={openAddDialog}>Add First Doctor</Button>
          </Card>
        ) : (
          allDoctors.map((doctor) => (
            <Card 
              key={doctor.id} 
              className={`p-5 relative overflow-hidden transition-opacity ${!doctor.is_active ? 'opacity-60' : ''}`}
            >
              {/* Status indicator dot */}
              <div className={`absolute top-0 right-0 w-3 h-3 rounded-bl-lg ${getStatusDot(doctor.status)}`} />
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{doctor.name}</h3>
                    {!doctor.is_active && (
                      <Badge variant="outline" className="text-xs">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => openEditDialog(doctor)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
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

              {/* Active toggle */}
              <div className="flex items-center justify-between mb-4 p-2 bg-muted rounded-lg">
                <Label htmlFor={`active-${doctor.id}`} className="text-sm cursor-pointer">
                  Available for Queue
                </Label>
                <Switch
                  id={`active-${doctor.id}`}
                  checked={doctor.is_active}
                  onCheckedChange={() => toggleDoctorActive(doctor)}
                />
              </div>
              
              {/* Status buttons - only show if active */}
              {doctor.is_active && (
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
                    Away
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</DialogTitle>
            <DialogDescription>
              {editingDoctor ? 'Update doctor information' : 'Add a new doctor to the queue system'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Doctor Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="specialty">Specialization <span className="text-destructive">*</span></Label>
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="room">Room <span className="text-destructive">*</span></Label>
                <Input
                  id="room"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="Room 1"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="counter">Counter # <span className="text-destructive">*</span></Label>
                <Input
                  id="counter"
                  type="number"
                  value={counterNumber}
                  onChange={(e) => setCounterNumber(e.target.value)}
                  placeholder="1"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="avgTime">Avg. Consultation Time (minutes)</Label>
              <Input
                id="avgTime"
                type="number"
                value={avgTime}
                onChange={(e) => setAvgTime(e.target.value)}
                placeholder="10"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingDoctor ? 'Update Doctor' : 'Add Doctor'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DoctorManagement;
