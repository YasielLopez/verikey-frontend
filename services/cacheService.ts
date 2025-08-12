import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; 
}

class CacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly CACHE_PREFIX = '@verikey_cache_'; 
  
  async get<T>(key: string, ttl: number = 60000): Promise<T | null> {
    const prefixedKey = `${this.CACHE_PREFIX}${key}`;
    
    const memEntry = this.memoryCache.get(prefixedKey);
    if (memEntry && Date.now() - memEntry.timestamp < memEntry.ttl) {
      console.log(`✅ Cache hit (memory): ${key}`);
      return memEntry.data;
    }
    
    try {
      const stored = await AsyncStorage.getItem(prefixedKey);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (Date.now() - entry.timestamp < entry.ttl) {
          console.log(`✅ Cache hit (storage): ${key}`);
          this.memoryCache.set(prefixedKey, entry);
          return entry.data;
        }
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
    
    console.log(`❌ Cache miss: ${key}`);
    return null;
  }
  
  async set<T>(key: string, data: T, ttl: number = 60000): Promise<void> {
    const prefixedKey = `${this.CACHE_PREFIX}${key}`;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    this.memoryCache.set(prefixedKey, entry);
    
    try {
      await AsyncStorage.setItem(prefixedKey, JSON.stringify(entry));
      console.log(`💾 Cache set: ${key}`);
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }
  
  async invalidate(key: string): Promise<void> {
    const prefixedKey = `${this.CACHE_PREFIX}${key}`;
    this.memoryCache.delete(prefixedKey);
    await AsyncStorage.removeItem(prefixedKey);
    console.log(`🗑️ Cache invalidated: ${key}`);
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    let memoryCleared = 0;
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern) || key.includes(`${this.CACHE_PREFIX}${pattern}`)) {
        this.memoryCache.delete(key);
        memoryCleared++;
      }
    }
    
    const keys = await AsyncStorage.getAllKeys();
    const keysToRemove = keys.filter(key => 
      key.includes(pattern) || key.includes(`${this.CACHE_PREFIX}${pattern}`)
    );
    
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
    
    console.log(`🗑️ Cache pattern invalidated: ${pattern} (${memoryCleared} memory, ${keysToRemove.length} storage entries)`);
  }
  
  async clear(): Promise<void> {
    try {
      const memoryCacheSize = this.memoryCache.size;
      this.memoryCache.clear();
      
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
      
      console.log(`🗑️ All cache cleared (${memoryCacheSize} memory, ${cacheKeys.length} storage entries)`);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
  
  async getStats(): Promise<{
    memoryEntries: number;
    storageEntries: number;
    memoryKeys: string[];
    storageKeys: string[];
  }> {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(key => key.startsWith(this.CACHE_PREFIX));
    
    const memoryKeys = Array.from(this.memoryCache.keys()).map(key => 
      key.replace(this.CACHE_PREFIX, '')
    );
    
    const storageKeys = cacheKeys.map(key => 
      key.replace(this.CACHE_PREFIX, '')
    );
    
    return {
      memoryEntries: this.memoryCache.size,
      storageEntries: cacheKeys.length,
      memoryKeys,
      storageKeys
    };
  }
  
  async cleanExpired(): Promise<void> {
    let cleanedMemory = 0;
    let cleanedStorage = 0;
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (Date.now() - entry.timestamp >= entry.ttl) {
        this.memoryCache.delete(key);
        cleanedMemory++;
      }
    }
    
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(key => key.startsWith(this.CACHE_PREFIX));
    
    for (const key of cacheKeys) {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const entry: CacheEntry<any> = JSON.parse(stored);
          if (Date.now() - entry.timestamp >= entry.ttl) {
            await AsyncStorage.removeItem(key);
            cleanedStorage++;
          }
        }
      } catch (error) {
        await AsyncStorage.removeItem(key);
        cleanedStorage++;
      }
    }
    
    if (cleanedMemory > 0 || cleanedStorage > 0) {
      console.log(`🧹 Cleaned expired cache: ${cleanedMemory} memory, ${cleanedStorage} storage entries`);
    }
  }
}

export const cacheService = new CacheService();