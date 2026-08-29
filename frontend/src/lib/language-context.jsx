import { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Navigation & General
    appName: 'SwasthyaSetu',
    appSubtitle: 'National Emergency & Healthcare Resource Network',
    navHospitals: 'Hospitals & Beds',
    navBlood: 'Blood Availability',
    navDonors: 'Blood Donors',
    navEmergency: 'Emergency SOS',
    emergencyHelp: 'Emergency Help',
    adminLogin: 'Admin Login',
    registerHospital: 'Register Hospital',
    switchLanguage: 'हिंदी (HI)',

    // Home Page
    heroTitle: 'Real-Time Bed & Blood Emergency Network',
    heroSubtitle: 'Instant access to 463 geocoded hospitals, 1.98 Lakh verified beds, and live blood bank stocks across India.',
    findNearbyHospitals: 'Find Nearby Hospitals',
    emergencySOSCall: 'Emergency SOS Call (112)',
    liveHospitalNetwork: 'Live Hospital Network',
    verifiedBeds: 'Verified Beds Available',
    bloodUnitsStock: 'Blood Units Available',
    citiesCovered: 'Cities Across India',
    quickEmergencyTitle: 'Need Emergency Medical Help?',
    quickEmergencyDesc: 'Hold an ICU/Ventilator bed for 10 minutes with guaranteed availability while you reach the hospital.',
    reserveBedNow: 'Reserve ICU Bed Now',

    // Hospitals Page
    hospitalsDirectoryTitle: 'Hospital Directory & Bed Occupancy',
    hospitalsDirectoryDesc: 'Real-time hospital capacity, ICU availability, ventilator status, and location guidance.',
    searchHospitalsPlaceholder: 'Search hospitals by city, state, or hospital name...',
    allCities: 'All Cities',
    allBedTypes: 'All Bed Types',
    icuOnly: 'ICU Beds Only',
    ventilatorOnly: 'Ventilator Beds Only',
    generalOnly: 'General Beds Only',
    available: 'Available',
    totalCapacity: 'Total Capacity',
    icuBeds: 'ICU Beds',
    generalBeds: 'General Beds',
    ventilatorBeds: 'Ventilator Beds',
    holdBed: 'Hold Bed (10m)',
    holdingBed: 'Holding Bed...',
    directions: 'Get Directions',
    verified: 'Verified',
    unverified: 'Pending Verification',
    blockchainVerified: 'Blockchain Verified',
    contactHospital: 'Contact Hospital',
    facilitiesSpecialties: 'Specialties & Facilities',
    noHospitalsFound: 'No hospitals match your selected search or city filters.',

    // Blood Page
    bloodDirectoryTitle: 'National Blood Bank Availability',
    bloodDirectoryDesc: 'Search live blood bank stocks, critical blood types, and verified donors across India.',
    selectBloodGroup: 'Select Blood Group',
    selectCity: 'Select City',
    searchBloodStocks: 'Search Blood Stocks',
    allGroups: 'All Blood Groups (A+, B+, O+, AB-...)',
    unitsInStock: 'Units Available',
    lastUpdated: 'Last Updated',
    contactBloodBank: 'Contact Blood Bank',
    requestBloodUnits: 'Request Blood Units',
    registerAsDonor: 'Register as Blood Donor',
    criticalShortageAlert: 'Critical Shortage: O- & AB- blood units are low in several cities.',
    noBloodFound: 'No blood stocks found for selected city or blood group.',

    // Emergency Page
    emergencySOSTitle: 'Emergency Medical Dispatch & Bed Hold',
    emergencySOSDesc: 'Instant 10-minute bed reservation with real-time GPS location matching.',
    selectRequiredBedType: '1. Select Required Bed Type',
    searchNearbyHospitals: '2. Search Nearby Hospitals',
    patientName: 'Patient Full Name',
    contactPhone: 'Contact Mobile Number',
    confirmBedHold: 'Confirm 10-Minute Bed Hold',
    reservationActive: 'Bed Reservation Active!',
    reservationCode: 'Reservation Hold Code',
    holdExpiresIn: 'Hold Expires In',
    nationalHelplines: 'National Emergency Helplines',
    ambulance102: 'Ambulance Helpline: 102 / 108',
    disaster112: 'National Emergency: 112',

    // Hospital Onboarding Modal
    hospitalRegisterTitle: 'Hospital Onboarding & Registration',
    hospitalRegisterDesc: 'Connect your hospital to the SwasthyaSetu National Network',
    hospitalFullName: 'Hospital Full Name *',
    hospitalType: 'Hospital Type',
    privateHospital: 'Private Hospital',
    govtHospital: 'Government Hospital',
    charitableHospital: 'Charitable / Trust',
    licenseNumber: 'HFR / Registration License No.',
    phoneContact: 'Emergency Contact Phone',
    cityName: 'City *',
    stateName: 'State / Territory',
    fullAddress: 'Full Address',
    adminLoginEmail: 'Admin Login Email *',
    adminPassword: 'Admin Password *',
    submitApplication: 'Submit Registration Application',
    submittingApp: 'Submitting Application...',
    applicationSubmitted: 'Application Submitted Successfully!',

    // Admin & Login
    hospitalAdminPortal: 'Hospital Admin Portal',
    superAdminControl: 'Super Admin Control Room',
    hospitalStaffLogin: 'Hospital Staff & Nodal Officer Login',
    superAdminLoginTitle: 'Ministry Super Admin Control Room',
    updateBedsButton: 'Update Beds',
    updateBedsTitle: 'Update Bed Availability',
    saveBedUpdates: 'Save Bed Updates',
    cancel: 'Cancel',

    // Footer
    footerDesc: 'SwasthyaSetu is India\'s unified real-time emergency healthcare resource portal powering bed availability, blood stocks, and emergency dispatch.',
    quickLinks: 'Quick Links',
    emergencyHelplines: 'Emergency Helplines',
    rightsReserved: 'All Rights Reserved. SwasthyaSetu National Health Network.'
  },
  hi: {
    // Navigation & General
    appName: 'स्वास्थ्य सेतु',
    appSubtitle: 'राष्ट्रीय आपातकालीन एवं स्वास्थ्य संसाधन नेटवर्क',
    navHospitals: 'अस्पताल और बेड',
    navBlood: 'रक्त उपलब्धता',
    navDonors: 'रक्तदाता नेटवर्क',
    navEmergency: 'आपातकालीन सेवा (SOS)',
    emergencyHelp: 'आपातकालीन सहायता',
    adminLogin: 'एडमिन लॉगिन',
    registerHospital: 'अस्पताल पंजीकृत करें',
    switchLanguage: 'English (EN)',

    // Home Page
    heroTitle: 'रीयल-टाइम बेड एवं ब्लड आपातकालीन नेटवर्क',
    heroSubtitle: 'भारत भर के 463 सत्यापित अस्पतालों, 1.98 लाख बेड्स और ब्लड बैंकों की लाइव उपलब्धता तक त्वरित पहुँच।',
    findNearbyHospitals: 'निकटतम अस्पताल खोजें',
    emergencySOSCall: 'इमरजेंसी कॉल करें (112)',
    liveHospitalNetwork: 'लाइव अस्पताल नेटवर्क',
    verifiedBeds: 'सत्यापित बेड उपलब्ध',
    bloodUnitsStock: 'रक्त यूनिट उपलब्ध',
    citiesCovered: 'भारत भर के प्रमुख शहर',
    quickEmergencyTitle: 'क्या आपको आपातकालीन चिकित्सा सहायता चाहिए?',
    quickEmergencyDesc: 'अस्पताल पहुँचने तक 10 मिनट के लिए गारंटीकृत ICU / वेंटिलेटर बेड तुरंत रिज़र्व करें।',
    reserveBedNow: 'अभी ICU बेड रिज़र्व करें',

    // Hospitals Page
    hospitalsDirectoryTitle: 'अस्पताल डायरेक्टरी एवं बेड उपलब्धता',
    hospitalsDirectoryDesc: 'अस्पताल क्षमता, ICU उपलब्धता, वेंटिलेटर स्थिति और लोकेशन का रीयल-टाइम विवरण।',
    searchHospitalsPlaceholder: 'शहर, राज्य या अस्पताल के नाम से खोजें...',
    allCities: 'सभी शहर',
    allBedTypes: 'सभी प्रकार के बेड',
    icuOnly: 'केवल ICU बेड',
    ventilatorOnly: 'केवल वेंटिलेटर बेड',
    generalOnly: 'केवल सामान्य बेड',
    available: 'उपलब्ध',
    totalCapacity: 'कुल क्षमता',
    icuBeds: 'ICU बेड्स',
    generalBeds: 'सामान्य बेड्स',
    ventilatorBeds: 'वेंटिलेटर बेड्स',
    holdBed: '10 मिनट बेड रिज़र्व करें',
    holdingBed: 'रिज़र्व हो रहा है...',
    directions: 'रास्ता (गूगल मैप) देखें',
    verified: 'सत्यापित अस्पताल',
    unverified: 'सत्यापन लंबित',
    blockchainVerified: 'ब्लॉकचेन सत्यापित',
    contactHospital: 'अस्पताल से संपर्क करें',
    facilitiesSpecialties: 'विशेषज्ञता एवं सुविधाएं',
    noHospitalsFound: 'आपके खोजे गए फ़िल्टर या शहर के लिए कोई अस्पताल नहीं मिला।',

    // Blood Page
    bloodDirectoryTitle: 'राष्ट्रीय ब्लड बैंक एवं रक्त उपलब्धता',
    bloodDirectoryDesc: 'लाइव ब्लड बैंक स्टॉक, दुर्लभ रक्त समूह और सत्यापित रक्तदाताओं की खोज करें।',
    selectBloodGroup: 'रक्त समूह चुनें',
    selectCity: 'शहर चुनें',
    searchBloodStocks: 'रक्त स्टॉक खोजें',
    allGroups: 'सभी रक्त समूह (A+, B+, O+, AB-...)',
    unitsInStock: 'उपलब्ध यूनिट्स',
    lastUpdated: 'अंतिम अपडेट',
    contactBloodBank: 'ब्लड बैंक से संपर्क करें',
    requestBloodUnits: 'रक्त आवश्यकता की मांग करें',
    registerAsDonor: 'रक्तदाता के रूप में पंजीकरण करें',
    criticalShortageAlert: 'चेतावनी: कई शहरों में O- और AB- रक्त समूह की भारी कमी है।',
    noBloodFound: 'चयनित शहर या रक्त समूह के लिए कोई स्टॉक नहीं मिला।',

    // Emergency Page
    emergencySOSTitle: 'आपातकालीन चिकित्सा सहायता एवं तत्काल बेड होल्ड',
    emergencySOSDesc: 'रीयल-टाइम जीपीएस लोकेशन के आधार पर 10 मिनट के लिए गारंटीकृत बेड रिज़र्वेशन।',
    selectRequiredBedType: '1. आवश्यक बेड प्रकार चुनें',
    searchNearbyHospitals: '2. नजदीकी अस्पताल खोजें',
    patientName: 'मरीज का पूरा नाम',
    contactPhone: 'मोबाइल नंबर',
    confirmBedHold: '10 मिनट का बेड होल्ड कन्फर्म करें',
    reservationActive: 'बेड सफलता से रिज़र्व हो गया!',
    reservationCode: 'रिज़र्वेशन होल्ड कोड',
    holdExpiresIn: 'होल्ड समाप्त होने का समय',
    nationalHelplines: 'राष्ट्रीय आपातकालीन हेल्पलाइन',
    ambulance102: 'एम्बुलेंस हेल्पलाइन: 102 / 108',
    disaster112: 'राष्ट्रीय आपातकालीन सेवा: 112',

    // Hospital Onboarding Modal
    hospitalRegisterTitle: 'अस्पताल ऑनबोर्डिंग एवं पंजीकरण',
    hospitalRegisterDesc: 'अपने अस्पताल को स्वास्थ सेतु राष्ट्रीय आपातकालीन नेटवर्क से जोड़ें',
    hospitalFullName: 'अस्पताल का पूरा नाम *',
    hospitalType: 'अस्पताल का प्रकार',
    privateHospital: 'निजी अस्पताल (Private)',
    govtHospital: 'सरकारी अस्पताल (Government)',
    charitableHospital: 'चैरिटेबल / ट्रस्ट',
    licenseNumber: 'HFR / पंजीकरण लाइसेंस संख्या',
    phoneContact: 'इमरजेंसी संपर्क फोन नंबर',
    cityName: 'शहर *',
    stateName: 'राज्य / केंद्र शासित प्रदेश',
    fullAddress: 'पूरा पता',
    adminLoginEmail: 'एडमिन लॉगिन ईमेल *',
    adminPassword: 'एडमिन पासवर्ड *',
    submitApplication: 'पंजीकरण आवेदन जमा करें',
    submittingApp: 'आवेदन जमा हो रहा है...',
    applicationSubmitted: 'आवेदन सफलतापूर्वक जमा हो गया!',

    // Admin & Login
    hospitalAdminPortal: 'अस्पताल एडमिन पोर्टल',
    superAdminControl: 'सुपर एडमिन कंट्रोल रूम',
    hospitalStaffLogin: 'अस्पताल स्टाफ एवं नोडल अधिकारी लॉगिन',
    superAdminLoginTitle: 'मंत्रालय सुपर एडमिन कंट्रोल रूम',
    updateBedsButton: 'बेड अपडेट करें',
    updateBedsTitle: 'बेड उपलब्धता अपडेट करें',
    saveBedUpdates: 'बेड अपडेट सेव करें',
    cancel: 'रद्द करें',

    // Footer
    footerDesc: 'स्वास्थ सेतु भारत का एकीकृत रीयल-टाइम आपातकालीन स्वास्थ्य पोर्टल है जो बेड उपलब्धता, ब्लड स्टॉक और एम्बुलेंस सेवाओं को संचालित करता है।',
    quickLinks: 'महत्वपूर्ण लिंक्स',
    emergencyHelplines: 'आपातकालीन हेल्पलाइन्स',
    rightsReserved: 'सर्वाधिकार सुरक्षित। स्वास्थ सेतु राष्ट्रीय स्वास्थ्य नेटवर्क।'
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
