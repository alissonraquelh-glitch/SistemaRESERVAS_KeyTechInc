import React, { useState } from 'react';
import Hero from './Hero';
import BrandsSection from './BrandsSection';
import PublicCalendar from './PublicCalendar';
import WhatsAppModal from './WhatsAppModal';

export default function ClientPortal() {
  const [whatsAppModalData, setWhatsAppModalData] = useState({
    isOpen: false,
    dateStr: '',
    slot: '',
  });

  const handleOpenWhatsAppModal = (dateStr, slot) => {
    setWhatsAppModalData({
      isOpen: true,
      dateStr,
      slot,
    });
  };

  const handleCloseWhatsAppModal = () => {
    setWhatsAppModalData((prev) => ({ ...prev, isOpen: false }));
  };

  const handleScrollToCalendar = () => {
    const el = document.getElementById('agenda-publica');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fade-in">
      <Hero onScrollToCalendar={handleScrollToCalendar} />
      <BrandsSection />
      <PublicCalendar onOpenWhatsAppModal={handleOpenWhatsAppModal} />
      <WhatsAppModal
        isOpen={whatsAppModalData.isOpen}
        onClose={handleCloseWhatsAppModal}
        dateStr={whatsAppModalData.dateStr}
        slot={whatsAppModalData.slot}
      />
    </div>
  );
}
