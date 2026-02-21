import React, { useState, useEffect, useCallback } from 'react';
import { performanceOptimizer } from '../utils/smart7PerformanceOptimizer';
import { abTesting } from '../utils/smart7ABTesting';
import { 
  Activity, 
  Zap, 
  Wifi, 
  WifiOff, 
  Database, 
  Clock, 
  TrendingUp,
  RefreshCw,
  Settings,
  BarChart3,
  Smartphone,
  Monitor
} from 'lucide-react';

interface PerformanceDashboardProps {
  collectionId?: number;
  showAdvanced?: boolean;
  refreshInterval?: number; // in seconds
}

export const Smart7PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  collectionId,
  showAdvanced = false,
  refreshInterval = 30
}) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeExperiments, setActiveExperiments] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Refresh metrics
  const refreshMetrics = useCallback(() => {
    const perfMetrics = performanceOptimizer.getMetrics();
    const experiments = abTesting.getActiveExperiments();
    
    setMetrics(perfMetrics);
    setActiveExperiments(experiments);
    setLastRefresh(new Date());
  }, []);

  // Auto-refresh
  useEffect(() => {
    refreshMetrics();
    
    const interval = setInterval(refreshMetrics, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshMetrics, refreshInterval]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!metrics) {
    return (
      <div className="performance-dashboard loading">
        <Activity className="animate-spin" />
        <p>Loading performance metrics...</p>
      </div>
    );
  }

  return (
    <div className="performance-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <BarChart3 size={24} />
          <h3>Smart7 Performance Dashboard</h3>
        </div>
        <div className="header-right">
          <button 
            onClick={refreshMetrics}
            className="refresh-btn"
            title="Refresh metrics"
          >
            <RefreshCw size={16} />
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="settings-btn"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className={`status-bar ${isOnline ? 'online' : 'offline'}`}>
        <div className="status-indicator">
          {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        <div className="last-refresh">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        {/* Cache Performance */}
        <div className="metric-card cache">
          <div className="metric-header">
            <Database size={20} />
            <span>Cache Performance</span>
          </div>
          <div className="metric-value">
            {(metrics.cacheHitRate * 100).toFixed(1)}%
          </div>
          <div className="metric-label">Hit Rate</div>
          <div className="metric-details">
            <span>Memory: {metrics.memoryUsage.toFixed(2)} MB</span>
          </div>
        </div>

        {/* Load Performance */}
        <div className="metric-card load">
          <div className="metric-header">
            <Zap size={20} />
            <span>Load Performance</span>
          </div>
          <div className="metric-value">
            {metrics.averageLoadTime.toFixed(0)}ms
          </div>
          <div className="metric-label">Average Load Time</div>
          <div className="metric-details">
            <span>Optimized for speed</span>
          </div>
        </div>

        {/* Offline Usage */}
        <div className="metric-card offline">
          <div className="metric-header">
            <WifiOff size={20} />
            <span>Offline Usage</span>
          </div>
          <div className="metric-value">
            {metrics.offlineUsage}
          </div>
          <div className="metric-label">Offline Sessions</div>
          <div className="metric-details">
            <span>Fallback enabled</span>
          </div>
        </div>

        {/* Prefetch Success */}
        <div className="metric-card prefetch">
          <div className="metric-header">
            <TrendingUp size={20} />
            <span>Prefetch Success</span>
          </div>
          <div className="metric-value">
            {(metrics.prefetchSuccess * 100).toFixed(1)}%
          </div>
          <div className="metric-label">Success Rate</div>
          <div className="metric-details">
            <span>Proactive loading</span>
          </div>
        </div>
      </div>

      {/* A/B Testing Status */}
      {activeExperiments.length > 0 && (
        <div className="experiments-section">
          <h4>Active Experiments</h4>
          <div className="experiments-grid">
            {activeExperiments.map((exp) => (
              <div key={exp.id} className="experiment-card">
                <div className="experiment-header">
                  <Activity size={16} />
                  <span>{exp.name}</span>
                </div>
                <div className="experiment-details">
                  <span>Variants: {exp.variants.length}</span>
                  <span>Status: Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Metrics */}
      {showAdvanced && (
        <div className="advanced-metrics">
          <h4>Advanced Performance Data</h4>
          
          {/* Mobile Optimizations */}
          <div className="optimization-section">
            <h5>Mobile Optimizations</h5>
            <div className="optimization-grid">
              {Object.entries(performanceOptimizer.getMobileOptimizations()).map(([key, value]) => (
                <div key={key} className="optimization-item">
                  <span className="optimization-label">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className={`optimization-value ${value ? 'enabled' : 'disabled'}`}>
                    {value ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cache Strategy */}
          <div className="strategy-section">
            <h5>Cache Strategy</h5>
            <div className="strategy-info">
              <span>Strategy: Hybrid (Memory + SessionStorage)</span>
              <span>Max Size: 10 MB</span>
              <span>Stale While Revalidate: Enabled</span>
            </div>
          </div>

          {/* Performance Timeline */}
          <div className="timeline-section">
            <h5>Performance Timeline</h5>
            <div className="timeline">
              <div className="timeline-item">
                <Clock size={14} />
                <span>Cache cleanup every 5 minutes</span>
              </div>
              <div className="timeline-item">
                <Clock size={14} />
                <span>Metrics reporting every minute</span>
              </div>
              <div className="timeline-item">
                <Clock size={14} />
                <span>Lazy loading threshold: 50px</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <h4>Performance Settings</h4>
          
          <div className="setting-group">
            <label>
              <input 
                type="checkbox" 
                defaultChecked={true}
                onChange={(e) => {
                  // Toggle performance monitoring
                  console.log('Performance monitoring:', e.target.checked);
                }}
              />
              Enable Performance Monitoring
            </label>
          </div>

          <div className="setting-group">
            <label>
              <input 
                type="checkbox" 
                defaultChecked={true}
                onChange={(e) => {
                  // Toggle aggressive caching
                  console.log('Aggressive caching:', e.target.checked);
                }}
              />
              Aggressive Caching (Mobile)
            </label>
          </div>

          <div className="setting-group">
            <label>
              <input 
                type="checkbox" 
                defaultChecked={true}
                onChange={(e) => {
                  // Toggle prefetching
                  console.log('Prefetching:', e.target.checked);
                }}
              />
              Enable Prefetching
            </label>
          </div>

          <div className="setting-group">
            <label>
              Refresh Interval (seconds):
              <input 
                type="number" 
                min="10" 
                max="300"
                defaultValue={refreshInterval}
                onChange={(e) => {
                  // Update refresh interval
                  console.log('New refresh interval:', e.target.value);
                }}
              />
            </label>
          </div>
        </div>
      )}

      {/* Performance Tips */}
      <div className="performance-tips">
        <h4>Performance Tips</h4>
        <div className="tips-grid">
          <div className="tip">
            <Smartphone size={16} />
            <span>Enable aggressive caching on slow connections</span>
          </div>
          <div className="tip">
            <Monitor size={16} />
            <span>Use lazy loading for large collections</span>
          </div>
          <div className="tip">
            <Zap size={16} />
            <span>Prefetch related collections for faster navigation</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .performance-dashboard {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-left h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1a202c;
        }

        .header-right {
          display: flex;
          gap: 8px;
        }

        .refresh-btn, .settings-btn {
          padding: 8px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .refresh-btn:hover, .settings-btn:hover {
          background: #f7fafc;
          border-color: #cbd5e0;
        }

        .status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .status-bar.online {
          background: #f0fff4;
          color: #22543d;
          border: 1px solid #9ae6b4;
        }

        .status-bar.offline {
          background: #fed7d7;
          color: #742a2a;
          border: 1px solid #feb2b2;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }

        .last-refresh {
          font-size: 12px;
          opacity: 0.8;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .metric-card {
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
        }

        .metric-card.cache { border-left: 4px solid #4299e1; }
        .metric-card.load { border-left: 4px solid #48bb78; }
        .metric-card.offline { border-left: 4px solid #ed8936; }
        .metric-card.prefetch { border-left: 4px solid #9f7aea; }

        .metric-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-size: 14px;
          color: #4a5568;
          font-weight: 500;
        }

        .metric-value {
          font-size: 32px;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 4px;
        }

        .metric-label {
          font-size: 14px;
          color: #718096;
          margin-bottom: 8px;
        }

        .metric-details {
          font-size: 12px;
          color: #a0aec0;
        }

        .experiments-section {
          margin-bottom: 24px;
        }

        .experiments-section h4 {
          margin: 0 0 16px 0;
          font-size: 18px;
          color: #2d3748;
        }

        .experiments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 12px;
        }

        .experiment-card {
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f7fafc;
        }

        .experiment-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-weight: 500;
          color: #4a5568;
        }

        .experiment-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
          color: #718096;
        }

        .advanced-metrics {
          margin-bottom: 24px;
          padding: 20px;
          background: #f7fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .advanced-metrics h4 {
          margin: 0 0 16px 0;
          font-size: 18px;
          color: #2d3748;
        }

        .optimization-section, .strategy-section, .timeline-section {
          margin-bottom: 20px;
        }

        .optimization-section h5, .strategy-section h5, .timeline-section h5 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #4a5568;
        }

        .optimization-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 8px;
        }

        .optimization-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        .optimization-value.enabled {
          color: #48bb78;
          font-weight: 600;
        }

        .optimization-value.disabled {
          color: #e53e3e;
          font-weight: 600;
        }

        .strategy-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 14px;
          color: #4a5568;
        }

        .timeline {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .timeline-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #4a5568;
        }

        .settings-panel {
          margin-bottom: 24px;
          padding: 20px;
          background: #f7fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .settings-panel h4 {
          margin: 0 0 16px 0;
          font-size: 18px;
          color: #2d3748;
        }

        .setting-group {
          margin-bottom: 16px;
        }

        .setting-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #4a5568;
          cursor: pointer;
        }

        .setting-group input[type="checkbox"] {
          width: 16px;
          height: 16px;
        }

        .setting-group input[type="number"] {
          width: 80px;
          margin-left: 8px;
          padding: 4px 8px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
        }

        .performance-tips {
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          color: white;
        }

        .performance-tips h4 {
          margin: 0 0 16px 0;
          font-size: 18px;
        }

        .tips-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 12px;
        }

        .tip {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          opacity: 0.9;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #718096;
        }

        .loading .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .performance-dashboard {
            padding: 16px;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .status-bar {
            flex-direction: column;
            gap: 8px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};
