// Smart Queue System
// Prioritizes actions based on importance and user context

export enum ActionType {
  CHECK_IN = 'check_in',
  ACHIEVEMENT = 'achievement',
  SOCIAL = 'social',
  ANALYTICS = 'analytics',
  LOCATION_UPDATE = 'location_update',
  RATING_SUBMISSION = 'rating_submission',
  PURCHASE_RECORDING = 'purchase_recording',
  NOTIFICATION = 'notification',
  SYNC = 'sync'
}

export enum Priority {
  CRITICAL = 0,
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3,
  BACKGROUND = 4
}

export interface QueueAction {
  id: string;
  type: ActionType;
  priority: Priority;
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  dependencies?: string[]; // IDs of actions this depends on
  metadata?: {
    userId?: string;
    location?: { lat: number; lng: number };
    batteryLevel?: number;
    networkType?: string;
  };
}

export interface QueueStats {
  totalActions: number;
  pendingActions: number;
  completedActions: number;
  failedActions: number;
  averageProcessingTime: number;
  queueHealth: 'excellent' | 'good' | 'fair' | 'poor';
}

class SmartQueue {
  private queue: QueueAction[] = [];
  private processing: Set<string> = new Set();
  private completed: Map<string, QueueAction> = new Map();
  private failed: Map<string, { action: QueueAction; error: Error }> = new Map();
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private stats: QueueStats = {
    totalActions: 0,
    pendingActions: 0,
    completedActions: 0,
    failedActions: 0,
    averageProcessingTime: 0,
    queueHealth: 'excellent'
  };

  // Priority mapping for different action types
  private static readonly PRIORITY_MAP: Record<ActionType, Priority> = {
    [ActionType.CHECK_IN]: Priority.CRITICAL,
    [ActionType.ACHIEVEMENT]: Priority.HIGH,
    [ActionType.SOCIAL]: Priority.MEDIUM,
    [ActionType.ANALYTICS]: Priority.LOW,
    [ActionType.LOCATION_UPDATE]: Priority.HIGH,
    [ActionType.RATING_SUBMISSION]: Priority.HIGH,
    [ActionType.PURCHASE_RECORDING]: Priority.CRITICAL,
    [ActionType.NOTIFICATION]: Priority.MEDIUM,
    [ActionType.SYNC]: Priority.BACKGROUND
  };

  // Network-aware priority adjustments
  private static readonly NETWORK_PRIORITY_ADJUSTMENTS: Record<string, number> = {
    '4g': 0,
    '3g': 1,
    '2g': 2,
    'slow-2g': 3,
    'offline': 4
  };

  // Battery-aware priority adjustments
  private static readonly BATTERY_PRIORITY_ADJUSTMENTS: Record<string, number> = {
    'critical': 2,
    'low': 1,
    'medium': 0,
    'high': 0
  };

  constructor() {
    this.startProcessing();
  }

  // Add action to queue with smart prioritization
  public enqueue(action: Omit<QueueAction, 'id' | 'timestamp' | 'retryCount'>): string {
    const id = this.generateId();
    const timestamp = Date.now();
    
    const queueAction: QueueAction = {
      ...action,
      id,
      timestamp,
      retryCount: 0
    };

    // Adjust priority based on context
    const adjustedPriority = this.adjustPriority(queueAction);
    queueAction.priority = adjustedPriority;

    this.queue.push(queueAction);
    this.stats.totalActions++;
    this.stats.pendingActions++;
    
    // Sort queue by priority
    this.sortQueue();
    
    console.log(`Action enqueued: ${action.type} with priority ${adjustedPriority}`);
    return id;
  }

