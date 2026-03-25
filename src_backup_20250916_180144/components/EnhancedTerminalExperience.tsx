import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Users, 
  Brain, 
  Trophy, 
  Headphones, 
  Smartphone,
  Zap,
  TrendingUp,
  Heart,
  MapPin,
  Coffee,
  ShoppingBag,
  Plane,
  Clock,
  Star,
  Target,
  Settings,
  Activity
} from 'lucide-react';
import { SocialProofActivity } from './SocialProofActivity';
import { EmotionDetectionUI } from './EmotionDetectionUI';
import { GamificationHub } from './GamificationHub';
import { VoiceInterface } from './VoiceInterface';
import { PWAOptimizer } from './PWAOptimizer';
import { useTheme } from '@/hooks/useTheme';
import type { 
  SocialActivity, 
  EmotionData, 
  VoiceCommand, 
  VoiceResponse,
  Achievement,
  Reward,
  InstallationPrompt,
  CacheStatus
} from '@/types';

interface EnhancedTerminalExperienceProps {
  airportCode: string;
  terminal?: string;
  userId?: string;
  className?: string;
}

export const EnhancedTerminalExperience: React.FC<EnhancedTerminalExperienceProps> = ({
  airportCode,
  terminal,
  userId = 'user_123',
  className = ''
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'social' | 'emotion' | 'gamification' | 'voice' | 'pwa'>('social');
  const [currentVibe, setCurrentVibe] = useState<string>('explore');
  const [currentEmotion, setCurrentEmotion] = useState<EmotionData | null>(null);
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([]);
  const [voiceResponses, setVoiceResponses] = useState<VoiceResponse[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Handle emotion detection
  const handleEmotionDetected = (emotion: EmotionData) => {
    setCurrentEmotion(emotion);
    console.log('Emotion detected:', emotion);
    
    // Suggest vibe based on emotion
    const emotionToVibe: Record<string, string> = {
      happy: 'explore',
      excited: 'explore',
      calm: 'chill',
      stressed: 'comfort',
      tired: 'comfort',
      neutral: 'explore'
    };
    
    const suggestedVibe = emotionToVibe[emotion.type] || 'explore';
    setCurrentVibe(suggestedVibe);
  };

  const handleVibeSuggested = (vibe: string) => {
    setCurrentVibe(vibe);
    console.log('Vibe suggested:', vibe);
  };

  // Handle voice commands
  const handleVoiceCommand = (command: VoiceCommand) => {
    setVoiceCommands(prev => [command, ...prev.slice(0, 9)]);
    console.log('Voice command received:', command);
    
    // Execute voice command
    switch (command.action) {
      case 'explore':
        setActiveTab('social');
        break;
      case 'set_vibe':
        if (command.parameters.vibe) {
          setCurrentVibe(command.parameters.vibe);
        }
        break;
      case 'search_amenities':
        // Handle amenity search
        break;
      case 'show_map':
        // Handle map display
        break;
      default:
        console.log('Unknown voice command:', command.action);
    }
  };

  const handleVoiceResponse = (response: VoiceResponse) => {
    setVoiceResponses(prev => [response, ...prev.slice(0, 9)]);
    console.log('Voice response:', response);
  };

  // Handle gamification events
  const handleAchievementUnlocked = (achievement: Achievement) => {
    console.log('Achievement unlocked:', achievement);
    // Show achievement notification
  };

  const handleRewardClaimed = (reward: Reward) => {
    console.log('Reward claimed:', reward);
    // Show reward notification
  };

  // Handle PWA events
  const handleInstallPrompt = (prompt: InstallationPrompt) => {
    setShowInstallPrompt(true);
    console.log('Install prompt:', prompt);
  };

  const handleOfflineStatusChange = (offline: boolean) => {
    setIsOffline(offline);
    console.log('Offline status changed:', offline);
  };

  const handleCacheUpdate = (status: CacheStatus) => {
    console.log('Cache status updated:', status);
  };

  const getVibeIcon = (vibe: string) => {
    const icons: Record<string, React.ReactNode> = {
      explore: <MapPin className="w-4 h-4" />,
      chill: <Heart className="w-4 h-4" />,
      comfort: <Coffee className="w-4 h-4" />,
      refuel: <Coffee className="w-4 h-4" />,
      work: <Plane className="w-4 h-4" />,
      quick: <Clock className="w-4 h-4" />
    };
    return icons[vibe] || <Target className="w-4 h-4" />;
  };

  const getVibeColor = (vibe: string) => {
    const colors: Record<string, string> = {
      explore: 'bg-green-100 text-green-800 border-green-200',
      chill: 'bg-violet-100 text-violet-800 border-violet-200',
      comfort: 'bg-blue-100 text-blue-800 border-blue-200',
      refuel: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      work: 'bg-orange-100 text-orange-800 border-orange-200',
      quick: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[vibe] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with current status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Enhanced Terminal Experience</span>
            </div>
            <div className="flex items-center space-x-2">
              {currentEmotion && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                  <Brain className="w-3 h-3 mr-1" />
                  {currentEmotion.type}
                </Badge>
              )}
              <Badge variant="outline" className={getVibeColor(currentVibe)}>
                {getVibeIcon(currentVibe)}
                <span className="ml-1 capitalize">{currentVibe}</span>
              </Badge>
              {isOffline && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  <Activity className="w-3 h-3 mr-1" />
                  Offline
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Experience Terminal+ with AI-powered emotion detection, voice commands, social proof, 
            gamification, and offline capabilities.
          </p>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="social" className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Social</span>
          </TabsTrigger>
          <TabsTrigger value="emotion" className="flex items-center space-x-1">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">Emotion</span>
          </TabsTrigger>
          <TabsTrigger value="gamification" className="flex items-center space-x-1">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Gamification</span>
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center space-x-1">
            <Headphones className="w-4 h-4" />
            <span className="hidden sm:inline">Voice</span>
          </TabsTrigger>
          <TabsTrigger value="pwa" className="flex items-center space-x-1">
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">PWA</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Live Social Activity</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SocialProofActivity
                airportCode={airportCode}
                terminal={terminal}
                maxActivities={5}
                refreshInterval={30000}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emotion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span>Emotion Detection & Mood Analysis</span>
                {currentEmotion && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                    {currentEmotion.type}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EmotionDetectionUI
                onEmotionDetected={handleEmotionDetected}
                onVibeSuggested={handleVibeSuggested}
                autoDetect={true}
                showHistory={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gamification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Gamification Hub</span>
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                  <Star className="w-3 h-3 mr-1" />
                  Level 8
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GamificationHub
                userId={userId}
                airportCode={airportCode}
                onAchievementUnlocked={handleAchievementUnlocked}
                onRewardClaimed={handleRewardClaimed}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Headphones className="w-5 h-5" />
                <span>Voice Assistant</span>
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                  <Target className="w-3 h-3 mr-1" />
                  Ready
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VoiceInterface
                onCommandReceived={handleVoiceCommand}
                onVoiceResponse={handleVoiceResponse}
                enabled={true}
                autoStart={false}
                showVisualizer={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pwa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5" />
                <span>PWA Optimization</span>
                <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                  <Settings className="w-3 h-3 mr-1" />
                  Optimized
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PWAOptimizer
                onInstallPrompt={handleInstallPrompt}
                onOfflineStatusChange={handleOfflineStatusChange}
                onCacheUpdate={handleCacheUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              onClick={() => setActiveTab('emotion')}
              className="flex flex-col items-center space-y-1 h-auto py-3"
            >
              <Brain className="w-5 h-5" />
              <span className="text-xs">Check Mood</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setActiveTab('voice')}
              className="flex flex-col items-center space-y-1 h-auto py-3"
            >
              <Headphones className="w-5 h-5" />
              <span className="text-xs">Voice Commands</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setActiveTab('gamification')}
              className="flex flex-col items-center space-y-1 h-auto py-3"
            >
              <Trophy className="w-5 h-5" />
              <span className="text-xs">Achievements</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setActiveTab('social')}
              className="flex flex-col items-center space-y-1 h-auto py-3"
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Social Activity</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Integration Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-sm font-medium">Social Proof</div>
              <div className="text-xs text-gray-500">Live Activity</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Brain className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-sm font-medium">Emotion Detection</div>
              <div className="text-xs text-gray-500">
                {currentEmotion ? currentEmotion.type : 'Ready'}
              </div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="w-6 h-6 text-purple-500" />
              </div>
              <div className="text-sm font-medium">Gamification</div>
              <div className="text-xs text-gray-500">Level 8</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Headphones className="w-6 h-6 text-orange-500" />
              </div>
              <div className="text-sm font-medium">Voice Interface</div>
              <div className="text-xs text-gray-500">Ready</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 