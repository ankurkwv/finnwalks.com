import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finn's Care Instructions</DialogTitle>
          <DialogDescription>
            Important information for walking Finn
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Walking</h4>
            <p className="text-gray-600">
              Finn needs a 30-minute walk twice a day. He pulls a bit at first but settles down after 5 minutes. 
              Always keep him on leash in unfenced areas.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Food & Water</h4>
            <p className="text-gray-600">
              Refill water bowl if empty. No treats during walks unless you're working on training.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Equipment</h4>
            <p className="text-gray-600">
              Leash and poop bags are hanging by the door. Please clean up after him!
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Emergency Contact</h4>
            <p className="text-gray-600">
              If anything happens, call Sam: (555) 123-4567 or Ankur: (555) 987-6543
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            className="w-full" 
            onClick={onClose}
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InfoModal;