  // Adjust priority based on context
  private adjustPriority(action: QueueAction): Priority {
    let adjustedPriority = action.priority;
    
    // Network-based adjustments
    if (action.metadata?.networkType) {
      const networkAdjustment = SmartQueue.NETWORK_PRIORITY_ADJUSTMENTS[action.metadata.networkType] || 0;
      adjustedPriority = Math.min(adjustedPriority + networkAdjustment, Priority.BACKGROUND);
    }
    
    // Battery-based adjustments
    if (action.metadata?.batteryLevel !== undefined) {
      let batteryStatus: string;
      if (action.metadata.batteryLevel <= 0.1) batteryStatus = 'critical';
      else if (action.metadata.batteryLevel <= 0.3) batteryStatus = 'low';
      else if (action.metadata.batteryLevel <= 0.7) batteryStatus = 'medium';
      else batteryStatus = 'high';
      
      const batteryAdjustment = SmartQueue.BATTERY_PRIORITY_ADJUSTMENTS[batteryStatus] || 0;
      adjustedPriority = Math.min(adjustedPriority + batteryAdjustment, Priority.BACKGROUND);
    }
    
    // Location-based adjustments (higher priority when near amenities)
    if (action.metadata?.location && action.type === ActionType.CHECK_IN) {
      adjustedPriority = Math.max(adjustedPriority - 1, Priority.CRITICAL);
    }
    
    return adjustedPriority;
  }

