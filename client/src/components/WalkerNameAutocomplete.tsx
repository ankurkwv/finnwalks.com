import React, { useState, useEffect, useRef } from 'react';
import { Walker } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { apiRequest } from '../lib/queryClient';

interface WalkerNameAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onWalkerSelect: (walker: Walker) => void;
  placeholder?: string;
  className?: string;
}

const WalkerNameAutocomplete: React.FC<WalkerNameAutocompleteProps> = ({
  value,
  onChange,
  onWalkerSelect,
  placeholder = 'Enter your name',
  className = '',
}) => {
  const [searchResults, setSearchResults] = useState<Walker[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState(value);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Search for walkers when input value changes
  useEffect(() => {
    const fetchWalkers = async () => {
      if (!debouncedSearch || debouncedSearch.length < 1) {
        setSearchResults([]);
        return;
      }

      try {
        setLoading(true);
        const walkers = await apiRequest<Walker[]>(`/api/walkers/search?q=${encodeURIComponent(debouncedSearch)}`);
        setSearchResults(walkers || []);
      } catch (error) {
        console.error('Error searching walkers:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWalkers();
  }, [debouncedSearch]);

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

  // Effect for debouncing input value
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set a new timeout for debounce
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300); // 300ms debounce delay
    
    // Cleanup on unmount or when value changes
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [value]);

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
      {loading && (
        <div className="absolute right-3 top-3">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default WalkerNameAutocomplete;