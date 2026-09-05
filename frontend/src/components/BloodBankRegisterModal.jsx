import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BloodBankRegisterModal({ children }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    navigate('/register?type=blood-bank');
  };

  if (children) {
    return React.cloneElement(children, {
      onClick: handleClick
    });
  }

  return (
    <Button
      onClick={handleClick}
      className="gap-2 font-bold bg-red-600 hover:bg-red-700 text-white shadow-md"
    >
      <Droplets className="h-4 w-4" />
      Register Blood Bank
    </Button>
  );
}

export default BloodBankRegisterModal;
