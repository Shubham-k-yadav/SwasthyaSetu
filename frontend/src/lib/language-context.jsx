import { createContext, useContext, useState, useEffect } from 'react';
import apiCall from '@/lib/api';

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
    platformStatusText: 'verified hospitals and',
    platformStatusTextBlood: 'blood banks are live on SwasthyaSetu. Are you a hospital or blood bank?',
    joinNetworkCTA: 'Join the Network',
    noHospitalsTitle: 'No Verified Hospitals Yet',
    noHospitalsDesc: 'No verified hospitals are currently registered in this area. Be the first to register your facility!',
    noBloodTitle: 'No Verified Blood Banks Yet',
    noBloodDesc: 'No verified blood banks are currently registered in this area. Be the first to register your blood bank!',
    registerFacilityCTA: 'Register Facility',
    registerBloodBank: 'Register Blood Bank',

    // Home Page
    heroTitle: 'Real-Time Bed & Blood Emergency Network',
    heroTitleMain: 'Find Emergency Hospital Beds in Real-Time',
    heroSubtitleMain: 'SwasthyaSetu connects patients to verified hospital beds, ICU units, and live blood availability across India. When every second counts, get real-time verified healthcare support.',
    findEmergencyBed: 'Find Emergency Bed',
    findBlood: 'Find Blood',
    liveUpdatesIndia: 'Live Updates Across India',
    bedsTracked: 'Beds Tracked',
    heroSubtitle: 'Real-time emergency healthcare network connecting verified hospitals, blood banks, and live ambulance dispatch across India.',
    findNearbyHospitals: 'Find Nearby Hospitals',
    emergencySOSCall: 'Emergency SOS Call (112)',
    liveHospitalNetwork: 'Live Hospital Network',
    verifiedBeds: 'Verified Beds Available',
    bloodUnitsStock: 'Blood Units Available',
    citiesCovered: 'Cities Across India',
    quickEmergencyTitle: 'Need Emergency Medical Help?',
    quickEmergencyDesc: 'Hold an ICU/Ventilator bed for 10 minutes with guaranteed availability while you reach the hospital.',
    reserveBedNow: 'Reserve ICU Bed Now',
    noBedsAvailable: 'No Beds Available',

    // Problem Statement & Features
    problemWeSolveTitle: 'The Problem We Solve',
    problemWeSolveDesc: 'During medical emergencies in India, families waste precious time calling hospitals to check bed availability. Many lose loved ones due to delayed care.',
    goldenHourLost: 'Golden Hour Lost',
    goldenHourDesc: 'Trauma patients have 60 minutes for life-saving intervention. Most spend this time searching for hospitals.',
    noCentralSystem: 'No Central System',
    noCentralDesc: 'Families call 10-15 hospitals during emergencies. Real-time bed data is not accessible to public.',
    bloodShortage: 'Blood Shortage',
    bloodShortageDesc: 'India faces a shortage of 1.5 million blood units annually. Finding donors during emergencies is chaotic.',
    howItHelps: 'How SwasthyaSetu Helps',
    howItHelpsDesc: 'A comprehensive platform connecting patients, hospitals, and donors in real-time.',
    smartSearch: 'Smart Search',
    smartSearchDesc: 'AI-powered search finds the best hospital based on location, bed type, and availability.',
    realTimeUpdates: 'Real-Time Updates',
    realTimeUpdatesDesc: 'Live bed and blood availability updates from hospitals via Socket.io connection.',
    blockchainVerifiedTitle: 'Blockchain Verified',
    blockchainVerifiedDesc: 'Hospital data verified on Polygon blockchain. Tamper-proof and trustworthy.',
    routeOptimization: 'Route Optimization',
    routeOptimizationDesc: 'Get the fastest route to your chosen hospital with integrated maps.',
    donorNetwork: 'Donor Network',
    donorNetworkDesc: 'Connect with registered blood donors in your area during emergencies.',
    panIndiaCoverage: 'Pan-India Coverage',
    panIndiaCoverageDesc: 'Available across all major cities with expanding hospital network daily.',
    howItWorks: 'How It Works',
    howItWorksDesc: 'Get connected to the right hospital in three simple steps.',
    shareLocation: 'Share Location',
    shareLocationDesc: 'Allow location access or enter your address manually.',
    selectEmergencyType: 'Select Emergency Type',
    selectEmergencyTypeDesc: 'Choose emergency type and required bed type (ICU, General, Ventilator).',
    getRecommendations: 'Get Recommendations',
    getRecommendationsDesc: 'View top hospitals sorted by distance and availability with routes.',
    everySecondCounts: 'Every Second Counts in an Emergency',
    everySecondCountsDesc: 'Do not waste time calling hospitals. Find available beds instantly with SwasthyaSetu.',
    searchNow: 'Search Now',
    registerAsDonor: 'Register as Donor',

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
    registerAsBloodDonor: 'Register as Blood Donor',
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
    platformStatusText: 'सत्यापित अस्पताल और',
    platformStatusTextBlood: 'ब्लड बैंक स्वास्थ सेतु पर लाइव हैं। क्या आप एक अस्पताल या ब्लड बैंक हैं?',
    joinNetworkCTA: 'नेटवर्क में शामिल हों',
    noHospitalsTitle: 'अभी तक कोई सत्यापित अस्पताल नहीं',
    noHospitalsDesc: 'आपके क्षेत्र में अभी तक कोई सत्यापित अस्पताल पंजीकृत नहीं है। अपनी सुविधा पंजीकृत करने वाले पहले व्यक्ति बनें!',
    noBloodTitle: 'अभी तक कोई सत्यापित ब्लड बैंक नहीं',
    noBloodDesc: 'आपके क्षेत्र में अभी तक कोई सत्यापित ब्लड बैंक पंजीकृत नहीं है। अपना ब्लड बैंक पंजीकृत करने वाले पहले व्यक्ति बनें!',
    registerFacilityCTA: 'सुविधा पंजीकृत करें',
    registerBloodBank: 'ब्लड बैंक पंजीकृत करें',

    // Home Page
    heroTitle: 'रीयल-टाइम बेड एवं ब्लड आपातकालीन नेटवर्क',
    heroTitleMain: 'रीयल-टाइम में आपातकालीन अस्पताल बेड्स खोजें',
    heroSubtitleMain: 'स्वास्थ सेतु (SwasthyaSetu) मरीजों को भारत भर के सत्यापित अस्पताल बेड्स, ICU यूनिट्स और लाइव ब्लड बैंक से जोड़ता है। जब हर सेकंड कीमती हो, तुरंत सत्यापित सहायता पाएँ।',
    findEmergencyBed: 'आपातकालीन बेड खोजें',
    findBlood: 'रक्त उपलब्धता खोजें',
    liveUpdatesIndia: 'भारत भर से लाइव अपडेट्स',
    bedsTracked: 'ट्रैक किए गए बेड्स',
    heroSubtitle: 'भारत भर में सत्यापित अस्पतालों, ब्लड बैंकों और लाइव एम्बुलेंस सेवाओं को जोड़ने वाला रीयल-टाइम आपातकालीन स्वास्थ्य नेटवर्क।',
    findNearbyHospitals: 'निकटतम अस्पताल खोजें',
    emergencySOSCall: 'इमरजेंसी कॉल करें (112)',
    liveHospitalNetwork: 'लाइव अस्पताल नेटवर्क',
    verifiedBeds: 'सत्यापित बेड उपलब्ध',
    bloodUnitsStock: 'रक्त यूनिट उपलब्ध',
    citiesCovered: 'भारत भर के प्रमुख शहर',
    quickEmergencyTitle: 'क्या आपको आपातकालीन चिकित्सा सहायता चाहिए?',
    quickEmergencyDesc: 'अस्पताल पहुँचने तक 10 मिनट के लिए गारंटीकृत ICU / वेंटिलेटर बेड तुरंत रिज़र्व करें।',
    reserveBedNow: 'अभी ICU बेड रिज़र्व करें',
    noBedsAvailable: 'कोई बेड उपलब्ध नहीं',

    // Problem Statement & Features
    problemWeSolveTitle: 'जिस समस्या का हम समाधान करते हैं',
    problemWeSolveDesc: 'भारत में मेडिकल इमरजेंसी के दौरान, परिवार अस्पताल बेड्स की उपलब्धता जानने में कीमती समय बर्बाद करते हैं। उचित जानकारी के अभाव में कई लोग अपनों को खो देते हैं।',
    goldenHourLost: 'गोल्डन आवर का नुकसान',
    goldenHourDesc: 'गंभीर चोट/ट्रॉमा के मरीजों के पास जान बचाने के लिए केवल 60 मिनट होते हैं। ज्यादातर समय अस्पताल खोजने में ही निकल जाता है।',
    noCentralSystem: 'केंद्रीय नेटवर्क का अभाव',
    noCentralDesc: 'इमरजेंसी में परिवार 10-15 अस्पतालों में कॉल करते हैं। रीयल-टाइम बेड डेटा जनता तक आसानी से नहीं पहुँच पाता।',
    bloodShortage: 'रक्त की कमी',
    bloodShortageDesc: 'भारत में हर साल 15 लाख यूनिट रक्त की कमी होती है। आपातकाल में रक्तदाता ढूंढना बेहद कठिन होता है।',
    howItHelps: 'स्वास्थ्य सेतु कैसे मदद करता है',
    howItHelpsDesc: 'एक एकीकृत रीयल-टाइम प्लेटफ़ॉर्म जो मरीजों, अस्पतालों और रक्तदाताओं को आपस में जोड़ता है।',
    smartSearch: 'स्मार्ट सर्च',
    smartSearchDesc: 'AI-पावर्ड खोज आपकी लोकेशन, बेड के प्रकार और उपलब्धता के आधार पर निकटतम अस्पताल खोजती है।',
    realTimeUpdates: 'रीयल-टाइम अपडेट्स',
    realTimeUpdatesDesc: 'Socket.io नेटवर्क द्वारा अस्पतालों से लाइव बेड और ब्लड डेटा का 24/7 प्रसारण।',
    blockchainVerifiedTitle: 'ब्लॉकचेन द्वारा सत्यापित',
    blockchainVerifiedDesc: 'Polygon ब्लॉकचेन पर सत्यापित अस्पताल डेटा। 100% पारदर्शी और भरोसेमंद।',
    routeOptimization: 'सटीक नेविगेशन एवं रास्ता',
    routeOptimizationDesc: 'मैप्स एकीकरण के साथ चुने गए अस्पताल तक पहुँचने का सबसे तेज़ रास्ता पाएँ।',
    donorNetwork: 'रक्तदाता नेटवर्क',
    donorNetworkDesc: 'आपातकाल के समय अपने आसपास पंजीकृत रक्तदाताओं से तुरंत संपर्क करें।',
    panIndiaCoverage: 'संपूर्ण भारत नेटवर्क',
    panIndiaCoverageDesc: 'भारत के सभी प्रमुख शहरों में उपलब्ध, जहाँ प्रतिदिन नए अस्पताल जुड़ रहे हैं।',
    howItWorks: 'यह कैसे काम करता है',
    howItWorksDesc: 'तीन आसान चरणों में सही अस्पताल और सहायता से जुड़ें।',
    shareLocation: '1. लोकेशन शेयर करें',
    shareLocationDesc: 'अपनी लोकेशन साझा करें या अपना पता मैन्युअली दर्ज करें।',
    selectEmergencyType: '2. इमरजेंसी का प्रकार चुनें',
    selectEmergencyTypeDesc: 'इमरजेंसी का प्रकार और आवश्यक बेड (ICU, सामान्य, वентिलेटर) चुनें।',
    getRecommendations: '3. तुरंत सिफारिशें पाएँ',
    getRecommendationsDesc: 'दूरी और उपलब्धता के आधार पर शीर्ष अस्पतालों और उनके रास्तों की सूची देखें।',
    everySecondCounts: 'आपातकाल में हर एक सेकंड कीमती है',
    everySecondCountsDesc: 'अस्पतालों में फोन करके समय बर्बाद न करें। स्वास्थ सेतु से तुरंत उपलब्ध बेड्स खोजें।',
    searchNow: 'अभी खोजें',
    registerAsDonor: 'रक्तदाता के रूप में पंजीकरण करें',

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
    registerAsBloodDonor: 'रक्तदाता के रूप में पंजीकरण करें',
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
  setLanguage: () => { },
  t: (key) => key
});

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('swasthya_lang') || 'en';
  });
  const [aiCache, setAiCache] = useState({});

  useEffect(() => {
    localStorage.setItem('swasthya_lang', language);
  }, [language]);

  const t = (key) => {
    if (!key) return '';
    const staticMatch = translations[language]?.[key] || translations['en']?.[key];
    if (staticMatch) return staticMatch;

    // Check AI dynamic cache
    const cacheKey = `${language}:${key}`;
    if (aiCache[cacheKey]) return aiCache[cacheKey];

    return key;
  };

  const tAsync = async (text, overrideLang) => {
    const targetLang = overrideLang || language;
    if (!text || targetLang === 'en') return text;

    const cacheKey = `${targetLang}:${text}`;
    if (aiCache[cacheKey]) return aiCache[cacheKey];

    try {
      const res = await apiCall('/api/translate', {
        method: 'POST',
        body: { text, targetLang }
      });
      if (res?.translatedText) {
        setAiCache(prev => ({ ...prev, [cacheKey]: res.translatedText }));
        return res.translatedText;
      }
    } catch (err) {
      console.warn('AI Translation warning:', err);
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tAsync }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
