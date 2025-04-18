import React from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface HeaderProps {
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onInfoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onPrevWeek, 
  onNextWeek, 
  onToday, 
  onInfoClick 
}) => {
  const [userName] = useLocalStorage<string>('userName', '');

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-finn-primary text-white flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">CharlieWalks</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* User name display */}
          {userName && (
            <span className="hidden md:inline-block text-sm font-medium text-gray-600">
              Hi, {userName}
            </span>
          )}
          
          {/* Info button */}
          <button 
            onClick={onInfoClick}
            className="p-2 text-finn-primary hover:bg-blue-50 rounded-full transition-colors"
            aria-label="Care Instructions"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Navigation controls */}
      <div className="bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <button 
            onClick={onPrevWeek}
            className="text-finn-primary hover:text-blue-700 py-1 px-2 rounded flex items-center text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous 7 days
          </button>
          
          <button 
            onClick={onToday}
            className="bg-finn-primary hover:bg-blue-600 text-white py-1 px-4 rounded text-sm"
          >
            Today
          </button>
          
          <button 
            onClick={onNextWeek}
            className="text-finn-primary hover:text-blue-700 py-1 px-2 rounded flex items-center text-sm"
          >
            Next 7 days
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
