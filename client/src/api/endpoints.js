import { apiClient } from './client.js';

export const authApi = {
  login: (data) => apiClient.post('/auth/login', data),
  register: (data) => apiClient.post('/auth/register', data),
  quickLogin: (role) => apiClient.post(`/auth/quick-login/${role}`, {}),
  getMe: () => apiClient.get('/auth/me'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
};

export const spaceApi = {
  getDetails: () => apiClient.get('/space'),
  createSpace: (data) => apiClient.post('/space', data),
  updateSettings: (data) => apiClient.put('/space', data),
  getInvite: () => apiClient.get('/space/invite'),
  createInvite: () => apiClient.post('/space/invite', {}),
  joinSpace: (data) => apiClient.post('/space/join', data),
  leaveSpace: () => apiClient.post('/space/leave', {}),
};

export const messageApi = {
  getMessages: () => apiClient.get('/messages'),
  sendMessage: (data) => apiClient.post('/messages', data),
  markRead: () => apiClient.post('/messages/read', {}),
  reactToMessage: (id, reaction) => apiClient.put(`/messages/${id}/reaction`, { reaction }),
  editMessage: (id, content) => apiClient.patch(`/messages/${id}`, { content }),
  deleteMessage: (id) => apiClient.delete(`/messages/${id}`),
};

export const papApi = {
  getPaps: () => apiClient.get('/pap'),
  sendPap: (data) => apiClient.post('/pap', data),
  updatePap: (id, data) => apiClient.put(`/pap/${id}`, data),
  deletePap: (id) => apiClient.delete(`/pap/${id}`),
  toggleFavorite: (id) => apiClient.patch(`/pap/${id}/favorite`, {}),
};

export const memoryApi = papApi;


export const locationApi = {
  getState: () => apiClient.get('/location'),
  updateLocation: (data) => apiClient.post('/location/update', data),
  toggleConsent: (is_sharing_enabled) => apiClient.post('/location/toggle-consent', { is_sharing_enabled }),
  clearHistory: () => apiClient.delete('/location/history'),
};

export const milestoneApi = {
  getMilestones: () => apiClient.get('/milestones'),
  createMilestone: (data) => apiClient.post('/milestones', data),
  deleteMilestone: (id) => apiClient.delete(`/milestones/${id}`),
};

export const uploadApi = {
  uploadPhoto: async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return apiClient.post('/upload', formData);
  },
};
