# 🔄 Frontend-Backend Integration Guide

## 📋 **Overview**

This guide explains how to update your Terminal Plus frontend to use the new secure backend API instead of calling OpenAI directly.

## 🚨 **Security Improvements**

### What's Fixed:
- ✅ **API Key Hidden**: OpenAI key now only on backend
- ✅ **Rate Limiting**: Prevents abuse (100 req/15min general, 10 req/min for AI)
- ✅ **Input Validation**: Limits message length and count
- ✅ **CORS Protection**: Only allows your frontend domain
- ✅ **Error Handling**: Never exposes sensitive errors to client

## 🔧 **Frontend Updates Required**

### 1. Update Environment Variables

**Remove from `.env.local`:**
```env
# ❌ DELETE THIS - No more exposed API keys!
VITE_OPENAI_API_KEY=sk-xxx
```

**Add to `.env.local`:**
```env
# ✅ Add backend URL
VITE_API_URL=http://localhost:3001/api
```

### 2. Update API Service

Create a new API service file:

```typescript
// src/services/apiService.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export class ApiService {
  // Vibe Chat
  static async vibeChat(messages: any[], vibe: string, mood: string) {
    const response = await fetch(`${API_URL}/ai/vibe-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, vibe, mood })
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  // Amenity Search
  static async searchAmenities(query: string, amenities: any[]) {
    const response = await fetch(`${API_URL}/ai/search-amenities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, amenities })
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  // Mood Detection
  static async detectMood(text: string) {
    const response = await fetch(`${API_URL}/ai/detect-mood`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  // Pattern-based search (fallback)
  static async patternSearch(query: string, amenities: any[]) {
    const response = await fetch(`${API_URL}/search/amenities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, amenities })
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }
}
```

### 3. Update VibeManagerChat Component

```typescript
// src/components/VibeManagerChat.tsx
import { ApiService } from '../services/apiService';

