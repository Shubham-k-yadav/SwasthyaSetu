import { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    navHospitals: 'Hospitals',
    navBlood: 'Blood Availability',
    navDonors: 'Blood Donors',
    navEmergency: 'Emergency',
    emergencyHelp: 'Emergency Help',
    adminLogin: 'Admin Login',
    holdBed: 'Hold Bed (10m)',
    directions: 'Directions',
    verified: 'Verified',
    unverified: 'Unverified',
    icuBeds: 'ICU Beds',
    generalBeds: 'General Beds',
    ventilatorBeds: 'Ventilator Beds',
    searchPlaceholder: 'Search hospitals by city, state, or name...',
    selectCity: 'Select City',
    systemDegradedBanner: 'Transparent System Mode: Local MongoDB is currently offline. System running in Degraded Demo Mode (in-memory store reset on restart).'
  },
  hi: {
    navHospitals: 'अस्पताल',
    navBlood: 'रक्त उपलब्धता',
    navDonors: 'रक्तदाता',
    navEmergency: 'आपातकालीन सेवा',
    emergencyHelp: 'आपातकालीन सहायता',
    adminLogin: 'एडमिन लॉगिन',
    holdBed: '10 मिनट बेड रिजर्व करें',
    directions: 'रास्ता देखें',
    verified: 'सत्यापित',
    unverified: 'असत्यापित',
    icuBeds: 'आईसीयू बेड',
    generalBeds: 'सामान्य बेड',
    ventilatorBeds: 'वेंटिलेटर बेड',
    searchPlaceholder: 'शहर, राज्य या नाम से अस्पताल खोजें...',
    selectCity: 'शहर चुनें',
    systemDegradedBanner: 'पारदर्शी सिस्टम मोड: स्थानीय MongoDB ऑफ़लाइन है। प्रणालियों का निष्पादन डिग्रैडेड डेमो मोड पर चल रहा है।'
  }
};

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key
});

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('swasthya_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('swasthya_lang', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
