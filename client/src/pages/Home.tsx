import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Schedule from '../components/Schedule';
import InfoModal from '../components/InfoModal';
import Leaderboard from '../components/Leaderboard';
import { useSchedule } from '../hooks/useSchedule';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { 
  formatDateShort, 
  getCurrentDateET, 
  toDateString, 
  fromDateString 
} from '../lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '../hooks/use-mobile';

const Home: React.FC = () => {
  // User info from local storage - will be set/updated in the booking modal now
  const [userName, setUserName] = useLocalStorage<string>('userName', '');
  const [userPhone, setUserPhone] = useLocalStorage<string>('userPhone', '');
  
  // Info modal state
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  
  // Initialize with the current date in ET timezone as a string
  const [currentStartDateStr, setCurrentStartDateStr] = useState<string>(getCurrentDateET());
  const { toast } = useToast();
  
  // Check if mobile device for responsive layout
  const isMobile = useIsMobile();
  
  // Fetch schedule data with auto-refresh and unique query key per date
  const { data: schedule, isLoading, error } = useSchedule(currentStartDateStr);
  
  // Handle date navigation
  const goToPreviousWeek = () => {
    // Convert string date to Date object, modify it, then back to string
    const currentDate = fromDateString(currentStartDateStr);
    currentDate.setDate(currentDate.getDate() - 7);
    setCurrentStartDateStr(toDateString(currentDate));
  };
  
  const goToNextWeek = () => {
    // Convert string date to Date object, modify it, then back to string
    const currentDate = fromDateString(currentStartDateStr);
    currentDate.setDate(currentDate.getDate() + 7);
    setCurrentStartDateStr(toDateString(currentDate));
  };
  
  const goToToday = () => {
    // Reset to current date in ET timezone
    setCurrentStartDateStr(getCurrentDateET());
  };
  
  // Generate date range display text
  const getDateRangeText = () => {
    // Calculate end date (current + 6 days)
    const currentDate = fromDateString(currentStartDateStr);
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + 6);
    const endDateStr = toDateString(endDate);
    
    return `${formatDateShort(currentStartDateStr)} - ${formatDateShort(endDateStr)}`;
  };
  
  // Show error toast if fetch fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load schedule. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header
        onPrevWeek={goToPreviousWeek}
        onNextWeek={goToNextWeek}
        onToday={goToToday}
        onInfoClick={() => setShowInfoModal(true)}
      />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        {/* Current date range display */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-medium text-gray-700">
            {getDateRangeText()}
          </h2>
        </div>
        
        {/* Container with max width to make the layout more like mobile */}
        <div className="mx-auto max-w-md">
          {/* Schedule section */}
          <div className="space-y-6 mb-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
            ) : schedule ? (
              <Schedule 
                schedule={schedule} 
                userName={userName} 
                onUpdateUserName={setUserName}
                userPhone={userPhone}
                onUpdateUserPhone={setUserPhone}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Unable to load schedule. Please try again.</p>
              </div>
            )}
          </div>
          
          {/* Leaderboard component - always below schedule */}
          <div className="mt-6">
            <Leaderboard currentDate={currentStartDateStr} />
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Modals */}
      <InfoModal 
        isOpen={showInfoModal} 
        onClose={() => setShowInfoModal(false)} 
      />
    </div>
  );
};

export default Home;
