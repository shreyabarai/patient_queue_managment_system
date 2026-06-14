import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'hi' | 'mr';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
    mr: string;
  };
}

const translations: Translations = {
  currentPatients: { en: 'Current Patients', hi: 'वर्तमान मरीज़', mr: 'सध्याचे रुग्ण' },
  nextInQueue: { en: 'Next in Queue', hi: 'अगला कतार में', mr: 'पुढील रांगेत' },
  token: { en: 'Token', hi: 'टोकन', mr: 'टोकन' },
  counter: { en: 'Counter', hi: 'काउंटर', mr: 'काउंटर' },
  room: { en: 'Room', hi: 'कक्ष', mr: 'खोली' },
  waiting: { en: 'Waiting', hi: 'प्रतीक्षारत', mr: 'प्रतीक्षेत' },
  consulting: { en: 'Consulting', hi: 'परामर्श', mr: 'सल्लामसलत' },
  completed: { en: 'Completed', hi: 'पूर्ण', mr: 'पूर्ण' },
  noShow: { en: 'No Show', hi: 'उपस्थित नहीं', mr: 'उपस्थित नाही' },
  waitingForTests: { en: 'Tests', hi: 'जांच', mr: 'चाचण्या' },
  billingDone: { en: 'Billing Done', hi: 'बिलिंग पूर्ण', mr: 'बिलिंग पूर्ण' },
  estimatedWait: { en: 'Est. Wait', hi: 'अनुमानित प्रतीक्षा', mr: 'अंदाजे प्रतीक्षा' },
  minutes: { en: 'min', hi: 'मिनट', mr: 'मिनिटे' },
  doctorWise: { en: 'Doctor-wise Queue', hi: 'डॉक्टर-वार कतार', mr: 'डॉक्टर-निहाय रांग' },
  announcements: { en: 'Announcements', hi: 'घोषणाएं', mr: 'घोषणा' },
  priority: { en: 'Priority', hi: 'प्राथमिकता', mr: 'प्राधान्य' },
  emergency: { en: 'Emergency', hi: 'आपातकाल', mr: 'आणीबाणी' },
  senior: { en: 'Senior Citizen', hi: 'वरिष्ठ नागरिक', mr: 'ज्येष्ठ नागरिक' },
  postOp: { en: 'Post-Op', hi: 'ऑपरेशन के बाद', mr: 'शस्त्रक्रियेनंतर' },
  normal: { en: 'Normal', hi: 'सामान्य', mr: 'सामान्य' },
  active: { en: 'Active', hi: 'सक्रिय', mr: 'सक्रिय' },
  delayed: { en: 'Delayed', hi: 'विलंबित', mr: 'विलंबित' },
  unavailable: { en: 'Unavailable', hi: 'अनुपलब्ध', mr: 'अनुपलब्ध' },
  search: { en: 'Search', hi: 'खोजें', mr: 'शोधा' },
  arrived: { en: 'Arrived', hi: 'पहुंचे', mr: 'पोहोचले' },
  patientsWaiting: { en: 'patients waiting', hi: 'मरीज़ इंतज़ार में', mr: 'रुग्ण प्रतीक्षेत' },
  noPatients: { en: 'No patients', hi: 'कोई मरीज़ नहीं', mr: 'कोणतेही रुग्ण नाहीत' },
  pleaseListenToken: { en: 'Please listen for your token number', hi: 'कृपया अपना टोकन नंबर सुनें', mr: 'कृपया तुमचा टोकन क्रमांक ऐका' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[key]?.[language] || translations[key]?.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
