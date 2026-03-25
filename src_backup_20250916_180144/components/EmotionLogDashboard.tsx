import React, { useEffect, useState } from 'react';
import { getEmotionLogs } from '../lib/getEmotionLogs';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Brain, Clock, MessageSquareText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const EmotionLogDashboard: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual user ID from session
    const userId = 'temp-user-id'; // This should come from Supabase auth session
    
    getEmotionLogs(userId).then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading your emotional journey...</p>;
  }

  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground">No emotion logs available yet. Try using the Vibes Manager to create your first log!</p>;
  }

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      stressed: 'bg-red-100 text-red-800 border-red-200',
      angry: 'bg-orange-100 text-orange-800 border-orange-200',
      sad: 'bg-blue-100 text-blue-800 border-blue-200',
      happy: 'bg-green-100 text-green-800 border-green-200',
      excited: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      neutral: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[emotion.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-3">🧠 Emotional Journey</h3>
      {logs.map((log, index) => (
        <Card key={index} className="p-4 space-y-2 border border-gray-200">
          <div className="flex items-center justify-between">
            <Badge className={`capitalize border ${getEmotionColor(log.emotion)}`}>
              <Brain className="w-4 h-4 mr-1" />
              {log.emotion} ({Math.round((log.confidence || 0) * 100)}%)
            </Badge>
            <span className="text-xs text-muted-foreground">
              <Clock className="inline-block w-3 h-3 mr-1" />
              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
            </span>
          </div>

          <div className="text-sm text-muted-foreground">
            {log.detailed_emotion && (
              <div><strong>Detailed:</strong> {log.detailed_emotion}</div>
            )}
            {(log.tone || log.warmth) && (
              <div>
                <strong>Tone:</strong> {log.tone || 'N/A'} 
                {log.warmth && ` • Warmth: ${log.warmth}`}
              </div>
            )}
            {(log.pace || log.language) && (
              <div>
                <strong>Pace:</strong> {log.pace || 'N/A'} 
                {log.language && ` • Language: ${log.language}`}
              </div>
            )}
          </div>

          {log.gpt_response && (
            <div className="mt-2 bg-blue-50 border-l-2 border-blue-200 pl-3 text-sm text-gray-700">
              <MessageSquareText className="inline w-4 h-4 mr-1 text-blue-500" />
              {log.gpt_response}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}; 