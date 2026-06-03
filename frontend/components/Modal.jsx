import React from 'react';
import { CloseIcon } from './icons/Icons';

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-lg", maxHeight = "max-h-[85vh]" }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className={`bg-brand-surface text-brand-text-primary rounded-lg shadow-2xl w-full ${maxWidth} mx-auto border border-brand-border flex flex-col overflow-hidden ${maxHeight}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-brand-border shrink-0">
          <h3 className="text-xl font-semibold text-brand-text-primary">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-brand-text-secondary hover:text-brand-text-primary transition-colors"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;