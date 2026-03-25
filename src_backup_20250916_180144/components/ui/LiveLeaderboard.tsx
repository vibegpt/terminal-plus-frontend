import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { shoppingTrailService } from '../../services/shoppingTrailService';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar?: string;
  completion_percentage: number;
  total_spent: number;
  average_rating: number;
  rank: number;
  isCurrentUser?: boolean;
}

interface LiveLeaderboardProps {
  compact?: boolean;
  maxEntries?: number;
  className?: string;
}

export const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({
  compact = false,
  maxEntries = 5,
  className
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        // This would call your actual leaderboard API
        const mockData: LeaderboardEntry[] = [
          {
            user_id: '1',
            username: 'TravelPro',
            completion_percentage: 95,
            total_spent: 1250,
            average_rating: 4.8,
            rank: 1,
            avatar: '👑'
          },
          {
            user_id: '2',
            username: 'ShopMaster',
            completion_percentage: 87,
            total_spent: 980,
            average_rating: 4.6,
            rank: 2,
            avatar: '🛍️'
          },
          {
            user_id: '3',
            username: 'TerminalExplorer',
            completion_percentage: 82,
            total_spent: 750,
            average_rating: 4.4,
            rank: 3,
            avatar: '✈️'
          },
          {
            user_id: '4',
            username: 'You',
            completion_percentage: 65,
            total_spent: 420,
            average_rating: 4.2,
            rank: 4,
            isCurrentUser: true,
            avatar: '🎯'
          },
          {
            user_id: '5',
            username: 'BudgetTraveler',
            completion_percentage: 58,
            total_spent: 320,
            average_rating: 4.0,
            rank: 5,
            avatar: '💰'
          }
        ];
        
        setLeaderboard(mockData.slice(0, maxEntries));
      } catch (err) {
        setError('Failed to load leaderboard');
        console.error('Leaderboard error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    
    return () => clearInterval(interval);
  }, [maxEntries]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center text-red-400 text-sm', className)}>
        {error}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white text-sm">
          {compact ? 'Top 5' : 'Live Leaderboard'}
        </h3>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span className="text-xs text-white/60">LIVE</span>
        </div>
      </div>
      
      <div className="space-y-2">
        {leaderboard.map((entry) => (
          <div
            key={entry.user_id}
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg transition-all duration-200',
              entry.isCurrentUser 
                ? 'bg-white/20 border border-white/30' 
                : 'bg-white/5 hover:bg-white/10'
            )}
          >
            {/* Rank */}
            <div className={cn(
              'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
              entry.rank === 1 ? 'bg-yellow-500 text-black' :
              entry.rank === 2 ? 'bg-gray-400 text-black' :
              entry.rank === 3 ? 'bg-amber-600 text-white' :
              'bg-white/20 text-white'
            )}>
              {entry.rank}
            </div>
            
            {/* Avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">
              {entry.avatar}
            </div>
            
            {/* User info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'font-medium text-sm truncate',
                  entry.isCurrentUser ? 'text-white' : 'text-white/90'
                )}>
                  {entry.username}
                </span>
                {entry.isCurrentUser && (
                  <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                    YOU
                  </span>
                )}
              </div>
              
              {!compact && (
                <div className="flex items-center gap-4 text-xs text-white/70 mt-1">
                  <span>{entry.completion_percentage}% complete</span>
                  <span>${entry.total_spent}</span>
                  <span>⭐ {entry.average_rating}</span>
                </div>
              )}
            </div>
            
            {/* Completion bar for compact view */}
            {compact && (
              <div className="flex-shrink-0 w-16">
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-500"
                    style={{ width: `${entry.completion_percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {!compact && (
        <div className="text-center">
          <button className="text-xs text-white/60 hover:text-white/80 transition-colors">
            View Full Rankings →
          </button>
        </div>
      )}
    </div>
  );
};
