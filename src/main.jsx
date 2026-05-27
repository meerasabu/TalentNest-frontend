import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
window.getImageUrl = (url) => {
  if (!url) return '';
  if (typeof url !== 'string') return url;
  if (url.startsWith('data:') || url.startsWith('http:') || url.startsWith('https:')) {
    return url;
  }
  return window.getImageUrl(url);
};
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
