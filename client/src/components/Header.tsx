import React from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import finnImage from "../assets/finn.webp";
import { TrophyIcon, InfoIcon } from "lucide-react";

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
  onInfoClick,
}) => {
  const [userName] = useLocalStorage<string>("userName", "");

  // Function to scroll to leaderboard section
  const scrollToLeaderboard = () => {
    // Add a hash to the URL to trigger our highlight animation
    window.location.hash = "leaderboard";

    // Scroll to the leaderboard element
    const leaderboardElement = document.querySelector(".leaderboard-section");
    if (leaderboardElement) {
      leaderboardElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full overflow-hidden mr-3 border-2 border-finn-primary">
            <img
              src={finnImage}
              alt="Finn the dog"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Finn Walk Schedule
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          {/* User name display */}
          {userName && (
            <span className="hidden md:inline-block text-sm font-medium text-gray-600">
              Hi, {userName}
            </span>
          )}

          {/* Trophy button for leaderboard */}
          <button
            onClick={scrollToLeaderboard}
            className="p-2 text-finn-primary hover:bg-blue-50 rounded-full transition-colors"
            aria-label="View Leaderboard"
            title="View Leaderboard"
          >
            <TrophyIcon className="h-6 w-6" />
          </button>

          {/* Info button */}
          <button
            onClick={onInfoClick}
            className="p-2 text-finn-primary hover:bg-blue-50 rounded-full transition-colors"
            aria-label="Care Instructions"
            title="Care Instructions"
          >
            <InfoIcon className="h-6 w-6" />
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Previous 7 days
          </button>

          <button
            onClick={onToday}
            className="border border-finn-primary bg-white hover:bg-blue-50 text-finn-primary font-medium py-1 px-4 rounded text-sm block"
            aria-label="Jump to today's date"
          >
            Today
          </button>

          <button
            onClick={onNextWeek}
            className="text-finn-primary hover:text-blue-700 py-1 px-2 rounded flex items-center text-sm"
          >
            Next 7 days
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
