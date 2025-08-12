import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { cacheService } from './cacheService';
import { formatDateWithTime } from './dateUtils';

const retryRequest = async (requestFn: () => Promise<any>, maxRetries = 3) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;
      if (i < maxRetries - 1 && (
        error.code === 'NETWORK_ERROR' || 
        error.message?.includes('Network Error') ||
        error.response?.status >= 500
      )) {
        console.log(`Retry attempt ${i + 1}/${maxRetries} after error:`, error.message);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

const getBaseUrl = () => {
  if (__DEV__) {
    return 'http://10.0.0.176:5000'; 
  }
  return 'https://your-production-api.com';
};

const BASE_URL = getBaseUrl();
console.log('🌐 API Base URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Token management
const TOKEN_KEY = 'verikey_token';

export const TokenManager = {
  async saveToken(token: string) {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      console.log('✅ Token saved successfully');
    } catch (error) {
      console.error('❌ Failed to save token:', error);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        console.log('✅ Token retrieved successfully');
      }
      return token;
    } catch (error) {
      console.error('❌ Failed to get token:', error);
      return null;
    }
  },

  async removeToken() {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      console.log('✅ Token removed successfully');
    } catch (error) {
      console.error('❌ Failed to remove token:', error);
    }
  },
};

// Add token to requests automatically
api.interceptors.request.use(
  async (config) => {
    const token = await TokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    const { response, config, message, code } = error;
    
    if (!response && (code === 'NETWORK_ERROR' || message?.includes('Network Error'))) {
      console.error('❌ Network Error:', message);
      return Promise.reject(new Error('Connection failed. Please check your internet connection and try again.'));
    }
    
    if (!response) {
      console.error('❌ Network Error:', message);
      return Promise.reject(new Error('Network connection failed'));
    }

    const status = response.status;
    const url = config?.url || 'unknown';
    console.error(`❌ API Error: ${config?.method?.toUpperCase()} ${url} - ${status}`);
    console.error('Response data:', response.data);

    if (status === 401) {
      console.log('🔑 Token expired, attempting refresh...');
      
      try {
        const refreshResponse = await AuthAPI.refreshToken();
        if (refreshResponse && refreshResponse.token) {
          const originalRequest = config;
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.log('Token refresh failed, removing token');
        await TokenManager.removeToken();
      }
    } else if (status === 403) {
      console.warn('Access denied');
    } else if (status === 404) {
      console.warn('📍 API endpoint not found:', url);
    } else if (status >= 500) {
      console.error('Server error, may retry automatically');
    }

    return Promise.reject(error);
  }
);

// User interface
export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  age?: number;
  screen_name?: string;
  profile_image_url?: string;
  profile_completed: boolean;
  created_at: string;
  profile_updated_at?: string;
  is_verified?: boolean;
  verified_at?: string;
  verification_level?: string;
}

export interface UserSearchResult {
  id: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  screen_name?: string;
  profile_image_url?: string;
  display_name: string;
  is_verified?: boolean;
}

export interface UIKeyData {
  id: number;
  title: string;
  type: 'received' | 'sent';
  status: 'active' | 'revoked' | 'viewed_out';
  from?: string;
  sharedWith?: string;
  views: string;
  viewsRemaining?: number;
  receivedOn?: string;
  sentOn?: string;
  lastViewed?: string;
  informationTypes: string[];
  shareableUrl?: string;
  notes?: string;
  user_data?: any;
  created_at?: string;
  isNew?: boolean;
}

export interface UIRequestData {
  id: number;
  title: string;
  type: 'received' | 'sent';
  status: 'pending' | 'completed' | 'denied' | 'cancelled';
  from?: string;
  sentTo?: string;
  receivedOn?: string;
  sentOn?: string;
  informationTypes: string[];
  notes?: string;
  shareableUrl?: string;
}

