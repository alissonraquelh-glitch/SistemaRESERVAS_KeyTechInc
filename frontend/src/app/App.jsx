import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ClientPortal from '../features/public-booking/ClientPortal';
import StaffPortal from '../features/staff/StaffPortal';
import LoginModal from '../features/auth/LoginModal';
import { useAuth } from '../context/AuthContext';

export default function App() {
  const [currentView, setCurrentView] = useState('client'); // 'client' | 'employee'
  const { isAuthenticated, setIsLoginModalOpen } = useAuth();

  const handleSwitchToEmployee = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
    } else {
      setCurrentView('employee');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
      <Header currentView={currentView} setCurrentView={setCurrentView} />

      <div className="flex-1">
        {currentView === 'client' ? (
          <ClientPortal />
        ) : (
          <StaffPortal />
        )}
      </div>

      <Footer onSwitchToEmployee={handleSwitchToEmployee} />
      <LoginModal />
    </div>
  );
}
