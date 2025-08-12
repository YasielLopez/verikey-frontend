const displayDateCache = new Map<string, string>();
const dateWithTimeCache = new Map<string, string>();
const relativeTimeCache = new Map<string, { formatted: string; timestamp: number }>();

// Clear relative time cache periodically (every minute) since relative times change
const RELATIVE_CACHE_TTL = 60000; 
let relativeCacheTimer: NodeJS.Timeout | null = null;

const startRelativeCacheCleanup = () => {
  if (!relativeCacheTimer) {
    relativeCacheTimer = setInterval(() => {
      const now = Date.now();
      // Remove entries older than TTL
      for (const [key, value] of relativeTimeCache.entries()) {
        if (now - value.timestamp > RELATIVE_CACHE_TTL) {
          relativeTimeCache.delete(key);
        }
      }
    }, RELATIVE_CACHE_TTL);
  }
};

export const clearDateCaches = () => {
  displayDateCache.clear();
  dateWithTimeCache.clear();
  relativeTimeCache.clear();
};

export const getDateCacheStats = () => ({
  displayDateCache: displayDateCache.size,
  dateWithTimeCache: dateWithTimeCache.size,
  relativeTimeCache: relativeTimeCache.size,
});

export const formatDateForDisplay = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Unknown';
  
  const cached = displayDateCache.get(dateString);
  if (cached) {
    return cached;
  }
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      displayDateCache.set(dateString, 'Unknown');
      return 'Unknown';
    }
    
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    
    const formatted = date.toLocaleDateString('en-US', options);
    
    displayDateCache.set(dateString, formatted);
    
    return formatted;
  } catch (error) {
    console.error('Date formatting error:', error);
    const errorResult = 'Unknown';
    displayDateCache.set(dateString, errorResult);
    return errorResult;
  }
};

export const formatDateWithTime = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Unknown';
  
  const cached = dateWithTimeCache.get(dateString);
  if (cached) {
    return cached;
  }
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      dateWithTimeCache.set(dateString, 'Unknown');
      return 'Unknown';
    }
    
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    const dateStr = date.toLocaleDateString('en-US', dateOptions);
    const timeStr = date.toLocaleTimeString('en-US', timeOptions);
    
    const formatted = `${dateStr} at ${timeStr}`;
    
    dateWithTimeCache.set(dateString, formatted);
    
    return formatted;
  } catch (error) {
    console.error('Date formatting error:', error);
    const errorResult = 'Unknown';
    dateWithTimeCache.set(dateString, errorResult);
    return errorResult;
  }
};

export const formatDateWithTimeCached = formatDateWithTime;

export const formatRelativeTime = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Unknown';
  
  startRelativeCacheCleanup();
  
  const cached = relativeTimeCache.get(dateString);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < RELATIVE_CACHE_TTL) {
    return cached.formatted;
  }
  
  try {
    const date = new Date(dateString);
    const nowDate = new Date();
    
    if (isNaN(date.getTime())) {
      const result = 'Unknown';
      relativeTimeCache.set(dateString, { formatted: result, timestamp: now });
      return result;
    }
    
    const diffInMilliseconds = nowDate.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    let formatted: string;
    
    if (diffInMinutes < 1) {
      formatted = 'Just now';
    } else if (diffInMinutes < 60) {
      formatted = `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      formatted = `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      formatted = `${diffInDays}d ago`;
    } else {
      formatted = formatDateForDisplay(dateString);
    }
    
    relativeTimeCache.set(dateString, { formatted, timestamp: now });
    
    return formatted;
  } catch (error) {
    console.error('Relative time formatting error:', error);
    const errorResult = 'Unknown';
    relativeTimeCache.set(dateString, { formatted: errorResult, timestamp: now });
    return errorResult;
  }
};


export const isToday = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    const today = new Date();
    
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  } catch {
    return false;
  }
};

export const isYesterday = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return date.getDate() === yesterday.getDate() &&
           date.getMonth() === yesterday.getMonth() &&
           date.getFullYear() === yesterday.getFullYear();
  } catch {
    return false;
  }
};

export const formatDateShort = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Unknown';
  
  if (isToday(dateString)) {
    return 'Today';
  }
  
  if (isYesterday(dateString)) {
    return 'Yesterday';
  }
  
  return formatDateForDisplay(dateString);
};

export const formatDateForAPI = (date: Date): string => {
  return date.toISOString();
};

export const parseDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch {
    return null;
  }
};

export const getTimeDifference = (startDate: string, endDate: string): string => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Unknown duration';
    }
    
    const diffMs = Math.abs(end.getTime() - start.getTime());
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    } else {
      return 'Less than a minute';
    }
  } catch (error) {
    console.error('Time difference calculation error:', error);
    return 'Unknown duration';
  }
};

export const dateUtils = {
  clearCaches: clearDateCaches,
  getCacheStats: getDateCacheStats,
};