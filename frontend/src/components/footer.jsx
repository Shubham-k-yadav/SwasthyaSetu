import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t bg-gray-50 dark:bg-card text-gray-700 dark:text-gray-300 pb-24 md:pb-0">
      <div className="container mx-auto max-w-[1440px] px-4 sm:px-6 py-14">
        <div className="grid gap-10 md:grid-cols-12">

          {/* Brand Column */}
          <div className="md:col-span-4 space-y-4">
            <Link to="/" className="flex items-center gap-3 font-bold text-xl">
              <img 
                src="/879879879.png" 
                alt="SwasthyaSetu" 
                className="h-10 w-10 object-contain shrink-0" 
              />
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 dark:text-white tracking-tight text-lg leading-tight">
                  {t('appName')}
                </span>
                <span className="text-[10px] font-semibold text-gray-500 tracking-wide uppercase">
                  {t('appSubtitle')}
                </span>
              </div>
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-sm">
              {t('footerDesc')}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="h-8 w-8 rounded-lg bg-gray-200/80 dark:bg-gray-800 flex items-center justify-center text-gray-600 hover:text-red-600 transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="h-8 w-8 rounded-lg bg-gray-200/80 dark:bg-gray-800 flex items-center justify-center text-gray-600 hover:text-red-600 transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="h-8 w-8 rounded-lg bg-gray-200/80 dark:bg-gray-800 flex items-center justify-center text-gray-600 hover:text-red-600 transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="h-8 w-8 rounded-lg bg-gray-200/80 dark:bg-gray-800 flex items-center justify-center text-gray-600 hover:text-red-600 transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white">{t('quickLinks')}</h4>
            <ul className="space-y-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <li><Link to="/hospitals" className="hover:text-red-600 transition-colors">{t('navHospitals')}</Link></li>
              <li><Link to="/blood" className="hover:text-red-600 transition-colors">{t('navBlood')}</Link></li>
              <li><Link to="/emergency" className="hover:text-red-600 transition-colors">{t('navEmergency')}</Link></li>
              <li><Link to="/contact" className="hover:text-red-600 transition-colors">{t('contactUs')}</Link></li>
            </ul>
          </div>

          {/* For Facilities */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white">{t('facilityOnboarding')}</h4>
            <ul className="space-y-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <li><Link to="/register?type=hospital" className="hover:text-red-600 transition-colors">{t('registerHospital')}</Link></li>
              <li><Link to="/register?type=blood-bank" className="hover:text-red-600 transition-colors">{t('registerBloodBankLink')}</Link></li>
              <li><Link to="/register?type=ambulance" className="hover:text-red-600 transition-colors">{t('registerAmbulanceLink')}</Link></li>
              <li><Link to="/admin/login" className="hover:text-red-600 transition-colors">{t('adminLogin')}</Link></li>
            </ul>
          </div>

          {/* Emergency Helplines */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white">{t('emergencyHelplines')}</h4>
            <ul className="space-y-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <li>{t('ambulanceHelpline')}: <span className="text-red-600 font-bold">102</span></li>
              <li>{t('police100')}: <span className="text-red-600 font-bold">100</span></li>
              <li>{t('fire101')}: <span className="text-red-600 font-bold">101</span></li>
              <li>{t('nationalEmergency')}: <span className="text-red-600 font-bold">112</span></li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400 font-medium">
          <p>{t('allRightsReservedShort')}</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-gray-600 transition-colors">{t('privacyPolicy')}</a>
            <span>|</span>
            <a href="#" className="hover:text-gray-600 transition-colors">{t('termsConditions')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
