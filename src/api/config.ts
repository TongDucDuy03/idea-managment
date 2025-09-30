import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://idea-managment.onrender.com/api';
const LOCAL_FALLBACK_URL = process.env.REACT_APP_API_URL_FALLBACK || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getWithFallback<T = any>(path: string) {
  try {
    return await api.get<T>(path);
  } catch (err: any) {
    const status = err?.response?.status;
    // Fallback to local backend in dev if unauthorized/not found on primary
    if (status === 401 || status === 404) {
      return await axios.get<T>(`${LOCAL_FALLBACK_URL}${path}`);
    }
    throw err;
  }
}

export default api;