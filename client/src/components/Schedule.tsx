import React, { useState, useEffect } from 'react';
import { WalkingSlot } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate, formatTimeRange, getWalkerColorIndex, getWalkerColorIndexSync } from '../lib/utils';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import BookingModal from './BookingModal';
import DeleteModal from './DeleteModal';
import BookingAnimation from './BookingAnimation';
import { useAddSlot, useDeleteSlot } from '../hooks/useSchedule';
import { useToast } from '@/hooks/use-toast';

interface ScheduleProps {
  schedule: Record<string, WalkingSlot[]>;
  userName: string;
  onUpdateUserName: (name: string) => void;
}

const Schedule: React.FC<ScheduleProps> = ({ schedule, userName, onUpdateUserName }) => {
  const [bookingDate, setBookingDate] = useState<string>('');
  const [deleteSlot, setDeleteSlot] = useState<WalkingSlot | null>(null);
  const [colorIndices, setColorIndices] = useState<Record<string, number>>({});
  const [showAnimation, setShowAnimation] = useState(false);
  const { toast } = useToast();
  
  // Mutations for adding and deleting slots
  const addSlotMutation = useAddSlot();
  const deleteSlotMutation = useDeleteSlot();
  
  // Load color indices for all walker names in the schedule
  useEffect(() => {
    // Extract all unique walker names from the schedule
    const walkerNames = new Set<string>();
    
    Object.values(schedule).forEach(slots => {
      slots.forEach(slot => {
        if (slot.name) {
          walkerNames.add(slot.name);
        }
      });
    });
    
    // Fetch color indices for all walker names
    const fetchColors = async () => {
      const newIndices: Record<string, number> = {};
      
      // Convert Set to Array for iteration in older TypeScript/JS environments
      const nameArray = Array.from(walkerNames);
      
      for (const name of nameArray) {
        try {
          // Use the async version to get the actual index from the server
          const colorIndex = await getWalkerColorIndex(name);
          newIndices[name] = colorIndex;
        } catch (error) {
          console.error(`Error fetching color for ${name}:`, error);
        }
      }
      
      setColorIndices(prevIndices => ({
        ...prevIndices,
        ...newIndices
      }));
    };
    
    fetchColors();
  }, [schedule]);
  
  // Handle booking modal
  const openBookingModal = (date: string) => {
    setBookingDate(date);
  };
  
  const closeBookingModal = () => {
    setBookingDate('');
  };
  
  // Handle booking submission with optimistic update
  const handleBookSubmit = (data: any) => {
    // Use optimistic updates for immediate feedback
    addSlotMutation.mutate(data, {
      onSuccess: () => {
        // Close the booking modal
        closeBookingModal();
        
        // Show the animation instead of toast
        setShowAnimation(true);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to book slot",
          variant: "destructive",
        });
      }
    });
  };
  
  // Handle animation completion
  const handleAnimationComplete = () => {
    setShowAnimation(false);
  };
  
  // Handle delete modal
  const openDeleteModal = (slot: WalkingSlot) => {
    setDeleteSlot(slot);
  };
  
  const closeDeleteModal = () => {
    setDeleteSlot(null);
  };
  
  // Handle delete confirmation with optimistic update
  const handleDeleteConfirm = (data: any) => {
    // Use optimistic updates for immediate feedback
    deleteSlotMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Walking slot cancelled successfully",
        });
        closeDeleteModal();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to cancel slot",
          variant: "destructive",
        });
      }
    });
  };
  
  return (
    <>
      <div className="space-y-8">
        {Object.keys(schedule).map((date) => {
          const slots = schedule[date] || [];
          const bookedTimes = slots.map((slot) => slot.time);
          
          return (
            <div key={date} className="day-section" data-date={date}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  {formatDate(date)}
                </h3>
                <Button 
                  size="sm" 
                  onClick={() => openBookingModal(date)}
                  className="rounded-full"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Walk
                </Button>
              </div>
              
              {/* Time slots container */}
              <div className="space-y-3">
                {slots.length > 0 ? (
                  slots.map((slot) => {
                    // Use the cached color index if available, or use the sync version as fallback
                    const colorIndex = colorIndices[slot.name] !== undefined 
                      ? colorIndices[slot.name] 
                      : getWalkerColorIndexSync(slot.name);
                    
                    return (
                      <Card 
                        key={`${date}-${slot.time}`} 
                        className={`shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md overflow-hidden border-l-4 bg-opacity-30`}
                        style={{
                          borderLeftColor: [
                            '#a4c2f4', // blue
                            '#b6d7a8', // green
                            '#ffe599', // yellow
                            '#d5a6bd', // purple
                            '#ea9999', // red
                            '#9fc5e8', // light blue
                            '#d5d5d5', // gray
                            '#f9cb9c', // orange
                            '#b4a7d6', // lavender
                            '#c9daf8'  // sky blue
                          ][colorIndex],
                          backgroundColor: [
                            'rgba(164, 194, 244, 0.3)', // blue
                            'rgba(182, 215, 168, 0.3)', // green
                            'rgba(255, 229, 153, 0.3)', // yellow
                            'rgba(213, 166, 189, 0.3)', // purple
                            'rgba(234, 153, 153, 0.3)', // red
                            'rgba(159, 197, 232, 0.3)', // light blue
                            'rgba(213, 213, 213, 0.3)', // gray
                            'rgba(249, 203, 156, 0.3)', // orange
                            'rgba(180, 167, 214, 0.3)', // lavender
                            'rgba(201, 218, 248, 0.3)'  // sky blue
                          ][colorIndex]
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-gray-700 font-medium">
                                {formatTimeRange(slot.time)}
                              </div>
                              <div className="text-gray-900 font-semibold">
                                {slot.name}
                              </div>
                              {slot.notes && (
                                <div className="text-gray-600 text-sm mt-1">
                                  {slot.notes}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteModal(slot)}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="shadow-sm">
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-500">No walks scheduled yet</p>
                      <Button
                        variant="link"
                        onClick={() => openBookingModal(date)}
                        className="mt-2 text-finn-primary"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Schedule a walk
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Booking Modal */}
      <BookingModal
        isOpen={!!bookingDate}
        onClose={closeBookingModal}
        onSubmit={handleBookSubmit}
        date={bookingDate}
        bookedTimes={bookingDate ? (schedule[bookingDate] || []).map(s => s.time) : []}
        userName={userName}
        onUpdateUserName={onUpdateUserName}
        isSubmitting={addSlotMutation.isPending}
      />
      
      {/* Delete Modal */}
      <DeleteModal
        isOpen={!!deleteSlot}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        slot={deleteSlot}
        isDeleting={deleteSlotMutation.isPending}
      />

      {/* Booking Success Animation */}
      <BookingAnimation 
        isVisible={showAnimation}
        onComplete={handleAnimationComplete}
      />
    </>
  );
};

export default Schedule;
