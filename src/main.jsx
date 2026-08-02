import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/main.css'
import './styles/login.css'
import './styles/tree.css'
import './styles/form.css'
import './styles/responsive.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
