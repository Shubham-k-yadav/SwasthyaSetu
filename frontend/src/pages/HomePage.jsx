import React, { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PlatformStatusBanner } from '@/components/PlatformStatusBanner';
import { systemApi } from '@/lib/api';
import { MobileHomeView, TabletHomeView, DesktopHomeView } from '@/components/home';

export default function HomePage() {
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    systemApi.getSystemStatus()
      .then(res => setSystemStatus(res))
      .catch(() => setSystemStatus({ verifiedHospitalsCount: 0, verifiedBloodBanksCount: 0, verifiedAmbulancesCount: 0 }));
  }, []);

  const hospCount = systemStatus?.verifiedHospitalsCount || 0;
  const bloodCount = systemStatus?.verifiedBloodBanksCount || 0;
  const ambCount = systemStatus?.verifiedAmbulancesCount || 0;

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-background">
      <Header />
      <PlatformStatusBanner />

      <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">
        {/* Mobile View (< 768px) */}
        <MobileHomeView 
          hospCount={hospCount} 
          bloodCount={bloodCount} 
          ambCount={ambCount} 
        />

        {/* Tablet View (768px - 1023px) */}
        <TabletHomeView 
          hospCount={hospCount} 
          bloodCount={bloodCount} 
          ambCount={ambCount} 
        />

        {/* Desktop View (>= 1024px) */}
        <DesktopHomeView 
          hospCount={hospCount} 
          bloodCount={bloodCount} 
          ambCount={ambCount} 
        />
      </main>

      <Footer />
    </div>
  );
}