export const validateRecipient = (recipient: string): { isValid: boolean; type: 'email' | 'username' | 'unknown' } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(recipient)) {
    return { isValid: true, type: 'email' };
  }
  
  const cleanRecipient = recipient.startsWith('@') ? recipient.slice(1) : recipient;
  const usernameRegex = /^[a-zA-Z0-9_.]+$/;
  if (usernameRegex.test(cleanRecipient) && cleanRecipient.length >= 3 && cleanRecipient.length <= 30) {
    return { isValid: true, type: 'username' };
  }
  
  return { isValid: false, type: 'unknown' };
};

export const AuthAPI = {
  async login(credentials: { email: string; password: string }) {
    const response = await retryRequest(() => api.post('/auth/login', credentials));
    await TokenManager.saveToken(response.data.token);
    // Invalidate all cached data on login
    await cacheService.clear();
    return response.data;
  },

  async signupComplete(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    screen_name: string;
    date_of_birth: string;
  }) {
    const response = await retryRequest(() => api.post('/auth/signup', data));
    await TokenManager.saveToken(response.data.token);
    // Clear cache on signup
    await cacheService.clear();
    return response.data;
  },

  async checkUsername(username: string): Promise<{ available: boolean; error?: string }> {
    try {
      const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
      const response = await api.post('/auth/check-username', { 
        screen_name: cleanUsername 
      });
      return response.data;
    } catch (error: any) {
      console.error('Username check failed:', error);
      return { available: false, error: 'Failed to check username' };
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed, proceeding with local cleanup');
    } finally {
      await TokenManager.removeToken();
      await cacheService.clear();
    }
  },

  async verifyToken() {
    const response = await api.get('/auth/verify');
    return response.data;
  },

  async refreshToken() {
    try {
      const response = await api.post('/auth/refresh');
      if (response.data.token) {
        await TokenManager.saveToken(response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  },
};

export const ProfileAPI = {
  async getProfile(forceRefresh = false) {
    const cacheKey = 'profile_current';
    const cacheTTL = 60000; 
    
    if (!forceRefresh) {
      const cached = await cacheService.get(cacheKey, cacheTTL);
      if (cached) {
        console.log('📦 Using cached profile');
        return cached;
      }
    }
    
    const response = await api.get('/profile');
    const profile = response.data.profile;
    
    await cacheService.set(cacheKey, profile, cacheTTL);
    
    return profile;
  },

  async updateProfilePhoto(photoData: string) {
    const response = await api.post('/profile/photo', { 
      profile_photo_url: photoData 
    });
    await cacheService.invalidatePattern('profile_');
    return response.data;
  },

  async updateProfile(profileData: any) {
    const response = await api.post('/profile', profileData);
    await cacheService.invalidatePattern('profile_');
    return response.data;
  },

  async checkScreenName(screenName: string) {
    const response = await api.post('/profile/check-screen-name', { screen_name: screenName });
    return response.data;
  },

  async searchUsers(query: string): Promise<UserSearchResult[]> {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }
      
      if (!query.startsWith('@')) {
        return [];
      }
      
      const cacheKey = `user_search_${query.trim()}`;
      const cacheTTL = 30000;
      
      const cached = await cacheService.get<UserSearchResult[]>(cacheKey, cacheTTL);
      if (cached) {
        console.log(`📦 Using cached search results for "${query}"`);
        return cached;
      }
      
      const response = await api.get(`/users/search?q=${encodeURIComponent(query.trim())}`);
      const results = response.data.users || [];
      
      console.log(`🔍 User search for "${query}" returned ${results.length} results`);
      
      // Cache the results
      await cacheService.set(cacheKey, results, cacheTTL);
      
      return results;
    } catch (error) {
      console.error('User search failed:', error);
      return [];
    }
  },

  async lookupUser(identifier: string): Promise<UserSearchResult | null> {
    try {
      // Cache user lookups for 1 minute
      const cacheKey = `user_lookup_${identifier.trim()}`;
      const cacheTTL = 60000;
      
      const cached = await cacheService.get<UserSearchResult>(cacheKey, cacheTTL);
      if (cached) {
        console.log(`📦 Using cached lookup for "${identifier}"`);
        return cached;
      }
      
      const response = await api.post('/users/lookup', { identifier: identifier.trim() });
      const user = response.data.user || null;
      
      console.log(`🔍 User lookup for "${identifier}":`, user ? 'Found' : 'Not found');
      
      if (user) {
        await cacheService.set(cacheKey, user, cacheTTL);
      }
      
      return user;
    } catch (error) {
      console.error('User lookup failed:', error);
      return null;
    }
  },
};

