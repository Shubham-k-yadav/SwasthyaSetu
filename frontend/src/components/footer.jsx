import { Link } from 'react-router-dom';
import { Activity, Heart } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t bg-secondary/30">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="SwasthyaSetu Logo" className="h-9 w-9 rounded-lg shadow-sm object-cover" />
              <span className="text-xl font-bold tracking-tight">
                Swasthya<span className="text-primary">Setu</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t('footerDesc')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">{t('quickLinks')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/hospitals" className="hover:text-foreground transition-colors">{t('navHospitals')}</Link></li>
              <li><Link to="/blood" className="hover:text-foreground transition-colors">{t('navBlood')}</Link></li>
              <li><Link to="/emergency" className="hover:text-foreground transition-colors">{t('navEmergency')}</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">{t('navContact')}</Link></li>
            </ul>
          </div>

          {/* For Hospitals */}
          <div>
            <h4 className="font-semibold mb-4">{t('forHospitals')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/admin/login" className="hover:text-foreground transition-colors">{t('adminLogin')}</Link></li>
              <li><Link to="/admin" className="hover:text-foreground transition-colors">{t('dashboard')}</Link></li>
            </ul>
          </div>

          {/* Emergency */}
          <div>
            <h4 className="font-semibold mb-4">{t('emergencyHelplines')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Ambulance: <span className="text-primary font-semibold">102</span></li>
              <li>Police: <span className="text-primary font-semibold">100</span></li>
              <li>Fire: <span className="text-primary font-semibold">101</span></li>
              <li>National Emergency: <span className="text-primary font-semibold">112</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 SwasthyaSetu. {t('builtWith')} <Heart className="inline h-3 w-3 text-primary" fill="currentColor" />
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/contact" className="hover:text-foreground transition-colors">{t('navContact')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
