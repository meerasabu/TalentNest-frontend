import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { API_BASE_URL } from './api/axiosConfig'
window.getImageUrl = (url) => {
  if (!url) return '';
  if (typeof url !== 'string') return url;
  if (url.startsWith('data:') || url.startsWith('http:') || url.startsWith('https:')) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