export const KeysAPI = {
  async getAllKeys(forceRefresh = false): Promise<{sent: UIKeyData[]; received: UIKeyData[]}> {
    const cacheKey = 'keys_all';
    const cacheTTL = 30000; 
    
    if (!forceRefresh) {
      const cached = await cacheService.get<{sent: UIKeyData[]; received: UIKeyData[]}>(
        cacheKey, 
        cacheTTL
      );
      if (cached) {
        console.log('📦 Using cached keys');
        return cached;
      }
    }
    
    try {
      const response = await api.get('/keys');
      
      // Transform data once
      const result = {
        sent: this.transformShareableKeysToUI(
          response.data.sent_keys || response.data.keys || [], 
          'sent'
        ),
        received: this.transformShareableKeysToUI(
          response.data.received_keys || [], 
          'received'
        )
      };
      
      console.log(`✅ Loaded keys: ${result.sent.length} sent, ${result.received.length} received`);
      
      // Cache the result
      await cacheService.set(cacheKey, result, cacheTTL);
      
      return result;
    } catch (error) {
      console.error('Failed to get all keys:', error);
      
      // Try to return cached data even if expired
      const cached = await cacheService.get<{sent: UIKeyData[]; received: UIKeyData[]}>(
        cacheKey, 
        Infinity
      );
      
      if (cached) {
        console.log('⚠️ Using expired cache due to network error');
        return cached;
      }
      
      return { sent: [], received: [] };
    }
  },

  async getKeyDetails(keyId: number, forceRefresh = false) {
    const cacheKey = `key_details_${keyId}`;
    const cacheTTL = 60000; 
    
    if (!forceRefresh) {
      const cached = await cacheService.get(cacheKey, cacheTTL);
      if (cached) {
        console.log(`📦 Using cached details for key ${keyId}`);
        return cached;
      }
    }
    
    try {
      const response = await api.get(`/keys/${keyId}/details`);
      const keyDetails = response.data.key_details;
      
      console.log('✅ Raw key details from API:', keyDetails);
      
      // Cache the details
      await cacheService.set(cacheKey, keyDetails, cacheTTL);
      
      return keyDetails;
    } catch (error) {
      console.error('Failed to get key details:', error);
      
      // Try to return cached data even if expired
      const cached = await cacheService.get(cacheKey, Infinity);
      if (cached) {
        console.log('⚠️ Using expired cache for key details');
        return cached;
      }
      
      throw error;
    }
  },

  // Create a new shareable key with cache invalidation
  async createShareableKey(keyData: any) {
    console.log('🚀 Creating shareable key with data:', keyData);
    const response = await api.post('/keys', keyData);
    console.log('✅ Key created successfully:', response.data);
    
    // Invalidate all keys cache
    await cacheService.invalidatePattern('keys_');
    
    return response.data;
  },

  async revokeShareableKey(keyId: number) {
    console.log(`🚫 Revoking key with ID: ${keyId}`);
    const response = await api.post(`/keys/${keyId}/revoke`);
    console.log('✅ Key revoked successfully');
    
    // Invalidate keys cache and specific key details
    await cacheService.invalidatePattern('keys_');
    await cacheService.invalidate(`key_details_${keyId}`);
    
    return response.data;
  },

  async deleteShareableKey(keyId: number) {
    console.log(`🗑️ Deleting key with ID: ${keyId}`);
    const response = await api.delete(`/keys/${keyId}`);
    console.log('✅ Key deleted successfully');
    
    // Invalidate keys cache and specific key details
    await cacheService.invalidatePattern('keys_');
    await cacheService.invalidate(`key_details_${keyId}`);
    
    return response.data;
  },

  async removeReceivedKey(keyId: number) {
    console.log(`📦 Moving key ${keyId} to old section`);
    const response = await api.post(`/keys/${keyId}/remove`);
    console.log('✅ Key moved to old section');
    
    await cacheService.invalidatePattern('keys_');
    await cacheService.invalidate(`key_details_${keyId}`);
    
    return response.data;
  },

  // Transform keys with proper view and status handling
  transformShareableKeysToUI(keys: any[], type: 'sent' | 'received' = 'sent'): UIKeyData[] {
    return keys.map(key => {
      let displayName = 'Unknown';
      if (type === 'sent') {
        if (key.sharedWith) {
          displayName = key.sharedWith;
        } else if (key.recipient && key.recipient.screen_name) {
          displayName = `@${key.recipient.screen_name}`;
        } else if (key.recipient && key.recipient.email) {
          displayName = key.recipient.email;
        } else if (key.recipient_email) {
          displayName = key.recipient_email;
        }
      } else {
        if (key.from) {
          displayName = key.from;
        } else if (key.creator && key.creator.screen_name) {
          displayName = `@${key.creator.screen_name}`;
        } else if (key.creator && key.creator.name) {
          displayName = key.creator.name;
        } else if (key.creator && key.creator.email) {
          displayName = key.creator.email;
        }
      }

      // Ensure dates are properly formatted
      const createdAt = key.created_at || key.sentOn || key.receivedOn;
      const lastViewedAt = key.last_viewed_at || key.lastViewed;

      return {
        id: key.id,
        title: key.label || key.title || 'Untitled Key',
        type: type,
        status: this.mapKeyStatus(key.status),
        [type === 'sent' ? 'sharedWith' : 'from']: displayName,
        views: this.formatViewsDisplay(key.views_used || 0, key.views_allowed || 1),
        viewsRemaining: Math.max(0, (key.views_allowed || 1) - (key.views_used || 0)),
        [type === 'sent' ? 'sentOn' : 'receivedOn']: createdAt ? this.formatDate(createdAt) : 'Unknown',
        lastViewed: lastViewedAt ? this.formatDate(lastViewedAt) : 'Not Viewed',
        informationTypes: key.information_types || key.informationTypes || [],
        notes: key.notes,
        user_data: key.user_data,
        created_at: createdAt, 
        isNew: type === 'received' && key.views_used === 0 && key.status === 'active',
      };
    });
  },

  // Format views display
  formatViewsDisplay(viewsUsed: number, viewsTotal: number): string {
    if (viewsTotal === 999) return 'Unlimited';
    return `${Math.max(0, viewsUsed)}/${viewsTotal}`;
  },

  mapKeyStatus(backendStatus: string): 'active' | 'revoked' | 'viewed_out' {
    if (backendStatus === 'revoked') return 'revoked';
    if (backendStatus === 'viewed_out') return 'viewed_out';
    if (backendStatus === 'removed') return 'revoked'; 
    return 'active'; 
  },

  formatDate(dateString: string): string {
    return formatDateWithTime(dateString);
  },
};

