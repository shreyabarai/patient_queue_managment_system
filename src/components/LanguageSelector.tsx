import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { Globe } from "lucide-react";

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'en' as const, label: 'EN', name: 'English' },
    { code: 'hi' as const, label: 'हि', name: 'Hindi' },
    { code: 'mr' as const, label: 'म', name: 'Marathi' },
  ];

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-5 w-5 text-muted-foreground" />
      <div className="flex gap-1">
        {languages.map((lang) => (
          <Button
            key={lang.code}
            variant={language === lang.code ? "default" : "outline"}
            size="sm"
            onClick={() => setLanguage(lang.code)}
            className="px-3"
          >
            {lang.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
