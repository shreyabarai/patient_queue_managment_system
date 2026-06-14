import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { BarChart3, Users, Clock, TrendingUp, Calendar, Filter, ArrowLeft } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface AnalyticsData {
  dailyFootfall: number;
  avgWaitTime: number;
  peakHour: string;
  doctorCounts: Record<string, number>;
  statusBreakdown: Record<string, number>;
}

interface HistoryFilters {
  date: string;
  doctor: string;
  status: string;
}

const Admin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    dailyFootfall: 0,
    avgWaitTime: 0,
    peakHour: '-',
    doctorCounts: {},
    statusBreakdown: {}
  });
  const [doctors, setDoctors] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [filters, setFilters] = useState<HistoryFilters>({
    date: format(new Date(), 'yyyy-MM-dd'),
    doctor: 'all',
    status: 'all'
  });

  useEffect(() => {
    checkAuth();
    fetchDoctors();
    fetchAnalytics();
    fetchHistory();
  }, [filters]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const fetchDoctors = async () => {
    const { data } = await supabase.from('doctors').select('*').order('name');
    if (data) setDoctors(data);
  };

  const fetchAnalytics = async () => {
    const today = new Date();
    const startOfToday = startOfDay(today).toISOString();
    const endOfToday = endOfDay(today).toISOString();

    // Daily footfall
    const { data: todayPatients, count } = await supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .gte('registration_time', startOfToday)
      .lte('registration_time', endOfToday);

    // Calculate average wait time
    let totalWaitTime = 0;
    let waitCount = 0;
    
    if (todayPatients) {
      todayPatients.forEach(p => {
        if (p.registration_time && p.consultation_time) {
          const wait = new Date(p.consultation_time).getTime() - new Date(p.registration_time).getTime();
          totalWaitTime += wait / 60000; // Convert to minutes
          waitCount++;
        }
      });
    }

    // Peak hour calculation
    const hourCounts: Record<number, number> = {};
    todayPatients?.forEach(p => {
      const hour = new Date(p.registration_time).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

    // Doctor-wise counts
    const doctorCounts: Record<string, number> = {};
    todayPatients?.forEach(p => {
      const docId = p.doctor_id || 'unassigned';
      doctorCounts[docId] = (doctorCounts[docId] || 0) + 1;
    });

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    todayPatients?.forEach(p => {
      statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1;
    });

    setAnalytics({
      dailyFootfall: count || 0,
      avgWaitTime: waitCount > 0 ? Math.round(totalWaitTime / waitCount) : 0,
      peakHour: peakHour ? `${peakHour[0]}:00 - ${parseInt(peakHour[0]) + 1}:00` : '-',
      doctorCounts,
      statusBreakdown
    });
  };

  const fetchHistory = async () => {
    let query = supabase
      .from('patients')
      .select(`*, doctors (name)`)
      .order('registration_time', { ascending: false })
      .limit(100);

    if (filters.date) {
      const start = startOfDay(new Date(filters.date)).toISOString();
      const end = endOfDay(new Date(filters.date)).toISOString();
      query = query.gte('registration_time', start).lte('registration_time', end);
    }

    if (filters.doctor !== 'all') {
      query = query.eq('doctor_id', filters.doctor);
    }

    if (filters.status !== 'all') {
      query = query.eq('status', filters.status as 'waiting' | 'consulting' | 'completed' | 'missed');
    }

    const { data } = await query;
    if (data) setHistoryData(data);
  };

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor?.name || 'Unassigned';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/staff')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Admin Analytics</h1>
              <p className="text-muted-foreground">Daily statistics and token history</p>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Daily Footfall</p>
                <p className="text-3xl font-bold text-foreground">{analytics.dailyFootfall}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-warning/10">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Wait Time</p>
                <p className="text-3xl font-bold text-foreground">{analytics.avgWaitTime} min</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Peak Hour</p>
                <p className="text-xl font-bold text-foreground">{analytics.peakHour}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-accent/10">
                <BarChart3 className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Today</p>
                <p className="text-3xl font-bold text-foreground">
                  {analytics.statusBreakdown['completed'] || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Doctor-wise Stats */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Doctor-wise Patient Count (Today)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(analytics.doctorCounts).map(([docId, count]) => (
              <div key={docId} className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">{count}</p>
                <p className="text-sm text-muted-foreground truncate">{getDoctorName(docId)}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Token History */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Token History
            </h2>
            <div className="flex items-center gap-3">
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="w-40"
              />
              <Select value={filters.doctor} onValueChange={(v) => setFilters({ ...filters, doctor: v })}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Doctors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Token</th>
                  <th className="text-left py-3 px-4">Patient</th>
                  <th className="text-left py-3 px-4">Doctor</th>
                  <th className="text-left py-3 px-4">Time</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Priority</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((patient) => (
                  <tr key={patient.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-bold text-primary">{patient.token_number}</td>
                    <td className="py-3 px-4">{patient.patient_name}</td>
                    <td className="py-3 px-4">{patient.doctors?.name || '-'}</td>
                    <td className="py-3 px-4">
                      {format(new Date(patient.registration_time), 'hh:mm a')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        patient.status === 'completed' ? 'bg-success/20 text-success' :
                        patient.status === 'consulting' ? 'bg-primary/20 text-primary' :
                        patient.status === 'no_show' ? 'bg-destructive/20 text-destructive' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {patient.priority !== 'normal' && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          patient.priority === 'emergency' ? 'bg-destructive/20 text-destructive' :
                          patient.priority === 'senior' ? 'bg-warning/20 text-warning' :
                          'bg-primary/20 text-primary'
                        }`}>
                          {patient.priority}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