// RequestsAPI with caching
export const RequestsAPI = {
  // Get verification requests with caching
  async getRequests(forceRefresh = false): Promise<{received: UIRequestData[]; sent: UIRequestData[]}> {
    const cacheKey = 'requests_all';
    const cacheTTL = 30000; // 30 seconds
    
    if (!forceRefresh) {
      const cached = await cacheService.get<{received: UIRequestData[]; sent: UIRequestData[]}>(
        cacheKey,
        cacheTTL
      );
      if (cached) {
        console.log('📦 Using cached requests');
        return cached;
      }
    }
    
    try {
      const response = await api.get('/requests');
      const result = this.transformRequestsToUI(response.data);
      
      // Cache the result
      await cacheService.set(cacheKey, result, cacheTTL);
      
      return result;
    } catch (error) {
      console.error('Failed to get requests:', error);
      
      // Try to return cached data even if expired
      const cached = await cacheService.get<{received: UIRequestData[]; sent: UIRequestData[]}>(
        cacheKey,
        Infinity
      );
      
      if (cached) {
        console.log('⚠️ Using expired cache for requests');
        return cached;
      }
      
      return { received: [], sent: [] };
    }
  },

  async createRequest(requestData: any) {
    const response = await api.post('/requests', requestData);
    
    // Invalidate requests cache
    await cacheService.invalidatePattern('requests_');
    
    return response.data;
  },

  // Create shareable request
  async createShareableRequest(requestData: any) {
    const response = await api.post('/requests/shareable', requestData);
    
    // Invalidate requests cache
    await cacheService.invalidatePattern('requests_');
    
    return response.data;
  },

  // Update request endpoint
  async updateRequest(requestId: number, requestData: any) {
    console.log(`📝 Updating request with ID: ${requestId}`, requestData);
    const response = await api.put(`/requests/${requestId}`, requestData);
    console.log('✅ Request updated successfully');
    
    // Invalidate requests cache
    await cacheService.invalidatePattern('requests_');
    
    return response.data;
  },

  async deleteRequest(requestId: number) {
    console.log(`🗑️ Deleting request with ID: ${requestId}`);
    const response = await api.delete(`/requests/${requestId}`);
    console.log('✅ Request deleted successfully');
    
    // Invalidate requests cache
    await cacheService.invalidatePattern('requests_');
    
    return response.data;
  },

  // Cancel a request (legacy - sets status to cancelled)
  async cancelRequest(requestId: number) {
    console.log(`🚫 Cancelling request with ID: ${requestId}`);
    const response = await api.post(`/requests/${requestId}/cancel`);
    console.log('✅ Request cancelled successfully');
    
    // Invalidate requests cache
    await cacheService.invalidatePattern('requests_');
    
    return response.data;
  },

  // Deny a request
  async denyRequest(requestId: number) {
    const response = await api.post(`/requests/${requestId}/deny`);
    
    // Invalidate requests cache
    await cacheService.invalidatePattern('requests_');
    
    return response.data;
  },

  // Transform backend requests to UI format
  transformRequestsToUI(data: any): {received: UIRequestData[]; sent: UIRequestData[]} {
    const sentRequests = (data.sent || data.sent_requests || []).map((req: any) => ({
      id: req.id,
      title: req.label || req.title || 'Verification Request',
      type: 'sent' as const,
      status: req.status,
      sentTo: req.sentTo || req.target_email || 'Unknown',
      sentOn: req.created_at ? this.formatDate(req.created_at) : req.sentOn || 'Unknown',
      informationTypes: req.information_types || req.informationTypes || [],
      notes: req.notes || '',
      shareableUrl: req.shareable_url,
    }));

    const receivedRequests = (data.received || data.received_requests || []).map((req: any) => ({
      id: req.id,
      title: req.label || req.title || 'Verification Request',
      type: 'received' as const,
      status: req.status,
      from: req.requester_email || req.from || 'Unknown',
      receivedOn: req.created_at ? this.formatDate(req.created_at) : req.receivedOn || 'Unknown',
      informationTypes: req.information_types || req.informationTypes || [],
      notes: req.notes || '',
    }));

    return {
      sent: sentRequests,
      received: receivedRequests,
    };
  },

  formatDate(dateString: string): string {
    return formatDateWithTime(dateString);
  },
};

