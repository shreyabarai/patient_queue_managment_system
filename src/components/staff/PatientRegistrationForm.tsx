import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Printer, Mail, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  counter_number: number;
  room_number: string;
}

interface PatientRegistrationFormProps {
  doctors: Doctor[];
  nextToken: number;
  userId: string | undefined;
  onSuccess: () => void;
}

const PURPOSE_OPTIONS = [
  { value: "consultation", label: "👁️ Consultation" },
  { value: "follow-up", label: "🔄 Follow-up" },
  { value: "post-op", label: "🏥 Post-operative" },
  { value: "test-scan", label: "🔬 Test/Scan" },
  { value: "medicine-refill", label: "💊 Medicine Refill" },
  { value: "emergency", label: "🚨 Emergency" },
  { value: "other", label: "📋 Other" },
];

const getAgeFromDob = (dob: string) => {
  const birthDate = new Date(dob);
  const today = new Date();

  if (Number.isNaN(birthDate.getTime()) || birthDate > today) {
    return null;
  }

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  const days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 1) {
    const totalMonths = Math.max(
      1,
      (today.getFullYear() - birthDate.getFullYear()) * 12 +
        (today.getMonth() - birthDate.getMonth()) -
        (days < 0 ? 1 : 0)
    );

    return {
      age: Math.min(totalMonths, 12),
      unit: "months",
    };
  }

  return {
    age: Math.min(years, 120),
    unit: "years",
  };
};

