import axios from 'axios';

const RENDER_URL = 'https://idea-managment.onrender.com/api';
const LOCAL_URL = 'http://localhost:5000/api';

// Chọn baseURL theo môi trường:
// - Nếu có REACT_APP_API_URL thì dùng nó
// - Nếu đang chạy trên localhost, ưu tiên LOCAL_URL
// - Ngược lại dùng RENDER_URL
const API_URL =
  process.env.REACT_APP_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? LOCAL_URL
    : RENDER_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper: thử gọi base chính, nếu lỗi 401/404/ECONNREFUSED thì thử base dự phòng
export async function getWithFallback<T = any>(path: string) {
  const primaryBase = api.defaults.baseURL || RENDER_URL;
  const secondaryBase = primaryBase.includes('localhost') ? RENDER_URL : LOCAL_URL;
  try {
    return await axios.get<T>(`${primaryBase}${path}`);
  } catch (err: any) {
    const status = err?.response?.status;
    const isConnRefused = err?.code === 'ECONNABORTED' || err?.message?.includes('ECONNREFUSED');
    if (status === 401 || status === 404 || isConnRefused) {
      return await axios.get<T>(`${secondaryBase}${path}`);
    }
    throw err;
  }
}

export async function putWithFallback<T = any>(path: string, body: any) {
  const primaryBase = api.defaults.baseURL || RENDER_URL;
  const secondaryBase = primaryBase.includes('localhost') ? RENDER_URL : LOCAL_URL;
  try {
    return await axios.put<T>(`${primaryBase}${path}`, body);
  } catch (err: any) {
    const status = err?.response?.status;
    const isConnRefused = err?.code === 'ECONNABORTED' || err?.message?.includes('ECONNREFUSED');
    if (status === 401 || status === 404 || isConnRefused) {
      return await axios.put<T>(`${secondaryBase}${path}`, body);
    }
    throw err;
  }
}

export default api;