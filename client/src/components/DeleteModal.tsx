import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime } from '../lib/utils';
import { DeleteSlot } from '@shared/schema';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: DeleteSlot) => void;
  slot: {
    date: string;
    time: string;
    name: string;
  } | null;
  isDeleting: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  slot,
  isDeleting
}) => {
  if (!slot) return null;
  
  const handleConfirm = () => {
    onConfirm({
      date: slot.date,
      time: slot.time,
      name: slot.name
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Walking Slot?</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel the walking slot on {formatDate(slot.date)} at {formatTime(slot.time)} for {slot.name}?
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="sm:mr-2"
            onClick={onClose}
            disabled={isDeleting}
          >
            No, Keep It
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Cancelling..." : "Yes, Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteModal;