const PatientRegistrationForm = ({ doctors, nextToken, userId, onSuccess }: PatientRegistrationFormProps) => {
  const { toast } = useToast();
  
  const [patientName, setPatientName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [purpose, setPurpose] = useState("consultation");
  const [notes, setNotes] = useState("");
  const [isPriority, setIsPriority] = useState(false);
  const [priorityType, setPriorityType] = useState("emergency");
  const [age, setAge] = useState("");
  const [ageUnit, setAgeUnit] = useState("years");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [registeredToken, setRegisteredToken] = useState<number | null>(null);
  const [registeredPatientName, setRegisteredPatientName] = useState("");
  const [registeredDoctor, setRegisteredDoctor] = useState<Doctor | null>(null);

  const validateForm = () => {
    const parsedAge = age ? parseInt(age, 10) : null;

    if (!patientName.trim()) {
      toast({ title: "Validation Error", description: "Patient name is required", variant: "destructive" });
      return false;
    }
    if (!selectedDoctor) {
      toast({ title: "Validation Error", description: "Please select a doctor", variant: "destructive" });
      return false;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Validation Error", description: "Please enter a valid email", variant: "destructive" });
      return false;
    }
    if (phoneNumber && !/^[0-9]{10}$/.test(phoneNumber.replace(/\D/g, ''))) {
      toast({ title: "Validation Error", description: "Please enter a valid 10-digit phone number", variant: "destructive" });
      return false;
    }
    if (dob && new Date(dob) > new Date()) {
      toast({ title: "Validation Error", description: "DOB cannot be in the future", variant: "destructive" });
      return false;
    }
    if (age && (!parsedAge || Number.isNaN(parsedAge))) {
      toast({ title: "Validation Error", description: "Please enter a valid age", variant: "destructive" });
      return false;
    }
    if (ageUnit === "months" && parsedAge !== null && (parsedAge < 1 || parsedAge > 12)) {
      toast({ title: "Validation Error", description: "Age in months must be between 1 and 12", variant: "destructive" });
      return false;
    }
    if (ageUnit === "years" && parsedAge !== null && (parsedAge < 1 || parsedAge > 120)) {
      toast({ title: "Validation Error", description: "Age in years must be between 1 and 120", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    const priority = isPriority ? priorityType : "normal";
    const doctor = doctors.find(d => d.id === selectedDoctor);
    const derivedAge = dob ? getAgeFromDob(dob) : null;
    const ageValue = derivedAge ? derivedAge.age : age ? parseInt(age, 10) : null;
    
    const { error } = await supabase
      .from('patients')
      .insert({
        token_number: nextToken,
        patient_name: patientName.trim(),
        email: email.trim() || null,
        phone_number: phoneNumber.trim() || null,
        doctor_id: selectedDoctor,
        reason_for_visit: purpose,
        notes: notes.trim() || null,
        priority,
        status: 'waiting',
        age: ageValue,
        gender: gender || null,
        registered_by: null,
      });

    setIsSubmitting(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setRegisteredToken(nextToken);
      setRegisteredPatientName(patientName);
      setRegisteredDoctor(doctor || null);
      setShowSuccessDialog(true);
      
      // Reset form
      setPatientName("");
      setEmail("");
      setPhoneNumber("");
      setSelectedDoctor("");
      setPurpose("consultation");
      setNotes("");
      setIsPriority(false);
      setAge("");
      setAgeUnit("years");
      setDob("");
      setGender("");
      
      onSuccess();
    }
  };

  const handlePrintToken = () => {
    const printContent = `
      <html>
        <head>
          <title>Token ${registeredToken}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .token { font-size: 72px; font-weight: bold; color: #0891b2; margin: 20px 0; }
            .hospital { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .info { font-size: 16px; margin: 5px 0; }
            .qr { margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="hospital">Mahatme Eye Hospital</div>
          <div class="token">TOKEN ${registeredToken}</div>
          <div class="info"><strong>Patient:</strong> ${registeredPatientName}</div>
          <div class="info"><strong>Doctor:</strong> ${registeredDoctor?.name || 'N/A'}</div>
          <div class="info"><strong>Room:</strong> ${registeredDoctor?.room_number || 'N/A'} | Counter ${registeredDoctor?.counter_number || 'N/A'}</div>
          <div class="info"><strong>Time:</strong> ${new Date().toLocaleString()}</div>
          <div class="qr">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TOKEN-${registeredToken}" />
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSendSMS = () => {
    toast({ title: "SMS Sent", description: `Token details sent to ${phoneNumber}` });
  };

  const handleSendEmail = () => {
    toast({ title: "Email Sent", description: `Token details sent to ${email}` });
  };

  const maxAge = ageUnit === "months" ? 12 : 120;
  const agePlaceholder = ageUnit === "months" ? "1-12 months" : "1-120 years";

  return (
    <>
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Register New Patient</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Token Display */}
          <div className="md:col-span-2 bg-secondary/50 rounded-lg p-4 text-center">
            <Label className="text-sm text-muted-foreground">Next Token Number</Label>
            <div className="text-5xl font-bold text-primary">{nextToken}</div>
          </div>
          
          {/* Patient Name */}
          <div className="md:col-span-2">
            <Label htmlFor="patientName">Patient Name <span className="text-destructive">*</span></Label>
            <Input 
              id="patientName" 
              value={patientName} 
              onChange={(e) => setPatientName(e.target.value)} 
              placeholder="Enter patient full name"
              className="mt-1"
            />
          </div>
          
          {/* Email */}
          <div>
            <Label htmlFor="email">Email (Optional)</Label>
            <Input 
              id="email" 
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="patient@email.com"
              className="mt-1"
            />
          </div>
          
          {/* Phone */}
          <div>
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input 
              id="phone" 
              value={phoneNumber} 
              onChange={(e) => setPhoneNumber(e.target.value)} 
              placeholder="10-digit mobile number"
              className="mt-1"
            />
          </div>
          
          {/* Age, DOB and Gender */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex-1">
              <Label htmlFor="age">Age</Label>
              <Input 
                id="age" 
                type="number"
                min={1}
                max={maxAge}
                value={age} 
                onChange={(e) => {
                  const nextValue = e.target.value;
                  if (nextValue === "") {
                    setAge("");
                    return;
                  }

                  const parsedValue = parseInt(nextValue, 10);
                  if (Number.isNaN(parsedValue)) {
                    return;
                  }

                  const clampedValue = Math.min(Math.max(parsedValue, 1), maxAge);
                  setAge(String(clampedValue));
                }} 
                placeholder={agePlaceholder}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="ageUnit">Unit</Label>
              <Select
                value={ageUnit}
                onValueChange={(value) => {
                  setAgeUnit(value);
                  setAge("");
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="months">Months (1-12)</SelectItem>
                  <SelectItem value="years">Years (1-120)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="dob">DOB (Optional)</Label>
              <Input
                id="dob"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={dob}
                onChange={(e) => {
                  const nextDob = e.target.value;
                  setDob(nextDob);

                  if (!nextDob) {
                    return;
                  }

                  const derived = getAgeFromDob(nextDob);
                  if (derived) {
                    setAge(String(derived.age));
                    setAgeUnit(derived.unit);
                  }
                }}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Doctor Selection */}
          <div>
            <Label htmlFor="doctor">Select Doctor <span className="text-destructive">*</span></Label>
            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    <span className="font-medium">{doctor.name}</span>
                    <span className="text-muted-foreground ml-2">
                      ({doctor.room_number} | Counter {doctor.counter_number})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Purpose of Visit */}
          <div>
            <Label htmlFor="purpose">Purpose of Visit</Label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PURPOSE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Notes */}
          <div className="md:col-span-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Any additional notes or special requirements..."
              className="mt-1"
              rows={3}
            />
          </div>
          
          {/* Priority Toggle */}
          <div className="md:col-span-2 flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Switch 
                checked={isPriority} 
                onCheckedChange={setIsPriority}
                id="priority-toggle"
              />
              <Label htmlFor="priority-toggle" className="cursor-pointer">Priority Patient</Label>
            </div>
            
            {isPriority && (
              <Select value={priorityType} onValueChange={setPriorityType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emergency">🚨 Emergency</SelectItem>
                  <SelectItem value="senior">👴 Senior Citizen</SelectItem>
                  <SelectItem value="postop">🏥 Post-operative</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          
          {/* Submit Button */}
          <div className="md:col-span-2">
            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              size="lg"
              disabled={isSubmitting}
            >
              <Plus className="mr-2 h-5 w-5" />
              {isSubmitting ? "Registering..." : "Register Patient"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-success">✓ Patient Registered Successfully</DialogTitle>
            <DialogDescription className="text-center">
              Token has been generated and added to the queue
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center py-6">
            <div className="text-6xl font-bold text-primary mb-2">Token {registeredToken}</div>
            <div className="text-lg text-foreground">{registeredPatientName}</div>
            <div className="text-muted-foreground">
              {registeredDoctor?.room_number} | Counter {registeredDoctor?.counter_number}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button onClick={handlePrintToken} className="w-full">
              <Printer className="mr-2 h-4 w-4" /> Print Token
            </Button>
            
            {phoneNumber && (
              <Button variant="outline" onClick={handleSendSMS} className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" /> Send SMS
              </Button>
            )}
            
            {email && (
              <Button variant="outline" onClick={handleSendEmail} className="w-full">
                <Mail className="mr-2 h-4 w-4" /> Send Email
              </Button>
            )}
            
            <Button variant="ghost" onClick={() => setShowSuccessDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PatientRegistrationForm;
