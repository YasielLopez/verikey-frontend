import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Your Flask backend URL (change this to your deployed URL when ready)
const BASE_URL = 'http://10.0.0.176:5000';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'verikey_token';

export const TokenManager = {
  async saveToken(token: string) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  async removeToken() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

// Add token to requests automatically
api.interceptors.request.use(
  async (config) => {
    const token = await TokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await TokenManager.removeToken();
    }
    return Promise.reject(error);
  }
);

// API Types
export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  screen_name?: string;
  profile_image_url?: string;
  profile_completed: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
}

export interface ProfileRequest {
  first_name: string;
  last_name: string;
  screen_name: string;
  profile_image?: string;
}

export interface VerificationRequest {
  target_email: string;
}

export interface VerificationResponse {
  request_id: number;
  photo_url: string;
  latitude: number;
  longitude: number;
}

export const AuthAPI = {
  async login(credentials: LoginRequest) {
    const response = await api.post('/login', credentials);
    const { token } = response.data;
    if (token) {
      await TokenManager.saveToken(token);
    }
    return response.data;
  },

  async signup(credentials: SignupRequest) {
    const response = await api.post('/signup', credentials);
    const { token } = response.data;
    if (token) {
      await TokenManager.saveToken(token);
    }
    return response.data;
  },

  async logout() {
    await TokenManager.removeToken();
  },

  async verifyToken() {
    return await api.get('/verify-token');
  },
};

export const ProfileAPI = {
  async getProfile(): Promise<User> {
    const response = await api.get('/api/profile');
    return response.data;
  },

  async updateProfile(profile: ProfileRequest) {
    const response = await api.post('/api/profile', profile);
    return response.data;
  },

  async checkScreenName(screenName: string) {
    const response = await api.post('/api/profile/check-screen-name', {
      screen_name: screenName,
    });
    return response.data;
  },

  async updateProfileImage(imageUrl: string) {
    const response = await api.post('/api/profile/image', {
      profile_image: imageUrl,
    });
    return response.data;
  },
};

export const VerificationAPI = {
  async createRequest(request: VerificationRequest) {
    const response = await api.post('/requests', request);
    return response.data;
  },

  async getRequests() {
    const response = await api.get('/requests');
    return response.data;
  },

  async submitVerification(verification: VerificationResponse) {
    const response = await api.post('/verifications', verification);
    return response.data;
  },

  async getVerification(id: number) {
    const response = await api.get(`/verifications/${id}`);
    return response.data;
  },
};

export default api;