import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Schedule from '../components/Schedule';
import NamePrompt from '../components/NamePrompt';
import InfoModal from '../components/InfoModal';
import { useSchedule } from '../hooks/useSchedule';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatDateShort } from '../lib/utils';
import { useToast } from '@/hooks/use-toast';

const Home: React.FC = () => {
  // User name from local storage
  const [userName, setUserName] = useLocalStorage<string>('userName', '');
  const [showNamePrompt, setShowNamePrompt] = useState<boolean>(false);
  
  // Info modal state
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  
  // Date state for navigation
  const [currentStartDate, setCurrentStartDate] = useState<Date>(new Date());
  const { toast } = useToast();
  
  // Format the date to ISO string for API
  const startDateStr = currentStartDate.toISOString().split('T')[0];
  
  // Fetch schedule data with auto-refresh and unique query key per date
  const { data: schedule, isLoading, error } = useSchedule(startDateStr);
  
  // Check for user name on mount
  useEffect(() => {
    if (!userName) {
      setShowNamePrompt(true);
    }
  }, [userName]);
  
  // Handle date navigation
  const goToPreviousWeek = () => {
    const newDate = new Date(currentStartDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentStartDate(newDate);
  };
  
  const goToNextWeek = () => {
    const newDate = new Date(currentStartDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentStartDate(newDate);
  };
  
  const goToToday = () => {
    setCurrentStartDate(new Date());
  };
  
  // Handle name saving
  const saveName = (name: string) => {
    setUserName(name);
    setShowNamePrompt(false);
  };
  
  // Generate date range display text
  const getDateRangeText = () => {
    const endDate = new Date(currentStartDate);
    endDate.setDate(endDate.getDate() + 6);
    
    return `${formatDateShort(startDateStr)} - ${formatDateShort(endDate.toISOString().split('T')[0])}`;
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
        
        {/* Schedule content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : schedule ? (
          <Schedule schedule={schedule} userName={userName} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Unable to load schedule. Please try again.</p>
          </div>
        )}
      </main>
      
      <Footer />
      
      {/* Modals */}
      <NamePrompt 
        isOpen={showNamePrompt} 
        onSave={saveName} 
      />
      
      <InfoModal 
        isOpen={showInfoModal} 
        onClose={() => setShowInfoModal(false)} 
      />
    </div>
  );
};

export default Home;
