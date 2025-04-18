import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  isSubmitting: boolean;
}

const BookingModal: React.FC<BookingModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  date, 
  bookedTimes,
  userName,
  isSubmitting
}) => {
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const { toast } = useToast();
  
  // Available times for this day
  const availableTimes = getAvailableTimes(bookedTimes);
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTime('');
      setNotes('');
    }
  }, [isOpen]);
  
  const handleSubmit = () => {
    if (!selectedTime) {
      toast({
        title: "Error",
        description: "Please select a time",
        variant: "destructive",
      });
      return;
    }
    
    if (!userName) {
      toast({
        title: "Error",
        description: "Your name is required",
        variant: "destructive",
      });
      return;
    }
    
    onSubmit({
      date,
      time: selectedTime,
      name: userName,
      notes: notes.trim() || undefined
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book a Walking Slot</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-gray-700">{formatDate(date)}</p>
          
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
            disabled={!selectedTime || isSubmitting}
          >
            {isSubmitting ? "Booking..." : "Book Walking Slot"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
