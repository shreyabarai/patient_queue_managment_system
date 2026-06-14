import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";

interface AudioToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
  isSpeaking?: boolean;
}

const AudioToggle = ({ isEnabled, onToggle, isSpeaking }: AudioToggleProps) => {
  return (
    <Button
      variant={isEnabled ? "default" : "outline"}
      size="sm"
      onClick={onToggle}
      className="gap-2"
    >
      {isEnabled ? (
        <Volume2 className={`h-4 w-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
      ) : (
        <VolumeX className="h-4 w-4" />
      )}
      {isEnabled ? 'Audio On' : 'Audio Off'}
    </Button>
  );
};

export default AudioToggle;
