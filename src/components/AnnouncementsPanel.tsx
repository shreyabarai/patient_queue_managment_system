import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { Bell, AlertTriangle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Announcement {
  id: string;
  message_en: string;
  message_hi: string | null;
  message_mr: string | null;
  type: string;
  is_active: boolean;
}

const AnnouncementsPanel = () => {
  const { language, t } = useLanguage();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetchAnnouncements();
    
    const channel = supabase
      .channel('announcements-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'announcements'
      }, () => fetchAnnouncements())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (data) setAnnouncements(data);
  };

  const getMessage = (announcement: Announcement) => {
    if (language === 'hi' && announcement.message_hi) return announcement.message_hi;
    if (language === 'mr' && announcement.message_mr) return announcement.message_mr;
    return announcement.message_en;
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'warning': return 'border-warning bg-warning/10 text-warning-foreground';
      case 'error': return 'border-destructive bg-destructive/10 text-destructive';
      default: return 'border-primary bg-primary/10 text-primary';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      default: return <Info className="h-5 w-5 text-primary" />;
    }
  };

  if (announcements.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
        <Bell className="h-5 w-5" />
        {t('announcements')}
      </h3>
      <div className="space-y-2">
        {announcements.map((announcement) => (
          <Card 
            key={announcement.id} 
            className={`p-4 border-l-4 ${getTypeStyles(announcement.type)}`}
          >
            <div className="flex items-start gap-3">
              {getIcon(announcement.type)}
              <p className="text-sm font-medium flex-1">{getMessage(announcement)}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementsPanel;
