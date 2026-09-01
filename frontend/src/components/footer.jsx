import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { HospitalRegisterModal } from '@/components/HospitalRegisterModal';

export function Footer() {
  return (
    <footer className="border-t bg-gray-50 dark:bg-card text-gray-700 dark:text-gray-300 pb-24 md:pb-0">
      <div className="container mx-auto max-w-[1440px] px-4 sm:px-6 py-14">
        <div className="grid gap-10 md:grid-cols-12">

          {/* Brand Column */}
          <div className="md:col-span-4 space-y-4">
            <Link to="/" className="flex items-center gap-3 font-bold text-xl">
              <div className="h-9 w-9 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                S
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-gray-900 dark:text-white tracking-tight text-lg leading-tight">
                  SwasthyaSetu
                </span>
                <span className="text-[10px] font-semibold text-gray-500 tracking-wide uppercase">
                  Emergency Healthcare Network
                </span>
              </div>
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-sm">
              SwasthyaSetu is India's unified real-time emergency healthcare network powering bed availability, blood stocks, and emergency dispatch.
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
            <h4 className="font-bold text-sm text-gray-900 dark:text-white">Quick Links</h4>
            <ul className="space-y-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <li><Link to="/hospitals" className="hover:text-red-600 transition-colors">Hospitals & Beds</Link></li>
              <li><Link to="/blood" className="hover:text-red-600 transition-colors">Blood Availability</Link></li>
              <li><Link to="/emergency" className="hover:text-red-600 transition-colors">Emergency SOS</Link></li>
              <li><Link to="/contact" className="hover:text-red-600 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* For Hospitals */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white">For Hospitals</h4>
            <ul className="space-y-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <li>
                <HospitalRegisterModal>
                  <button className="hover:text-red-600 transition-colors text-left">Register Hospital</button>
                </HospitalRegisterModal>
              </li>
              <li><Link to="/admin/login" className="hover:text-red-600 transition-colors">Admin Login</Link></li>
              <li><Link to="/admin" className="hover:text-red-600 transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Emergency Helplines */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white">Emergency Helplines</h4>
            <ul className="space-y-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <li>Ambulance: <span className="text-red-600 font-bold">102</span></li>
              <li>Police: <span className="text-red-600 font-bold">100</span></li>
              <li>Fire: <span className="text-red-600 font-bold">101</span></li>
              <li>National Emergency: <span className="text-red-600 font-bold">112</span></li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400 font-medium">
          <p>© 2026 SwasthyaSetu. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
            <span>|</span>
            <a href="#" className="hover:text-gray-600 transition-colors">Terms & Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
