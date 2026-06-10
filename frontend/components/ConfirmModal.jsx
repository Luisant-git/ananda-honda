import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "bg-brand-accent hover:bg-brand-accent-hover text-white",
  isDestructive = false
}) => {

  const actualConfirmColor = isDestructive ? "bg-red-600 hover:bg-red-700 text-white" : confirmColor;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-2">
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-3 rounded-full ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-brand-surface text-brand-accent'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-brand-text-primary mb-1">{title}</h4>
            <p className="text-brand-text-secondary">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
          <button 
            onClick={onClose} 
            className="px-6 py-2 rounded-lg border border-brand-border bg-white text-brand-text-secondary font-bold hover:bg-brand-hover transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className={`px-6 py-2 rounded-lg font-bold transition-colors ${actualConfirmColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