// Replace OpenAI calls with API service calls
const handleSendMessage = async (message: string) => {
  try {
    setLoading(true);
    
    // Add user message to chat
    const userMessage = { role: 'user', content: message };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Call backend API instead of OpenAI
    const response = await ApiService.vibeChat(
      updatedMessages, 
      currentVibe, 
      currentMood
    );
    
    // Add AI response to chat
    const aiMessage = { role: 'assistant', content: response.response };
    setMessages([...updatedMessages, aiMessage]);
    
    // Log usage for monitoring
    console.log('API Usage:', response.usage);
    
  } catch (error) {
    console.error('Chat error:', error);
    setError('Failed to send message. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

### 4. Update VibeChat Component

```typescript
// src/components/VibeChat.tsx
import { ApiService } from '../services/apiService';

// Replace OpenAI calls with API service calls
const sendMessage = async (message: string) => {
  try {
    setIsLoading(true);
    
    const newMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, newMessage]);
    
    // Call backend API
    const response = await ApiService.vibeChat(
      [...messages, newMessage],
      selectedVibe,
      userMood
    );
    
    const aiResponse = { role: 'assistant', content: response.response };
    setMessages(prev => [...prev, aiResponse]);
    
  } catch (error) {
    console.error('Chat error:', error);
    setError('Failed to send message');
  } finally {
    setIsLoading(false);
  }
};
```

### 5. Create AmenitySearch Component

```typescript
// src/components/AmenitySearch.tsx
import React, { useState } from 'react';
import { ApiService } from '../services/apiService';
import { useAmenities } from '../hooks/useAmenities';

interface AmenitySearchProps {
  terminalCode: string;
  onResultSelect?: (amenity: any) => void;
}

const AmenitySearch: React.FC<AmenitySearchProps> = ({ 
  terminalCode, 
  onResultSelect 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMethod, setSearchMethod] = useState<'ai' | 'pattern'>('ai');
  
  const { amenities } = useAmenities(terminalCode);
  
  const handleSearch = async () => {
    if (!query.trim()) return;
    
    try {
      setIsLoading(true);
      
      let response;
      if (searchMethod === 'ai') {
        response = await ApiService.searchAmenities(query, amenities);
      } else {
        response = await ApiService.patternSearch(query, amenities);
      }
      
      setResults(response.results || []);
      setSearchMethod(response.method || 'pattern');
      
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to pattern search
      try {
        const fallbackResponse = await ApiService.patternSearch(query, amenities);
        setResults(fallbackResponse.results || []);
        setSearchMethod('pattern');
      } catch (fallbackError) {
        console.error('Fallback search failed:', fallbackError);
        setResults([]);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search amenities..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      {searchMethod && (
        <div className="text-sm text-gray-600">
          Search method: <span className="font-medium">{searchMethod}</span>
        </div>
      )}
      
      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Results ({results.length})</h3>
          {results.map((amenity) => (
            <div
              key={amenity.id}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => onResultSelect?.(amenity)}
            >
              <h4 className="font-medium">{amenity.name}</h4>
              {amenity.description && (
                <p className="text-sm text-gray-600">{amenity.description}</p>
              )}
              {amenity.terminal_code && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {amenity.terminal_code}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AmenitySearch;
```

## 🧪 **Testing the Integration**

### 1. Start Backend
```bash
cd terminal-plus-backend
npm install
cp env.example .env
# Edit .env with your OpenAI key
npm run dev
```

### 2. Test Backend Endpoints
```bash
# Health check
curl http://localhost:3001/api/health

# Vibe chat
curl -X POST http://localhost:3001/api/ai/vibe-chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"vibe":"chill"}'
```

### 3. Update Frontend and Test
```bash
# In frontend directory
# Update .env.local with VITE_API_URL=http://localhost:3001/api
npm run dev
```

### 4. Test Frontend Features
- Test vibe chat functionality
- Test amenity search
- Check browser console for API calls
- Verify no OpenAI API key exposure

## 🔍 **Debugging Common Issues**

### Issue: "Cannot connect to backend"
- Check if backend is running on port 3001
- Verify CORS settings in backend
- Check browser console for CORS errors

### Issue: "API Error: 429"
- Rate limit exceeded
- Wait before making more requests
- Check rate limiting configuration

### Issue: "API Error: 500"
- Check backend logs for detailed error
- Verify OpenAI API key is correct
- Check if OpenAI service is available

### Issue: "CORS error"
- Verify FRONTEND_URL in backend .env
- Check if frontend URL matches exactly
- Restart backend after changing CORS settings

## 📊 **Monitoring and Analytics**

### Add API Usage Tracking
```typescript
// Track API calls for analytics
const trackApiCall = (endpoint: string, method: string, duration: number) => {
  // Send to analytics service
  console.log(`API Call: ${method} ${endpoint} - ${duration}ms`);
};

// Use in API service
const startTime = Date.now();
const response = await fetch(url, options);
const duration = Date.now() - startTime;
trackApiCall(endpoint, method, duration);
```

### Error Tracking
```typescript
// Track errors for monitoring
const trackError = (endpoint: string, error: any) => {
  console.error(`API Error in ${endpoint}:`, error);
  // Send to error tracking service
};

// Use in catch blocks
} catch (error) {
  trackError('vibe-chat', error);
  throw error;
}
```

## 🚀 **Production Deployment**

### 1. Deploy Backend First
```bash
cd terminal-plus-backend
./deploy.sh vercel  # or railway, fly, etc.
```

### 2. Update Frontend Environment
```env
# Production backend URL
VITE_API_URL=https://your-backend-url.vercel.app/api
```

### 3. Deploy Frontend
```bash
npm run build
# Deploy to your hosting platform
```

### 4. Verify Production
- Test all AI features work
- Check no API key exposure
- Monitor error rates and performance

## 🎯 **Next Steps**

1. **Immediate**: Deploy backend and test locally
2. **Week 1**: Monitor API usage and costs
3. **Week 2**: Add caching if needed
4. **Month 1**: Analyze search patterns
5. **Month 2**: Consider adding Supabase integration

## 🔒 **Security Checklist**

- [ ] OpenAI API key removed from frontend
- [ ] Backend environment variables secured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation working
- [ ] Error handling secure
- [ ] HTTPS enabled in production
- [ ] API endpoints tested

---

**🎉 Integration complete!** Your frontend now securely communicates with the backend API, keeping your OpenAI key safe while maintaining all functionality.
