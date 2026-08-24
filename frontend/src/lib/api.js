const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';







async function apiCall(endpoint, options = {}) {
  const { method = 'GET', body, token } = options;

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// System Status API
export const systemApi = {
  getStatus: () => apiCall('/api/status')
};

// Hospital APIs
export const hospitalApi = {
  getAll: (params) => {
    const searchParams = new URLSearchParams();
    if (params?.city) searchParams.set('city', params.city);
    if (params?.state) searchParams.set('state', params.state);
    if (params?.bedType) searchParams.set('bedType', params.bedType);
    if (params?.hasAvailability) searchParams.set('hasAvailability', 'true');
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    return apiCall(`/api/hospitals?${searchParams}`);
  },

  search: (params) => {
    const searchParams = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
    });
    if (params.radius) searchParams.set('radius', params.radius.toString());
    if (params.bedType) searchParams.set('bedType', params.bedType);
    return apiCall(`/api/hospitals/search?${searchParams}`);
  },

  getById: (id) => apiCall(`/api/hospitals/${id}`),

  getStats: () => apiCall('/api/hospitals/stats/overview'),

  getPendingQueue: (token) => apiCall('/api/hospitals/pending/queue', { token }),

  verifyStatus: (id, status, token) =>
    apiCall(`/api/hospitals/${id}/verify`, { method: 'PATCH', body: { status }, token }),

  verify: (id, token) => apiCall(`/api/hospitals/${id}/verify`, { method: 'PATCH', body: { status: 'approved' }, token }),

  updateBeds: (id, beds, token) =>
    apiCall(`/api/hospitals/${id}/beds`, { method: 'PUT', body: { beds }, token }),

  reserveBed: (hospitalId, payload) =>
    apiCall(`/api/hospitals/${hospitalId}/reserve-bed`, { method: 'POST', body: payload }),

  requestOtp: (phone) =>
    apiCall('/api/hospitals/request-otp', { method: 'POST', body: { phone } }),

  verifyOtp: (phone, otp) =>
    apiCall('/api/hospitals/verify-otp', { method: 'POST', body: { phone, otp } }),

  confirmReservation: (code) =>
    apiCall(`/api/hospitals/reservations/${code}/confirm`, { method: 'POST' }),

  releaseReservation: (code) =>
    apiCall(`/api/hospitals/reservations/${code}/release`, { method: 'POST' }),
};

// Blood APIs
export const bloodApi = {
  search: (params) => {
    const searchParams = new URLSearchParams();
    if (params?.bloodGroup) searchParams.set('bloodGroup', params.bloodGroup);
    if (params?.city) searchParams.set('city', params.city);
    if (params?.minUnits) searchParams.set('minUnits', params.minUnits.toString());
    return apiCall(`/api/blood/search?${searchParams}`);
  },

  getBanks: (params) => {
    const searchParams = new URLSearchParams();
    if (params?.city) searchParams.set('city', params.city);
    if (params?.state) searchParams.set('state', params.state);
    return apiCall(`/api/blood/banks?${searchParams}`);
  },

  getStats: () => apiCall('/api/blood/stats/overview'),

  updateStock: (hospitalId, bloodStock, token) =>
    apiCall(`/api/blood/hospital/${hospitalId}`, { method: 'PUT', body: { bloodStock }, token }),
};

// Donor APIs
export const donorApi = {
  register: (data








) => apiCall('/api/donors/register', { method: 'POST', body: data }),

  search: (params) => {
    const searchParams = new URLSearchParams();
    if (params.bloodGroup) searchParams.set('bloodGroup', params.bloodGroup);
    if (params.city) searchParams.set('city', params.city);
    return apiCall(`/api/donors/search?${searchParams}`);
  },

  getStats: () => apiCall('/api/donors/stats'),
};

// Emergency APIs
export const emergencyApi = {
  createRequest: (data






) => apiCall('/api/emergency/request', { method: 'POST', body: data }),

  getRequest: (id) => apiCall(`/api/emergency/request/${id}`),

  getStats: () => apiCall('/api/emergency/stats'),

  getAll: (params, token) => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.priority) searchParams.set('priority', params.priority);
    return apiCall(`/api/emergency/admin/all?${searchParams}`, { token });
  },

  updateRequest: (id, data, token) =>
    apiCall(`/api/emergency/request/${id}`, { method: 'PUT', body: data, token }),
};

// Auth APIs
export const authApi = {
  login: (email, password) =>
    apiCall('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  getMe: (token) => apiCall('/api/auth/me', { token }),

  updatePassword: (currentPassword, newPassword, token) =>
    apiCall('/api/auth/password', {
      method: 'PUT',
      body: { currentPassword, newPassword },
      token,
    }),
};

export const api = {
  auth: authApi,
  hospitals: hospitalApi,
  blood: bloodApi,
  donors: donorApi,
  emergency: emergencyApi,
};

export default apiCall;
