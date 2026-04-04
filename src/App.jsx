import { useState, useEffect } from 'react'
import { Building2, Moon, Sun } from 'lucide-react'
import { useNetworkStatus } from './hooks/useNetworkStatus'
import { useVistoriaStore } from './store/useVistoriaStore'
import FormOpencell from './components/FormOpencell'
import Dashboard from './components/Dashboard'
import Joyride, { STATUS } from 'react-joyride'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('registro')
  const [runTutorial, setRunTutorial] = useState(false)
  const { isOnline } = useNetworkStatus()
  const { hydrateFromLegacy } = useVistoriaStore()

  useEffect(() => {
    hydrateFromLegacy()
  }, [hydrateFromLegacy])

  useEffect(() => {
    const isTutorialDone = localStorage.getItem('mscaju_tutorial_done')
    if (!isTutorialDone) {
      setRunTutorial(true)
    }
  }, [])

  const steps = [
    {
      target: 'body',
      placement: 'center',
      content: (
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '8px', color: '#1428A0' }}>Bem-vindo ao Samsung Smart Center! 🚀</h2>
          <p style={{ color: '#75758A', fontSize: '14px' }}>
            Este é o novo sistema tático para registro de painéis Opencell em bancada.
            Esqueça as planilhas soltas! Aqui tudo é automático, rápido e seguro.
          </p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: '.joyride-registro',
      content: (
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Passo 1: Registrar o Status</h3>
          <p style={{ fontSize: '14px' }}>Aba principal. Digite a O.S, Nome e a classificação: se o painel foi USADO, DEVOLVIDO (Sobra) ou possui DEFEITO.</p>
        </div>
      ),
    },
    {
      target: '.joyride-dashboard',
      content: (
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Passo 2: Inteligência e Analytics</h3>
          <p style={{ fontSize: '14px' }}>Toda O.S registrada vem pra cá! Acompanhe gráficos em tempo real, veja o Live Feed e controle seu laboratório como um gestor sênior.</p>
        </div>
      ),
    },
    {
      target: '.brand',
      content: (
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Pronto para voar!</h3>
          <p style={{ fontSize: '14px' }}>Você está no controle. Exporte relatórios para o Excel ou traga planilhas antigas. Vamos nessa! 🔥</p>
        </div>
      ),
    }
  ]

  const handleJoyrideCallback = (data) => {
    const { status } = data
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED]
    if (finishedStatuses.includes(status)) {
      setRunTutorial(false)
      localStorage.setItem('mscaju_tutorial_done', 'true')
    }
  }

  return (
    <>
      <Joyride
        steps={steps}
        run={runTutorial}
        continuous={true}
        showSkipButton={true}
        scrollToFirstStep={true}
        showProgress={true}
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#1428A0',
            zIndex: 10000,
            backgroundColor: '#ffffff',
            textColor: '#0A1450',
            arrowColor: '#ffffff',
          },
          buttonNext: {
            backgroundColor: '#1428A0',
            borderRadius: '100px',
            fontSize: '13px',
            fontWeight: '600'
          },
          buttonBack: {
            color: '#75758A',
            fontSize: '13px',
          },
          buttonSkip: {
            color: '#75758A',
            fontSize: '13px',
          },
          tooltip: {
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 24px 64px rgba(20, 40, 160, 0.12)'
          }
        }}
        locale={{
          back: 'Voltar',
          close: 'Fechar',
          last: 'Concluir',
          next: 'Próximo',
          skip: 'Pular',
        }}
      />

      <header className="header">
        <div className="container header-content">
          <a href="#" className="brand">
            <div className="brand-logo-box">
              <Building2 size={24} color="#FFFFFF" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>SAMSUNG SMART CENTER</h1>
            </div>
          </a>

          {!isOnline && (
            <div
              className="network-badge network-badge--offline"
              role="status"
              aria-live="polite"
              aria-label="Sem conexão, modo rascunho ativo"
            >
              <span className="network-badge__dot" aria-hidden="true" />
              <span className="network-badge__label">Offline (Rascunho)</span>
            </div>
          )}

          <nav className="nav-links">
            <div
              className={`nav-item joyride-registro ${activeTab === 'registro' ? 'active' : ''}`}
              onClick={() => setActiveTab('registro')}
              role="tab"
              tabIndex={0}
              aria-selected={activeTab === 'registro'}
              onKeyDown={(e) => e.key === 'Enter' && setActiveTab('registro')}
            >
              Registro
            </div>
            <div
              className={`nav-item joyride-dashboard ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
              role="tab"
              tabIndex={0}
              aria-selected={activeTab === 'dashboard'}
              onKeyDown={(e) => e.key === 'Enter' && setActiveTab('dashboard')}
            >
              Dashboard Gráfico
            </div>
          </nav>
        </div>
      </header>

      <main className="container" style={{ paddingBottom: '48px', paddingTop: '48px', minHeight: 'calc(100vh - 100px)' }}>
        {activeTab === 'registro' && <FormOpencell />}
        {activeTab === 'dashboard' && <Dashboard />}
      </main>
    </>
  )
}

export default App