export const VerificationAPI = {
  // Submit verification response
  async submitVerification(verificationData: any) {
    const response = await api.post('/verifications', verificationData);
    
    // Invalidate requests cache since verification may change request status
    await cacheService.invalidatePattern('requests_');
    
    return response.data;
  },

  // Get verification details with caching
  async getVerification(verificationId: number, forceRefresh = false) {
    const cacheKey = `verification_${verificationId}`;
    const cacheTTL = 60000; 
    
    if (!forceRefresh) {
      const cached = await cacheService.get(cacheKey, cacheTTL);
      if (cached) {
        console.log(`📦 Using cached verification ${verificationId}`);
        return cached;
      }
    }
    
    const response = await api.get(`/verifications/${verificationId}`);
    const verification = response.data;
    
    // Cache the verification
    await cacheService.set(cacheKey, verification, cacheTTL);
    
    return verification;
  },
};

export interface KYCVerificationData {
  document_type: 'drivers_license' | 'passport' | 'national_id';
  id_front_image?: string;
  id_back_image?: string;
  verification_selfie?: string;
  manual_data: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  };
}

export interface KYCStatusResponse {
  verified: boolean;
  verification?: {
    id: number;
    verification_id: string;
    document_type: string;
    status: 'pending' | 'processing' | 'approved' | 'rejected' | 'needs_review';
    created_at: string;
    updated_at: string;
    manual_data: any;
  };
  can_retry: boolean;
  next_steps: string;
}

