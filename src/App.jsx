import { useState } from 'react'
import { Monitor, Cpu, Sparkles } from 'lucide-react'
import FormOpencell from './components/FormOpencell'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('registro')

  return (
    <>
      <header className="header">
        <div className="container header-content">
          <div className="brand">
            <div className="brand-logo-box">
              <Cpu size={28} color="white" strokeWidth={1.5} />
            </div>
            <div className="brand-text">
              <span className="brand-title">MSCAJU</span>
              <span className="brand-subtitle">Smart Center</span>
            </div>
          </div>

          <nav className="nav-links">
            <div
              className={`nav-item ${activeTab === 'registro' ? 'active' : ''}`}
              onClick={() => setActiveTab('registro')}
            >
              Registro
            </div>
            <div
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard Gráfico
            </div>
          </nav>
        </div>
      </header>

      <main className="container" style={{ padding: '48px 0', minHeight: 'calc(100vh - 100px)' }}>
        {activeTab === 'registro' && <FormOpencell />}
        {activeTab === 'dashboard' && <Dashboard />}
      </main>
    </>
  )
}

export default App
