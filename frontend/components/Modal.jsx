import React from 'react';
import { CloseIcon } from './icons/Icons';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-brand-surface text-brand-text-primary rounded-lg shadow-2xl w-full max-w-lg mx-auto border border-brand-border"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-brand-border">
          <h3 className="text-xl font-semibold text-brand-text-primary">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-brand-text-secondary hover:text-brand-text-primary transition-colors"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;