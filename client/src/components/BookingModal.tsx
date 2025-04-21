import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatDate,
  getAvailableTimes,
  capitalizeFullName,
} from "../lib/utils";
import { useToast } from "@/hooks/use-toast";
import { InsertSlot, Walker } from "@shared/schema";
import PhoneInput from "react-phone-number-input/input";
import WalkerNameAutocomplete from "./WalkerNameAutocomplete";

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
  isSubmitting,
}) => {
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [name, setName] = useState<string>(userName);
  const [phone, setPhone] = useState<string>(userPhone || "");
  const [isUpdatingWalker, setIsUpdatingWalker] = useState<boolean>(false);
  const [allWalkers, setAllWalkers] = useState<Walker[]>([]);
  const [isLoadingWalkers, setIsLoadingWalkers] = useState<boolean>(false);
  const { toast } = useToast();

  // Available times for this day
  const availableTimes = getAvailableTimes(bookedTimes);

  // Pre-fetch all walkers when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoadingWalkers(true);
      fetch("/api/walkers/search")
        .then((res) => res.json())
        .then((walkers) => {
          setAllWalkers(walkers || []);
        })
        .catch((err) => {
          console.error("Error pre-fetching walkers:", err);
        })
        .finally(() => {
          setIsLoadingWalkers(false);
        });
    }
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset state values
      setSelectedTime("");
      setNotes("");
      setName(userName); // Initialize with the stored name
      setPhone(userPhone); // Initialize with the stored phone
    }
  }, [isOpen, userName, userPhone]);
  
  // Focus appropriate element after the modal opens
  // This is separated to reduce complexity and potential timing issues
  useEffect(() => {
    // Only run this effect when the modal is actually open
    if (!isOpen) return;
    
    // Give time for the modal to fully render and mount its contents
    const timeoutId = setTimeout(() => {
      // If user already has info in localStorage, focus on time selection
      if (userName && userName.trim() !== '') {
        console.log("Attempting to focus time selector");
        const timeSelect = document.getElementById("time");
        if (timeSelect) {
          console.log("Found time selector, clicking it");
          timeSelect.click();
        } else {
          console.log("Time selector not found");
        }
      }
    }, 300); // Longer delay to ensure modal is completely rendered
    
    // Clean up timeout
    return () => clearTimeout(timeoutId);
  }, [isOpen, userName]);

  // Handle when a walker is selected from autocomplete
  const handleWalkerSelect = (walker: Walker) => {
    setName(walker.name);
    if (walker.phone) {
      setPhone(walker.phone);
    }

    // Auto-focus on time picker after name selection
    const timeSelect = document.getElementById("time");
    if (timeSelect) {
      setTimeout(() => {
        timeSelect.click();
      }, 100); // Small delay to ensure UI has updated
    }
  };

  // Handle time selection and auto-focus notes
  const handleTimeSelection = (value: string) => {
    setSelectedTime(value);

    // Auto-focus on notes field after time selection
    setTimeout(() => {
      const notesField = document.getElementById("notes");
      if (notesField) {
        notesField.focus();
      }
    }, 100); // Small delay to ensure UI has updated
  };

  // Update walker info in database
  const updateWalkerInfo = async () => {
    if (!name.trim()) return;

    try {
      setIsUpdatingWalker(true);

      // Properly capitalize the name
      const capitalizedName = capitalizeFullName(name.trim());

      // Call the API to update walker info with capitalized name
      await fetch("/api/walkers/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: capitalizedName,
          phone: phone || undefined,
        }),
      });
    } catch (error) {
      console.error("Error updating walker information:", error);
    } finally {
      setIsUpdatingWalker(false);
    }
  };

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

    // Capitalize the name properly
    const capitalizedName = capitalizeFullName(name.trim());

    // Update the user name in localStorage if it changed (with proper capitalization)
    if (capitalizedName !== userName) {
      onUpdateUserName(capitalizedName);
    }

    // Update the user phone in localStorage if it changed
    if (phone !== userPhone) {
      onUpdateUserPhone(phone);
    }

    // Validate phone number if provided
    if (phone && !phone.startsWith("+")) {
      toast({
        title: "Phone Number Format",
        description:
          "Please use a valid phone number with country code or leave it blank",
        variant: "destructive",
      });
      return;
    }

    // Update walker info in database with properly capitalized name
    await updateWalkerInfo();

    // Submit the booking with the capitalized name
    onSubmit({
      date,
      time: selectedTime,
      name: capitalizedName,
      phone: phone || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{formatDate(date)}</DialogTitle>
        </DialogHeader>

        <form autoComplete="on" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="space-y-2 py-4">
            <div className="space-y-2">
              <Label htmlFor="walker-name">Your Name</Label>
              <WalkerNameAutocomplete
                value={name}
                onChange={setName}
                onWalkerSelect={handleWalkerSelect}
                placeholder="Start typing your name..."
                className="w-full"
                walkers={allWalkers}
                isLoading={isLoadingWalkers}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="walker-phone">Phone Number</Label>
              <div className="phone-input-container border rounded-md p-2 flex items-center bg-white">
                <PhoneInput
                  id="walker-phone"
                  name="tel"
                  autoComplete="tel"
                  placeholder="(555) 555-5555"
                  value={phone}
                  onChange={(value) => {
                    setPhone(value || "");
                    
                    // If phone was empty and now has a value (likely from autofill)
                    // then focus on the time selector
                    if (!phone && value) {
                      setTimeout(() => {
                        const timeSelect = document.getElementById("time");
                        if (timeSelect) {
                          timeSelect.click();
                        }
                      }, 100);
                    }
                  }}
                  className="w-full focus:outline-none"
                  country="US"
                  style={{ border: "none", width: "100%", height: "24px" }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Select Time</Label>
              <Select value={selectedTime} onValueChange={handleTimeSelection}>
                <SelectTrigger id="time" className="h-12 text-base">
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimes.length > 0 ? (
                    availableTimes.map((time) => (
                      <SelectItem 
                        key={time.value} 
                        value={time.value} 
                        className="py-3 text-base"
                      >
                        {time.label}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled className="py-3 text-base">
                      No available times
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">
                Notes (where do you plan to take him, how long, etc?)
              </Label>
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
              type="submit"
              className="w-full py-6 text-base"
              disabled={
                !selectedTime || !name.trim() || isSubmitting || isUpdatingWalker
              }
            >
              {isSubmitting || isUpdatingWalker ? "Booking..." : "Book Walk"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
