import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAllTimeLeaderboard, useNextWeekLeaderboard, LeaderboardEntry } from '../hooks/useLeaderboard';
import { Badge } from '@/components/ui/badge';
import { TrophyIcon, CalendarIcon, PawPrintIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LeaderboardProps {
  currentDate: string;
}

interface WalkerStyle {
  bg: string;
  text: string;
  border: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ currentDate }) => {
  const [activeTab, setActiveTab] = useState<string>('all-time');
  
  // Fetch leaderboard data using React Query
  const { 
    data: allTimeData, 
    isLoading: isLoadingAllTime 
  } = useAllTimeLeaderboard();
  
  const { 
    data: nextWeekData, 
    isLoading: isLoadingNextWeek 
  } = useNextWeekLeaderboard(currentDate);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  // Style function to get the appropriate walker color
  const getWalkerStyle = (colorIndex: number): WalkerStyle => {
    const colors: WalkerStyle[] = [
      { bg: 'rgba(164, 194, 244, 0.2)', text: '#4285f4', border: '#a4c2f4' }, // blue
      { bg: 'rgba(182, 215, 168, 0.2)', text: '#34a853', border: '#b6d7a8' }, // green
      { bg: 'rgba(255, 229, 153, 0.2)', text: '#fbbc05', border: '#ffe599' }, // yellow
      { bg: 'rgba(213, 166, 189, 0.2)', text: '#a142f4', border: '#d5a6bd' }, // purple
      { bg: 'rgba(234, 153, 153, 0.2)', text: '#ea4335', border: '#ea9999' }, // red
      { bg: 'rgba(159, 197, 232, 0.2)', text: '#4285f4', border: '#9fc5e8' }, // light blue
      { bg: 'rgba(213, 213, 213, 0.2)', text: '#5f6368', border: '#d5d5d5' }, // gray
      { bg: 'rgba(249, 203, 156, 0.2)', text: '#fa7b17', border: '#f9cb9c' }, // orange
      { bg: 'rgba(180, 167, 214, 0.2)', text: '#7e57c2', border: '#b4a7d6' }, // lavender
      { bg: 'rgba(201, 218, 248, 0.2)', text: '#4285f4', border: '#c9daf8' }  // sky blue
    ];
    
    return colors[colorIndex % colors.length];
  };
  
  const renderLeaderboardItem = (entry: LeaderboardEntry, index: number) => {
    const style = getWalkerStyle(entry.colorIndex);
    
    return (
      <div 
        key={entry.name} 
        className="flex items-center justify-between p-3 mb-2 rounded-md transition-all duration-200"
        style={{ 
          backgroundColor: style.bg,
          borderLeft: `4px solid ${style.border}`
        }}
      >
        <div className="flex items-center">
          <span className="font-bold text-lg mr-3 text-gray-600 w-6">{index + 1}.</span>
          <span 
            className="font-semibold"
            style={{ color: style.text }}
          >
            {entry.name}
          </span>
        </div>
        <div className="flex items-center">
          <Badge 
            variant="outline" 
            className="flex items-center gap-1 font-medium"
            style={{ borderColor: style.border, color: style.text }}
          >
            <PawPrintIcon size={14} />
            {entry.totalWalks} {entry.totalWalks === 1 ? 'walk' : 'walks'}
          </Badge>
        </div>
      </div>
    );
  };
  
  return (
    <Card className="shadow-md border-t-4 border-finn-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-finn-primary">
          <TrophyIcon className="h-5 w-5" />
          Walker Leaderboard
        </CardTitle>
        <CardDescription>
          Our top dog walkers ranked by number of walks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all-time" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="all-time" className="flex items-center gap-1">
              <TrophyIcon className="h-4 w-4" />
              All-Time
            </TabsTrigger>
            <TabsTrigger value="next-week" className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              Next 7 Days
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all-time" className="space-y-1">
            {isLoadingAllTime ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : !allTimeData || allTimeData.length === 0 ? (
              <div className="py-10 text-center text-gray-500">
                <PawPrintIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No walking data available yet</p>
              </div>
            ) : (
              <div>
                {allTimeData.map((entry, index) => renderLeaderboardItem(entry, index))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="next-week" className="space-y-1">
            {isLoadingNextWeek ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : !nextWeekData || nextWeekData.length === 0 ? (
              <div className="py-10 text-center text-gray-500">
                <CalendarIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No walks scheduled for the next 7 days</p>
              </div>
            ) : (
              <div>
                {nextWeekData.map((entry, index) => renderLeaderboardItem(entry, index))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;