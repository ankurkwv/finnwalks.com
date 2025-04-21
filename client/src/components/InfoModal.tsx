import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
              Thank you for helping us take care of Finn while we take care of
              Arlo. Finn needs a 30-minute walk twice a day. He may pull a bit, and he may also be a little sad that we're not joining, but he'll settle down quickly.
            </p>
          </div>

          <div>
            <p className="text-gray-600">
We'll use this schedule to keep track of who's walking Finn and when. 
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button className="w-full" onClick={onClose}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InfoModal;
