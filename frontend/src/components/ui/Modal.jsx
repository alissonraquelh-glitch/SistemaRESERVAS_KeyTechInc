import React, { useEffect, useRef } from 'react';

export default function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-lg' }) {
  const modalRef = useRef(null);

  // Cerrar con tecla Escape y bloquear scroll del body
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-3xl w-full ${maxWidth} p-6 sm:p-8 shadow-2xl relative fade-in border border-gray-100 my-8`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>

        {title && (
          <div className="mb-6 pr-8">
            <h3 id="modal-title" className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {title}
            </h3>
            {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
        )}

        <div>{children}</div>
      </div>
    </div>
  );
}
