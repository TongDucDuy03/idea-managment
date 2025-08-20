import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://idea-managment.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api; 