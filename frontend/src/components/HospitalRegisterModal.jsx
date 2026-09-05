import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/language-context';

export function HospitalRegisterModal({ children }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleClick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    navigate('/register?type=hospital');
  };

  if (children) {
    return React.cloneElement(children, {
      onClick: handleClick
    });
  }

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="sm"
      className="gap-2 border-primary/30 text-primary hover:bg-primary/10 font-semibold text-xs whitespace-nowrap"
    >
      <Building2 className="h-4 w-4" />
      {t('registerHospital')}
    </Button>
  );
}

export default HospitalRegisterModal;
