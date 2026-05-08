import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios';

axios.defaults.withCredentials = true;

if (import.meta.env.PROD) {
    axios.defaults.baseURL = 'http://10.0.2.2:8080';

    // Attach stored JWT as Bearer token on every request (mobile)
    axios.interceptors.request.use((config) => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    // Save token from login/signup responses
    axios.interceptors.response.use(
        (response) => {
            const token = response.data?.data?.token;
            if (token) {
                localStorage.setItem('jwt_token', token);
            }
            return response;
        },
        (err) => {
            console.error('[AXIOS ERROR]', err.message, err.config?.url, JSON.stringify(err.config?.baseURL));
            if (err.response?.status === 401) {
                localStorage.removeItem('jwt_token');
            }
            return Promise.reject(err);
        }
    );
} else {
    axios.interceptors.response.use(
        r => r,
        err => {
            console.error('[AXIOS ERROR]', err.message, err.config?.url, JSON.stringify(err.config?.baseURL));
            return Promise.reject(err);
        }
    );
}

createRoot(document.getElementById('root')).render(
  <>
    <App />
  </>
)
