import React from 'react'
import ReactDOM from 'react-dom/client'
import { injectSpeedInsights } from '@vercel/speed-insights'
import App from './App.jsx'
import { SpeedInsights } from "@vercel/speed-insights/react"
import './index.css'

// Initialize Vercel Speed Insights for performance monitoring
injectSpeedInsights()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SpeedInsights>
      <App />
    </SpeedInsights>
  </React.StrictMode>,
)