  // Sort queue by priority and timestamp
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // First by priority
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      // Then by timestamp (FIFO for same priority)
      return a.timestamp - b.timestamp;
    });
  }

  // Start processing queue
  private startProcessing(): void {
    if (this.processingInterval) return;
    
    this.processingInterval = setInterval(() => {
      this.processNextAction();
    }, 100); // Process every 100ms
  }

  // Stop processing queue
  public stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
  }

  // Process next action in queue
  private async processNextAction(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    
    const action = this.queue.shift();
    if (!action) return;
    
    // Check dependencies
    if (action.dependencies && action.dependencies.length > 0) {
      const unmetDependencies = action.dependencies.filter(depId => !this.completed.has(depId));
      if (unmetDependencies.length > 0) {
        // Put action back in queue
        this.queue.push(action);
        return;
      }
    }
    
    this.isProcessing = true;
    this.processing.add(action.id);
    
    try {
      await this.executeAction(action);
      this.completed.set(action.id, action);
      this.stats.completedActions++;
      this.stats.pendingActions--;
      
      console.log(`Action completed: ${action.type}`);
    } catch (error) {
      console.error(`Action failed: ${action.type}`, error);
      
      if (action.retryCount < action.maxRetries) {
        action.retryCount++;
        action.priority = Math.min(action.priority + 1, Priority.BACKGROUND); // Lower priority on retry
        this.queue.push(action);
        this.stats.pendingActions++;
      } else {
        this.failed.set(action.id, { action, error: error as Error });
        this.stats.failedActions++;
        this.stats.pendingActions--;
      }
    } finally {
      this.processing.delete(action.id);
      this.isProcessing = false;
      this.updateStats();
    }
  }

  // Execute individual action
  private async executeAction(action: QueueAction): Promise<void> {
    const startTime = Date.now();
    
    switch (action.type) {
      case ActionType.CHECK_IN:
        await this.handleCheckIn(action);
        break;
      case ActionType.ACHIEVEMENT:
        await this.handleAchievement(action);
        break;
      case ActionType.SOCIAL:
        await this.handleSocial(action);
        break;
      case ActionType.ANALYTICS:
        await this.handleAnalytics(action);
        break;
      case ActionType.LOCATION_UPDATE:
        await this.handleLocationUpdate(action);
        break;
      case ActionType.RATING_SUBMISSION:
        await this.handleRatingSubmission(action);
        break;
      case ActionType.PURCHASE_RECORDING:
        await this.handlePurchaseRecording(action);
        break;
      case ActionType.NOTIFICATION:
        await this.handleNotification(action);
        break;
      case ActionType.SYNC:
        await this.handleSync(action);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
    
    const processingTime = Date.now() - startTime;
    this.updateAverageProcessingTime(processingTime);
  }

  // Action handlers
  private async handleCheckIn(action: QueueAction): Promise<void> {
    // Simulate check-in processing
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`Processing check-in for amenity: ${action.payload.amenityId}`);
  }

  private async handleAchievement(action: QueueAction): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50));
    console.log(`Processing achievement: ${action.payload.achievementId}`);
  }

  private async handleSocial(action: QueueAction): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log(`Processing social action: ${action.payload.type}`);
  }

  private async handleAnalytics(action: QueueAction): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 150));
    console.log(`Processing analytics: ${action.payload.event}`);
  }

  private async handleLocationUpdate(action: QueueAction): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 80));
    console.log(`Processing location update: ${action.payload.coordinates}`);
  }

  private async handleRatingSubmission(action: QueueAction): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 120));
    console.log(`Processing rating submission: ${action.payload.rating}`);
  }

  private async handlePurchaseRecording(action: QueueAction): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`Processing purchase recording: ${action.payload.amount}`);
  }

  private async handleNotification(action: QueueAction): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 30));
    console.log(`Processing notification: ${action.payload.message}`);
  }

  private async handleSync(action: QueueAction): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log(`Processing sync: ${action.payload.syncType}`);
  }

  // Update average processing time
  private updateAverageProcessingTime(newTime: number): void {
    const totalTime = this.stats.averageProcessingTime * this.stats.completedActions + newTime;
    this.stats.averageProcessingTime = totalTime / (this.stats.completedActions + 1);
  }

  // Update queue health
  private updateStats(): void {
    const totalActions = this.stats.totalActions;
    const successRate = totalActions > 0 ? this.stats.completedActions / totalActions : 1;
    
    if (successRate >= 0.95) this.stats.queueHealth = 'excellent';
    else if (successRate >= 0.85) this.stats.queueHealth = 'good';
    else if (successRate >= 0.70) this.stats.queueHealth = 'fair';
    else this.stats.queueHealth = 'poor';
  }

  // Get queue statistics
  public getStats(): QueueStats {
    return { ...this.stats };
  }

  // Get queue status
  public getStatus(): {
    isProcessing: boolean;
    queueLength: number;
    processingCount: number;
    completedCount: number;
    failedCount: number;
  } {
    return {
      isProcessing: this.isProcessing,
      queueLength: this.queue.length,
      processingCount: this.processing.size,
      completedCount: this.completed.size,
      failedCount: this.failed.size
    };
  }

  // Clear completed actions (for memory management)
  public clearCompleted(olderThan?: number): void {
    const cutoff = olderThan ? Date.now() - olderThan : Date.now() - (24 * 60 * 60 * 1000); // Default: 24 hours
    
    for (const [id, action] of this.completed.entries()) {
      if (action.timestamp < cutoff) {
        this.completed.delete(id);
      }
    }
  }

  // Generate unique ID
  private generateId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get actions by type
  public getActionsByType(type: ActionType): QueueAction[] {
    return this.queue.filter(action => action.type === type);
  }

  // Get actions by priority
  public getActionsByPriority(priority: Priority): QueueAction[] {
    return this.queue.filter(action => action.priority === priority);
  }

  // Remove action from queue
  public removeAction(actionId: string): boolean {
    const index = this.queue.findIndex(action => action.id === actionId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.stats.pendingActions--;
      return true;
    }
    return false;
  }

  // Pause specific action types
  public pauseActionType(type: ActionType): void {
    this.queue = this.queue.filter(action => action.type !== type);
  }

  // Resume specific action types
  public resumeActionType(type: ActionType): void {
    // This would require storing paused actions separately
    console.log(`Resuming action type: ${type}`);
  }
}

// Export singleton instance
export const smartQueue = new SmartQueue();

// Export convenience functions
export const {
  enqueue,
  getStats,
  getStatus,
  clearCompleted,
  getActionsByType,
  getActionsByPriority,
  removeAction,
  pauseActionType,
  resumeActionType,
  stopProcessing
} = smartQueue;
