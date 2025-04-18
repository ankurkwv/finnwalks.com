import React, { useState } from 'react';
import { WalkingSlot } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate, formatTimeRange, getWalkerColorIndex } from '../lib/utils';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import BookingModal from './BookingModal';
import DeleteModal from './DeleteModal';
import { useAddSlot, useDeleteSlot } from '../hooks/useSchedule';
import { useToast } from '@/hooks/use-toast';

interface ScheduleProps {
  schedule: Record<string, WalkingSlot[]>;
  userName: string;
}

const Schedule: React.FC<ScheduleProps> = ({ schedule, userName }) => {
  const [bookingDate, setBookingDate] = useState<string>('');
  const [deleteSlot, setDeleteSlot] = useState<WalkingSlot | null>(null);
  const { toast } = useToast();
  
  // Mutations for adding and deleting slots
  const addSlotMutation = useAddSlot();
  const deleteSlotMutation = useDeleteSlot();
  
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
        toast({
          title: "Success",
          description: "Walking slot booked successfully",
        });
        closeBookingModal();
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
                    const colorIndex = getWalkerColorIndex(slot.name);
                    
                    return (
                      <Card 
                        key={`${date}-${slot.time}`} 
                        className={`shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md overflow-hidden border-l-4 bg-opacity-30`}
                        style={{
                          borderLeftColor: [
                            '#a4c2f4', // finn-blue
                            '#b6d7a8', // finn-green
                            '#ffe599', // finn-yellow
                            '#d5a6bd', // finn-purple
                            '#ea9999'  // finn-red
                          ][colorIndex],
                          backgroundColor: [
                            'rgba(164, 194, 244, 0.3)',
                            'rgba(182, 215, 168, 0.3)',
                            'rgba(255, 229, 153, 0.3)',
                            'rgba(213, 166, 189, 0.3)',
                            'rgba(234, 153, 153, 0.3)'
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
    </>
  );
};

export default Schedule;
