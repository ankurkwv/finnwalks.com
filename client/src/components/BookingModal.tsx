import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate, getAvailableTimes } from '../lib/utils';
import { useToast } from '@/hooks/use-toast';
import { InsertSlot } from '@shared/schema';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InsertSlot) => void;
  date: string;
  bookedTimes: string[];
  userName: string;
  onUpdateUserName: (name: string) => void;
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
  isSubmitting
}) => {
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [name, setName] = useState<string>(userName);
  const { toast } = useToast();
  
  // Available times for this day
  const availableTimes = getAvailableTimes(bookedTimes);
  
  // Reset form and initialize name when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTime('');
      setNotes('');
      setName(userName); // Initialize with the stored name
    }
  }, [isOpen, userName]);
  
  const handleSubmit = () => {
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
    
    onSubmit({
      date,
      time: selectedTime,
      name: name.trim(),
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
          
          <div className="space-y-2">
            <Label htmlFor="walker-name">Your Name</Label>
            <Input
              id="walker-name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
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
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="e.g., Taking him to the park"
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
