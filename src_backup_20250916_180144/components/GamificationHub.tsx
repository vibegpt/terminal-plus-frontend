import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Trophy, 
  Star, 
  Target, 
  TrendingUp, 
  Award, 
  Zap,
  Heart,
  MapPin,
  Coffee,
  ShoppingBag,
  Plane,
  Clock,
  Users,
  Crown,
  Medal,
  Gift,
  Sparkles,
  CheckCircle,
  Lock,
  Unlock,
  BarChart3,
  Calendar,
  Flag,
  Compass
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { 
  Achievement, 
  LeaderboardEntry, 
  UserProgress, 
  Reward,
  GamificationStats,
  Quest
} from '@/types/gamification.types';

interface GamificationHubProps {
  userId: string;
  airportCode: string;
  onAchievementUnlocked?: (achievement: Achievement) => void;
  onRewardClaimed?: (reward: Reward) => void;
  className?: string;
}

export const GamificationHub: React.FC<GamificationHubProps> = ({
  userId,
  airportCode,
  onAchievementUnlocked,
  onRewardClaimed,
  className = ''
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'achievements' | 'leaderboard' | 'quests' | 'rewards'>('achievements');
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration
  const mockUserProgress: UserProgress = {
    userId,
    level: 8,
    experience: 2450,
    experienceToNextLevel: 3000,
    totalPoints: 1250,
    achievementsUnlocked: 12,
    totalAchievements: 25,
    currentStreak: 5,
    longestStreak: 12,
    checkins: 45,
    reviews: 23,
    vibesUsed: 8,
    uniqueAmenities: 18,
    rank: 3,
    badges: ['first_checkin', 'reviewer', 'explorer', 'vibe_master'],
    lastActivity: new Date()
  };

  const mockAchievements: Achievement[] = [
    {
      id: 'first_checkin',
      title: 'First Steps',
      description: 'Complete your first check-in at an airport amenity',
      icon: 'MapPin',
      category: 'checkin',
      rarity: 'common',
      points: 50,
      isUnlocked: true,
      unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      progress: 1,
      maxProgress: 1
    },
    {
      id: 'reviewer',
      title: 'Helpful Reviewer',
      description: 'Write 10 helpful reviews for airport amenities',
      icon: 'Star',
      category: 'review',
      rarity: 'rare',
      points: 200,
      isUnlocked: true,
      unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      progress: 10,
      maxProgress: 10
    },
    {
      id: 'explorer',
      title: 'Terminal Explorer',
      description: 'Visit 15 different amenities across terminals',
      icon: 'Compass',
      category: 'exploration',
      rarity: 'epic',
      points: 300,
      isUnlocked: false,
      progress: 12,
      maxProgress: 15
    },
    {
      id: 'vibe_master',
      title: 'Vibe Master',
      description: 'Use all 6 different vibes in your journey planning',
      icon: 'Heart',
      category: 'vibe',
      rarity: 'legendary',
      points: 500,
      isUnlocked: false,
      progress: 4,
      maxProgress: 6
    },
    {
      id: 'streak_master',
      title: 'Consistency King',
      description: 'Maintain a 7-day activity streak',
      icon: 'TrendingUp',
      category: 'streak',
      rarity: 'rare',
      points: 250,
      isUnlocked: false,
      progress: 5,
      maxProgress: 7
    }
  ];

  const mockLeaderboard: LeaderboardEntry[] = [
    {
      userId: 'user_1',
      username: 'Sarah M.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      score: 1850,
      rank: 1,
      category: 'overall',
      period: 'weekly',
      stats: {
        checkins: 67,
        reviews: 34,
        averageRating: 4.8,
        uniqueAmenities: 28,
        vibesUsed: 6
      }
    },
    {
      userId: 'user_2',
      username: 'Alex K.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      score: 1620,
      rank: 2,
      category: 'overall',
      period: 'weekly',
      stats: {
        checkins: 54,
        reviews: 29,
        averageRating: 4.6,
        uniqueAmenities: 22,
        vibesUsed: 5
      }
    },
    {
      userId,
      username: 'You',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
      score: 1250,
      rank: 3,
      category: 'overall',
      period: 'weekly',
      stats: {
        checkins: 45,
        reviews: 23,
        averageRating: 4.4,
        uniqueAmenities: 18,
        vibesUsed: 4
      }
    }
  ];

  const mockRewards: Reward[] = [
    {
      id: 'premium_badge',
      title: 'Premium Badge',
      description: 'Exclusive badge for top contributors',
      icon: 'Crown',
      type: 'badge',
      rarity: 'epic',
      pointsCost: 500,
      isClaimed: false,
      isAvailable: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'early_access',
      title: 'Early Access',
      description: 'Get early access to new features',
      icon: 'Zap',
      type: 'feature',
      rarity: 'rare',
      pointsCost: 300,
      isClaimed: false,
      isAvailable: true,
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'custom_avatar',
      title: 'Custom Avatar',
      description: 'Unlock custom avatar options',
      icon: 'Gift',
      type: 'cosmetic',
      rarity: 'common',
      pointsCost: 150,
      isClaimed: true,
      isAvailable: true,
      expiresAt: null
    }
  ];

  const mockQuests: Quest[] = [
    {
      id: 'daily_checkin',
      title: 'Daily Check-in',
      description: 'Check in at any airport amenity today',
      icon: 'MapPin',
      category: 'daily',
      difficulty: 'easy',
      points: 25,
      isCompleted: false,
      isActive: true,
      progress: 0,
      maxProgress: 1,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      requirements: ['checkin_any_amenity']
    },
    {
      id: 'vibe_explorer',
      title: 'Vibe Explorer',
      description: 'Use 3 different vibes in your journey planning',
      icon: 'Heart',
      category: 'weekly',
      difficulty: 'medium',
      points: 100,
      isCompleted: false,
      isActive: true,
      progress: 2,
      maxProgress: 3,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      requirements: ['use_multiple_vibes']
    },
    {
      id: 'review_master',
      title: 'Review Master',
      description: 'Write 5 reviews with 4+ star ratings',
      icon: 'Star',
      category: 'weekly',
      difficulty: 'hard',
      points: 200,
      isCompleted: false,
      isActive: true,
      progress: 3,
      maxProgress: 5,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      requirements: ['write_high_rated_reviews']
    }
  ];

  useEffect(() => {
    const loadGamificationData = async () => {
      try {
        setIsLoading(true);
        
        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setUserProgress(mockUserProgress);
        setAchievements(mockAchievements);
        setLeaderboard(mockLeaderboard);
        setRewards(mockRewards);
        setQuests(mockQuests);
        
        setStats({
          totalUsers: 1250,
          activeUsers: 342,
          averageLevel: 6.2,
          totalAchievements: 25,
          averageAchievements: 8.5,
          topScore: 1850,
          averageScore: 650
        });
      } catch (error) {
        console.error('Error loading gamification data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGamificationData();
  }, [userId, airportCode]);

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'bg-gray-100 text-gray-800 border-gray-200',
      rare: 'bg-blue-100 text-blue-800 border-blue-200',
      epic: 'bg-purple-100 text-purple-800 border-purple-200',
      legendary: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      hard: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[difficulty as keyof typeof colors] || colors.easy;
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      Trophy: <Trophy className="w-5 h-5" />,
      Star: <Star className="w-5 h-5" />,
      Target: <Target className="w-5 h-5" />,
      TrendingUp: <TrendingUp className="w-5 h-5" />,
      Award: <Award className="w-5 h-5" />,
      Zap: <Zap className="w-5 h-5" />,
      Heart: <Heart className="w-5 h-5" />,
      MapPin: <MapPin className="w-5 h-5" />,
      Coffee: <Coffee className="w-5 h-5" />,
      ShoppingBag: <ShoppingBag className="w-5 h-5" />,
      Plane: <Plane className="w-5 h-5" />,
      Clock: <Clock className="w-5 h-5" />,
      Crown: <Crown className="w-5 h-5" />,
      Medal: <Medal className="w-5 h-5" />,
      Gift: <Gift className="w-5 h-5" />,
      Sparkles: <Sparkles className="w-5 h-5" />,
      Compass: <Compass className="w-5 h-5" />
    };
    return icons[iconName] || <Trophy className="w-5 h-5" />;
  };

  const handleClaimReward = (reward: Reward) => {
    if (userProgress && userProgress.totalPoints >= reward.pointsCost) {
      setRewards(prev => prev.map(r => 
        r.id === reward.id ? { ...r, isClaimed: true } : r
      ));
      setUserProgress(prev => prev ? {
        ...prev,
        totalPoints: prev.totalPoints - reward.pointsCost
      } : null);
      onRewardClaimed?.(reward);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* User Progress Overview */}
      {userProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span>Your Progress</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                Level {userProgress.level}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Level Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Experience</span>
                <span className="text-sm">{userProgress.experience} / {userProgress.experienceToNextLevel} XP</span>
              </div>
              <Progress 
                value={(userProgress.experience / userProgress.experienceToNextLevel) * 100} 
                className="w-full" 
              />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{userProgress.totalPoints}</div>
                <div className="text-xs text-gray-600">Total Points</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{userProgress.currentStreak}</div>
                <div className="text-xs text-gray-600">Day Streak</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{userProgress.achievementsUnlocked}</div>
                <div className="text-xs text-gray-600">Achievements</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">#{userProgress.rank}</div>
                <div className="text-xs text-gray-600">Global Rank</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'achievements', label: 'Achievements', icon: Trophy },
          { id: 'leaderboard', label: 'Leaderboard', icon: Users },
          { id: 'quests', label: 'Quests', icon: Target },
          { id: 'rewards', label: 'Rewards', icon: Gift }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.id as any)}
            className="flex-1"
          >
            <tab.icon className="w-4 h-4 mr-1" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <Card>
        <CardContent className="p-4">
          {activeTab === 'achievements' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Achievements</h3>
                <Badge variant="outline">
                  {achievements.filter(a => a.isUnlocked).length} / {achievements.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-3 rounded-lg border ${
                      achievement.isUnlocked 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${
                        achievement.isUnlocked ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {achievement.isUnlocked ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Lock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{achievement.title}</h4>
                          <Badge variant="outline" className={getRarityColor(achievement.rarity)}>
                            {achievement.rarity}
                          </Badge>
                          <span className="text-sm text-gray-500">+{achievement.points} pts</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Progress 
                              value={(achievement.progress / achievement.maxProgress) * 100} 
                              className="w-full" 
                            />
                          </div>
                          <span className="text-xs text-gray-500 ml-2">
                            {achievement.progress} / {achievement.maxProgress}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Weekly Leaderboard</h3>
                <Badge variant="outline">Top 10</Badge>
              </div>
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                      entry.userId === userId 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 flex items-center justify-center">
                        {index === 0 && <Crown className="w-6 h-6 text-yellow-500" />}
                        {index === 1 && <Medal className="w-6 h-6 text-gray-400" />}
                        {index === 2 && <Medal className="w-6 h-6 text-orange-500" />}
                        {index > 2 && <span className="text-sm font-medium">#{entry.rank}</span>}
                      </div>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={entry.avatar} alt={entry.username} />
                        <AvatarFallback className="text-xs">
                          {entry.username.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{entry.username}</span>
                        {entry.userId === userId && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {entry.stats.checkins} check-ins • {entry.stats.reviews} reviews
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{entry.score}</div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'quests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Active Quests</h3>
                <Badge variant="outline">
                  {quests.filter(q => q.isActive && !q.isCompleted).length} active
                </Badge>
              </div>
              <div className="space-y-3">
                {quests.map((quest) => (
                  <div
                    key={quest.id}
                    className={`p-3 rounded-lg border ${
                      quest.isCompleted 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${
                        quest.isCompleted ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {getIconComponent(quest.icon)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{quest.title}</h4>
                          <Badge variant="outline" className={getDifficultyColor(quest.difficulty)}>
                            {quest.difficulty}
                          </Badge>
                          <span className="text-sm text-gray-500">+{quest.points} pts</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{quest.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Progress 
                              value={(quest.progress / quest.maxProgress) * 100} 
                              className="w-full" 
                            />
                          </div>
                          <span className="text-xs text-gray-500 ml-2">
                            {quest.progress} / {quest.maxProgress}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Expires: {quest.expiresAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Available Rewards</h3>
                {userProgress && (
                  <Badge variant="outline">
                    {userProgress.totalPoints} points
                  </Badge>
                )}
              </div>
              <div className="space-y-3">
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className={`p-3 rounded-lg border ${
                      reward.isClaimed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${
                        reward.isClaimed ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {getIconComponent(reward.icon)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{reward.title}</h4>
                          <Badge variant="outline" className={getRarityColor(reward.rarity)}>
                            {reward.rarity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{reward.pointsCost} points</span>
                            {userProgress && userProgress.totalPoints < reward.pointsCost && (
                              <span className="text-xs text-red-600">
                                Need {reward.pointsCost - userProgress.totalPoints} more
                              </span>
                            )}
                          </div>
                          {!reward.isClaimed && reward.isAvailable && (
                            <Button
                              size="sm"
                              onClick={() => handleClaimReward(reward)}
                              disabled={!userProgress || userProgress.totalPoints < reward.pointsCost}
                            >
                              Claim
                            </Button>
                          )}
                          {reward.isClaimed && (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              Claimed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 