export const KYCAPI = {
  async submitVerification(verificationData: KYCVerificationData) {
    try {
      const response = await api.post('/kyc/verify', verificationData);
      console.log('✅ KYC verification submitted successfully');
      
      // Invalidate KYC status cache
      await cacheService.invalidate('kyc_status');
      
      return response.data;
    } catch (error: any) {
      console.error('❌ KYC verification submission failed:', error);
      throw error;
    }
  },

  async getVerificationStatus(forceRefresh = false): Promise<KYCStatusResponse> {
    const cacheKey = 'kyc_status';
    const cacheTTL = 300000; 
    
    if (!forceRefresh) {
      const cached = await cacheService.get<KYCStatusResponse>(cacheKey, cacheTTL);
      if (cached) {
        console.log('📦 Using cached KYC status');
        return cached;
      }
    }
    
    try {
      const response = await api.get('/kyc/status');
      const status = response.data;
      
      console.log('✅ KYC status retrieved');
      
      // Cache the status
      await cacheService.set(cacheKey, status, cacheTTL);
      
      return status;
    } catch (error: any) {
      console.error('❌ Failed to get KYC status:', error);
      
      // Try to return cached data even if expired
      const cached = await cacheService.get<KYCStatusResponse>(cacheKey, Infinity);
      if (cached) {
        console.log('⚠️ Using expired KYC status cache');
        return cached;
      }
      
      // Return default status if endpoint fails
      return {
        verified: false,
        can_retry: true,
        next_steps: 'Submit identity verification to get verified status'
      };
    }
  },

  async retryVerification() {
    try {
      const response = await api.post('/kyc/retry');
      console.log('✅ KYC retry approved');
      
      // Invalidate KYC status cache
      await cacheService.invalidate('kyc_status');
      
      return response.data;
    } catch (error: any) {
      console.error('❌ KYC retry failed:', error);
      throw error;
    }
  },

  // Admin endpoints (if needed)
  async getPendingVerifications() {
    try {
      const response = await api.get('/admin/kyc/pending');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get pending verifications:', error);
      throw error;
    }
  },

  async reviewVerification(verificationId: string, decision: 'approved' | 'rejected', notes?: string) {
    try {
      const response = await api.post(`/admin/kyc/${verificationId}/review`, {
        decision,
        notes
      });
      console.log('✅ KYC verification reviewed');
      
      // Invalidate related caches
      await cacheService.invalidatePattern('kyc_');
      
      return response.data;
    } catch (error: any) {
      console.error('❌ KYC review failed:', error);
      throw error;
    }
  },
};

export default api;