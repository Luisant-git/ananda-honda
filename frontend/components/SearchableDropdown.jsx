import React, { useState, useEffect, useRef } from 'react';

const SearchableDropdown = ({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select", 
  required = false,
  label,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const selected = options.find(opt => opt.value === value);
    if (selected && !isOpen) {
      setSearchTerm(selected.label);
    } else if (!value && !isOpen) {
      setSearchTerm('');
    }
  }, [value, options, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        const selected = options.find(opt => opt.value === value);
        setSearchTerm(selected ? selected.label : '');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, options]);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option.value);
    setSearchTerm(option.label);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-brand-text-secondary mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={`w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent ${className}`}
        required={required}
      />
      {isOpen && (
        <div className="absolute z-50 w-full bg-white border border-brand-border rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option)}
                className="p-2 hover:bg-brand-hover cursor-pointer border-b border-brand-border last:border-b-0"
              >
                {option.label}
              </div>
            ))
          ) : (
            <div className="p-2 text-brand-text-secondary text-center">
              No options found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
