import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  screenName: string;
  renderTime: number;
  memoryUsage?: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private startTime: number = 0;

  startTracking(screenName: string) {
    this.startTime = performance.now();
    console.log(`🚀 Performance tracking started for: ${screenName}`);
  }

  endTracking(screenName: string) {
    const endTime = performance.now();
    const renderTime = endTime - this.startTime;
    
    const metric: PerformanceMetrics = {
      screenName,
      renderTime,
      timestamp: Date.now()
    };

    this.metrics.push(metric);
    
    // Log performance
    console.log(`📊 ${screenName} render time: ${renderTime.toFixed(2)}ms`);
    
    // Warn if render time is slow
    if (renderTime > 500) {
      console.warn(`⚠️ Slow render detected in ${screenName}: ${renderTime.toFixed(2)}ms`);
    }
    
    return metric;
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageRenderTime(screenName?: string): number {
    const relevantMetrics = screenName 
      ? this.metrics.filter(m => m.screenName === screenName)
      : this.metrics;
      
    if (relevantMetrics.length === 0) return 0;
    
    const totalTime = relevantMetrics.reduce((sum, metric) => sum + metric.renderTime, 0);
    return totalTime / relevantMetrics.length;
  }

  clearMetrics() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

// React Hook for easy performance tracking
export const usePerformanceTracking = (screenName: string) => {
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    // Start tracking when component mounts
    startTimeRef.current = performance.now();
    performanceMonitor.startTracking(screenName);
    
    return () => {
      // End tracking when component unmounts
      performanceMonitor.endTracking(screenName);
    };
  }, [screenName]);

  // Return a function to manually track specific operations
  const trackOperation = (operationName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`⏱️ ${screenName} - ${operationName}: ${duration.toFixed(2)}ms`);
      
      if (duration > 100) {
        console.warn(`⚠️ Slow operation in ${screenName}: ${operationName} took ${duration.toFixed(2)}ms`);
      }
    };
  };

  return { trackOperation };
};

export const withPerformanceTracking = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  screenName: string
) => {
  return (props: P) => {
    usePerformanceTracking(screenName);
    return <WrappedComponent {...props} />;
  };
};

export const trackMemoryUsage = (screenName: string) => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log(`🧠 ${screenName} memory usage:`, {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
    });
  }
};


// FlatList optimization helper
export const optimizeFlatListProps = {
  removeClippedSubviews: true,
  maxToRenderPerBatch: 10,
  windowSize: 10,
  initialNumToRender: 5,
  updateCellsBatchingPeriod: 30,
  getItemLayout: (data: any, index: number) => ({
    length: 70, 
    offset: 70 * index,
    index,
  }),
};

// Image optimization helper
export const optimizeImageProps = {
  resizeMode: 'cover' as const,
  fadeDuration: 0, 
  cache: 'force-cache' as const,
};

// Scroll optimization helper  
export const optimizeScrollProps = {
  showsVerticalScrollIndicator: false,
  showsHorizontalScrollIndicator: false,
  keyboardShouldPersistTaps: 'handled' as const,
  removeClippedSubviews: true,
};

export default performanceMonitor;