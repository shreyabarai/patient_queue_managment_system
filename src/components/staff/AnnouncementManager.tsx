import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";

interface Announcement {
  id: string;
  message_en: string;
  message_hi: string | null;
  message_mr: string | null;
  type: string;
  is_active: boolean;
  created_at: string;
}

const AnnouncementManager = () => {
  const { toast } = useToast();
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [messageEn, setMessageEn] = useState("");
  const [messageHi, setMessageHi] = useState("");
  const [messageMr, setMessageMr] = useState("");
  const [announcementType, setAnnouncementType] = useState("info");

  useEffect(() => {
    fetchAnnouncements();
    
    const channel = supabase
      .channel('announcements-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, fetchAnnouncements)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setAnnouncements(data);
  };

  const handleAdd = async () => {
    if (!messageEn.trim()) {
      toast({ title: "Error", description: "English message is required", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from('announcements').insert({
      message_en: messageEn.trim(),
      message_hi: messageHi.trim() || null,
      message_mr: messageMr.trim() || null,
      type: announcementType,
      is_active: true,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Announcement Added" });
      setMessageEn("");
      setMessageHi("");
      setMessageMr("");
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('announcements')
      .update({ is_active: !isActive })
      .eq('id', id);

    if (!error) {
      toast({ title: isActive ? "Announcement Hidden" : "Announcement Shown" });
      fetchAnnouncements();
    }
  };

  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);

    if (!error) {
      toast({ title: "Announcement Deleted" });
      fetchAnnouncements();
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'warning': return <Badge className="bg-warning text-warning-foreground">⚠️ Warning</Badge>;
      case 'error': return <Badge className="bg-destructive text-destructive-foreground">🚨 Urgent</Badge>;
      default: return <Badge variant="secondary">ℹ️ Info</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Announcement */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Add New Announcement</h3>
        
        <div className="space-y-4">
          <div>
            <Label>Message (English) <span className="text-destructive">*</span></Label>
            <Textarea
              value={messageEn}
              onChange={(e) => setMessageEn(e.target.value)}
              placeholder="Announcement in English..."
              className="mt-1"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Message (Hindi)</Label>
              <Textarea
                value={messageHi}
                onChange={(e) => setMessageHi(e.target.value)}
                placeholder="Hindi में घोषणा..."
                className="mt-1"
                rows={2}
              />
            </div>
            <div>
              <Label>Message (Marathi)</Label>
              <Textarea
                value={messageMr}
                onChange={(e) => setMessageMr(e.target.value)}
                placeholder="मराठीत घोषणा..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label>Type</Label>
              <Select value={announcementType} onValueChange={setAnnouncementType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">ℹ️ Info</SelectItem>
                  <SelectItem value="warning">⚠️ Warning</SelectItem>
                  <SelectItem value="error">🚨 Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" /> Add Announcement
            </Button>
          </div>
        </div>
      </Card>

      {/* Existing Announcements */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Active Announcements</h3>
        
        {announcements.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No announcements</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div 
                key={ann.id} 
                className={`p-4 rounded-lg border ${ann.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeBadge(ann.type)}
                      {!ann.is_active && <Badge variant="outline">Hidden</Badge>}
                    </div>
                    <p className="text-foreground font-medium">{ann.message_en}</p>
                    {ann.message_hi && <p className="text-sm text-muted-foreground mt-1">{ann.message_hi}</p>}
                    {ann.message_mr && <p className="text-sm text-muted-foreground">{ann.message_mr}</p>}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => toggleActive(ann.id, ann.is_active)}
                    >
                      {ann.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteAnnouncement(ann.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AnnouncementManager;
