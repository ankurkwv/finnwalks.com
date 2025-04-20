import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate, getAvailableTimes } from '../lib/utils';
import { useToast } from '@/hooks/use-toast';
import { InsertSlot, Walker } from '@shared/schema';
import PhoneInput from 'react-phone-number-input/input';
import { useSearchWalkers } from '../hooks/useWalkers';
import { apiRequest } from '../lib/queryClient';

// Walker Autocomplete component
interface WalkerAutocompleteProps {
  searchTerm: string;
  onSelect: (walker: Walker) => void;
}

const WalkerAutocomplete: React.FC<WalkerAutocompleteProps> = ({ searchTerm, onSelect }) => {
  // State for controlling dropdown visibility
  const [showDropdown, setShowDropdown] = useState(false);
  // Track when a selection has been made
  const [selectionMade, setSelectionMade] = useState(false);
  // Ref for detecting clicks outside the component
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Debounced search query to limit API calls
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { data: walkers = [] } = useSearchWalkers(debouncedQuery);

  // Handle outside clicks to close the dropdown
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounce the search term and control dropdown visibility
  useEffect(() => {
    // Reset selection state when search term changes
    if (selectionMade) {
      setSelectionMade(false);
      return; // Skip this effect cycle after selection
    }
    
    // If search term is empty, hide dropdown
    if (!searchTerm || searchTerm.trim().length === 0) {
      setShowDropdown(false);
      return;
    }
    
    // Otherwise, set up debounce delay for search
    const timer = setTimeout(() => {
      setDebouncedQuery(searchTerm);
      // Show dropdown only if we have a search term
      setShowDropdown(searchTerm.trim().length > 0);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm, selectionMade]);
  
  // When walkers list changes, update dropdown visibility
  useEffect(() => {
    if (selectionMade) return;
    
    // Hide dropdown if we have no results
    if (walkers.length === 0 && showDropdown) {
      setShowDropdown(false);
    }
    // Show dropdown if we have results and a search term
    else if (walkers.length > 0 && searchTerm && searchTerm.trim().length > 0) {
      setShowDropdown(true);
    }
  }, [walkers, searchTerm, showDropdown, selectionMade]);

  // Handler for selection
  const handleSelection = (walker: Walker) => {
    setSelectionMade(true);    // Mark that a selection was made
    setShowDropdown(false);    // Hide dropdown immediately
    onSelect(walker);          // Call parent handler
  };
  
  // Don't render anything if dropdown should be hidden or no results
  if (!showDropdown || walkers.length === 0) {
    return null;
  }
  
  return (
    <div 
      ref={wrapperRef}
      className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto"
    >
      {walkers.map((walker: Walker) => (
        <div
          key={walker.name}
          className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex justify-between"
          onClick={() => handleSelection(walker)}
        >
          <span>{walker.name}</span>
          {walker.phone && <span className="text-gray-500 text-sm">{walker.phone}</span>}
        </div>
      ))}
    </div>
  );
};

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InsertSlot) => void;
  date: string;
  bookedTimes: string[];
  userName: string;
  onUpdateUserName: (name: string) => void;
  userPhone: string;
  onUpdateUserPhone: (phone: string) => void;
  isSubmitting: boolean;
}

const BookingModal: React.FC<BookingModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  date, 
  bookedTimes,
  userName,
  onUpdateUserName,
  userPhone,
  onUpdateUserPhone,
  isSubmitting
}) => {
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [name, setName] = useState<string>(userName);
  const [phone, setPhone] = useState<string>(userPhone || '');
  const { toast } = useToast();
  
  // Available times for this day
  const availableTimes = getAvailableTimes(bookedTimes);
  
  // Reset form and initialize name and phone when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTime('');
      setNotes('');
      setName(userName); // Initialize with the stored name
      setPhone(userPhone); // Initialize with the stored phone
    }
  }, [isOpen, userName, userPhone]);
  
  const handleSubmit = async () => {
    if (!selectedTime) {
      toast({
        title: "Error",
        description: "Please select a time",
        variant: "destructive",
      });
      return;
    }
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Your name is required",
        variant: "destructive",
      });
      return;
    }
    
    // Update the user name in localStorage if it changed
    if (name.trim() !== userName) {
      onUpdateUserName(name.trim());
    }
    
    // Update the user phone in localStorage if it changed
    if (phone !== userPhone) {
      onUpdateUserPhone(phone);
    }
    
    // Validate phone number if provided
    if (phone && !phone.startsWith('+')) {
      toast({
        title: "Phone Number Format",
        description: "Please use a valid phone number with country code or leave it blank",
        variant: "destructive",
      });
      return;
    }
    
    // If phone number is provided, update the walker database
    if (phone && phone.startsWith('+')) {
      try {
        // Update walker in database for future autocomplete
        await fetch(`/api/walkers/${encodeURIComponent(name.trim())}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone }),
          credentials: 'include',
        });
      } catch (error) {
        console.error('Failed to update walker information:', error);
        // Continue with booking even if walker update fails
      }
    }
    
    onSubmit({
      date,
      time: selectedTime,
      name: name.trim(),
      phone: phone || undefined,
      notes: notes.trim() || undefined
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book a Walk for Finn</DialogTitle>
          <DialogDescription>
            Schedule a time to take Finn for a walk.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-gray-700">{formatDate(date)}</p>
          
          <div className="space-y-2 relative">
            <Label htmlFor="walker-name">Your Name</Label>
            <Input
              id="walker-name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              autoComplete="off"
              className="w-full"
            />
            <WalkerAutocomplete
              searchTerm={name}
              onSelect={(walker) => {
                // When selecting from dropdown, update both name and phone if available
                setName(walker.name);
                if (walker.phone) {
                  setPhone(walker.phone);
                }
                // Force blur on the input to hide keyboard on mobile devices
                document.getElementById('walker-name')?.blur();
              }}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="walker-phone">Phone Number</Label>
            <div className="phone-input-container border rounded-md p-2 flex items-center bg-white">
              <PhoneInput
                id="walker-phone"
                placeholder="(555) 555-5555"
                value={phone}
                onChange={(value) => setPhone(value || '')}
                className="w-full focus:outline-none"
                country="US"
                style={{ border: 'none', width: '100%', height: '24px' }}
              />
            </div>
            <p className="text-xs text-gray-500">
              US numbers only. You'll receive confirmation texts.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time">Select Time</Label>
            <Select 
              value={selectedTime} 
              onValueChange={setSelectedTime}
            >
              <SelectTrigger id="time">
                <SelectValue placeholder="Select a time" />
              </SelectTrigger>
              <SelectContent>
                {availableTimes.length > 0 ? (
                  availableTimes.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No available times</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (where do you plan to take him, how long, etc?)</Label>
            <Textarea
              id="notes"
              placeholder="e.g., Taking him to Cato for an hour"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-24 resize-none"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!selectedTime || !name.trim() || isSubmitting}
          >
            {isSubmitting ? "Booking..." : "Book Walk"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
