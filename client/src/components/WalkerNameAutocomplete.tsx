import React, { useState, useEffect, useRef } from 'react';
import { Walker } from '@shared/schema';
import { Input } from '@/components/ui/input';

interface WalkerNameAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onWalkerSelect: (walker: Walker) => void;
  placeholder?: string;
  className?: string;
  walkers?: Walker[]; // Pre-fetched walkers
  isLoading?: boolean; // Loading state
}

const WalkerNameAutocomplete: React.FC<WalkerNameAutocompleteProps> = ({
  value,
  onChange,
  onWalkerSelect,
  placeholder = 'Enter your name',
  className = '',
  walkers = [],
  isLoading = false,
}) => {
  const [searchResults, setSearchResults] = useState<Walker[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Filter walkers client-side based on input value
  useEffect(() => {
    if (!value || value.length < 1) {
      setSearchResults([]);
      return;
    }

    const lowerCaseValue = value.toLowerCase();
    const filteredWalkers = walkers.filter(walker => 
      walker.name.toLowerCase().includes(lowerCaseValue)
    );
    
    setSearchResults(filteredWalkers);
  }, [value, walkers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current && 
        !autocompleteRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };

  // Handle selection from dropdown
  const handleSelect = (walker: Walker) => {
    onChange(walker.name);
    onWalkerSelect(walker);
    setIsOpen(false);
  };

  return (
    <div ref={autocompleteRef} className={`relative ${className}`}>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        className="w-full"
        data-testid="walker-name-input"
      />

      {/* Dropdown menu */}
      {isOpen && value && searchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {searchResults.map((walker) => (
            <div
              key={walker.name}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSelect(walker)}
            >
              {walker.name}
            </div>
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-3 top-3">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default WalkerNameAutocomplete;