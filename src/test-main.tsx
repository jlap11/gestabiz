import React from 'react'
import ReactDOM from 'react-dom/client'
import { TestSupabase } from './test-supabase'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestSupabase />
  </React.StrictMode>,
)
