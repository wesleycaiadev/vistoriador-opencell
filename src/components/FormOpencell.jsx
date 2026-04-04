import { useState, useEffect } from 'react';
import { Save, CheckCircle2, ClipboardSignature, AlertTriangle, HardDrive, WifiOff, Barcode, Monitor, ClipboardList, User } from 'lucide-react';
import { useVistoriaStore } from '../store/useVistoriaStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const DEFEITOS_COMUNS = [
  { value: '', label: 'Nenhum defeito / Aprovado' },
  { value: 'linha_horizontal', label: 'Painel: Linha Horizontal' },
  { value: 'linha_vertical', label: 'Painel: Linha Vertical' },
  { value: 'cof_danificado', label: 'Painel: COF Danificado / Queimado' },
  { value: 'curto_vgh_vgl', label: 'Painel: Curto VGH/VGL' },
  { value: 'display_quebrado', label: 'Painel: Display Quebrado (Físico)' },
  { value: 'mancha_painel', label: 'Painel: Mancha / Vazamento' },
  { value: 'pixel_morto', label: 'Painel: Pixel Morto / Stuck' },
  { value: 'main_nao_liga', label: 'Main Board: Não Liga (Morta)' },
  { value: 'main_curto', label: 'Main Board: Em Curto' },
  { value: 'main_loop_logo', label: 'Main Board: Loop na Logo / Reiniciando' },
  { value: 'main_sem_imagem', label: 'Main Board: Liga sem Imagem' },
  { value: 'main_sem_som', label: 'Main Board: Sem Som' },
  { value: 'main_hdmi_falha', label: 'Main Board: Falha nas Entradas HDMI' },
  { value: 'fonte_nao_liga', label: 'Fonte: Morta (Sem Standby)' },
  { value: 'fonte_curto_primario', label: 'Fonte: Curto no Primário' },
  { value: 'fonte_curto_secundario', label: 'Fonte: Curto no Secundário' },
  { value: 'fonte_tensao_oscilando', label: 'Fonte: Tensões Oscilando' },
  { value: 'backlight_queimado', label: 'Backlight: Barra de LED Queimada' },
  { value: 'flat_cable_rompido', label: 'Cabos: Flat Cable Rompido' },
  { value: 'tcon_defeituosa', label: 'T-CON: Defeituosa / Sem Processamento de Vídeo' },
  { value: 'conector_quebrado', label: 'Conectores: Físicos Danificados' },
];

export default function FormOpencell() {
  const draftForm = useVistoriaStore((s) => s.draftForm);
  const updateDraft = useVistoriaStore((s) => s.updateDraft);
  const submitVistoria = useVistoriaStore((s) => s.submitVistoria);
  const resetDraft = useVistoriaStore((s) => s.resetDraft);
  const lastSavedAt = useVistoriaStore((s) => s.lastSavedAt);

  const { isOnline } = useNetworkStatus();

  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const hasDraft = Boolean(
    draftForm.peca || draftForm.modelo || draftForm.os || draftForm.tecnico
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateDraft({ [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const dataToSubmit = { 
      ...draftForm,
      status: draftForm.categoria !== 'opencell' ? 'defeito' : draftForm.status 
    };

    const result = submitVistoria(dataToSubmit);

    if (!result.success) {
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
      return;
    }

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  };

  const formatLastSaved = () => {
    if (!lastSavedAt) return '';
    const diff = Math.round((Date.now() - lastSavedAt) / 1000);
    if (diff < 5) return 'agora';
    if (diff < 60) return `${diff}s atrás`;
    return `${Math.floor(diff / 60)}min atrás`;
  };

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!lastSavedAt) return;
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, [lastSavedAt]);

  return (
    <div style={{ maxWidth: '720px', margin: '40px auto', position: 'relative', padding: '0 16px' }}>

      <div style={{
        position: 'absolute',
        top: showError ? '-80px' : '-60px',
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: showError ? 1 : 0,
        pointerEvents: showError ? 'auto' : 'none',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        backgroundColor: 'var(--color-danger)',
        color: 'white',
        padding: '14px 28px',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 12px 32px rgba(244,63,94,0.3)',
        zIndex: 51
      }}>
        <AlertTriangle size={20} color="white" />
        <span style={{ fontWeight: '600', fontSize: '15px' }}>Ordem de Serviço já registrada no sistema!</span>
      </div>

      <div style={{
        position: 'absolute',
        top: showSuccess ? '-80px' : '-60px',
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: showSuccess ? 1 : 0,
        pointerEvents: showSuccess ? 'auto' : 'none',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        backgroundColor: 'var(--surface-card)',
        color: 'white',
        padding: '14px 28px',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 50
      }}>
        <CheckCircle2 size={20} color="var(--status-success)" />
        <span style={{ fontWeight: '600', fontSize: '15px' }}>Vistoria documentada com sucesso!</span>
      </div>

      <div className="glass-card animate-fade-in" style={{ padding: 'var(--spacing-xl) var(--spacing-2xl)' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--color-primary), #0F1F7A)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 0 20px rgba(20,40,160,0.4)'
            }}>
              <ClipboardSignature size={28} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '28px', marginBottom: '4px' }}>Entrada de Vistoria</h2>
              <p className="text-muted" style={{ fontSize: '15px' }}>
                Registre o status final e a análise técnica do painel.
              </p>
            </div>
          </div>

          <div className={`draft-indicator ${hasDraft ? 'draft-indicator--visible' : ''} ${isOnline ? 'draft-indicator--saved' : 'draft-indicator--offline'}`}>
            {isOnline
              ? <HardDrive size={14} />
              : <WifiOff size={14} />
            }
            <span>
              {isOnline
                ? `Rascunho salvo ${formatLastSaved()}`
                : `Offline — rascunho seguro`
              }
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>

          <div>
            <div className="form-group">
              <label htmlFor="categoria">Categoria da Peça</label>
              <select
                id="categoria"
                name="categoria"
                value={draftForm.categoria || 'opencell'}
                onChange={handleChange}
                required
              >
                <option value="opencell">Painel (OpenCell)</option>
                <option value="mainboard">Placa Principal (Main Board)</option>
                <option value="fonte">Fonte de Alimentação (Power Board)</option>
                <option value="outros">Outro / Diversos</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="peca">Part Number (Peça)</label>
              <div className="input-icon-wrapper">
                <Barcode size={18} />
                <input
                  type="text"
                  id="peca"
                  name="peca"
                  className="input-with-icon"
                  value={draftForm.peca}
                  onChange={handleChange}
                  placeholder="Ex: BN96-07223A"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="modelo">Modelo do Produto</label>
              <div className="input-icon-wrapper">
                <Monitor size={18} />
                <input
                  type="text"
                  id="modelo"
                  name="modelo"
                  className="input-with-icon"
                  value={draftForm.modelo}
                  onChange={handleChange}
                  placeholder="Ex: UN50TU8000"
                  required
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          <div className="form-section-divider">Dados da Ordem de Serviço</div>
          <div>
            <div className="form-group">
              <label htmlFor="os">Ordem de Serviço (O.S)</label>
              <div className="input-icon-wrapper">
                <ClipboardList size={18} />
                <input
                  type="text"
                  id="os"
                  name="os"
                  className="input-with-icon"
                  value={draftForm.os}
                  onChange={handleChange}
                  placeholder="Ex: 4165551234"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label htmlFor="data">Data</label>
                <input
                  type="date"
                  id="data"
                  name="data"
                  value={draftForm.data}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="hora">Hora</label>
                <input
                  type="time"
                  id="hora"
                  name="hora"
                  value={draftForm.hora}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tecnico">Analista / Técnico</label>
              <div className="input-icon-wrapper">
                <User size={18} />
                <input
                  type="text"
                  id="tecnico"
                  name="tecnico"
                  className="input-with-icon"
                  value={draftForm.tecnico}
                  onChange={handleChange}
                  placeholder="Nome do responsável"
                  required
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          <div className="form-section-divider">Diagnóstico Técnico</div>

          <div className="form-group">
            <label htmlFor="defeitoComum">Defeito Identificado</label>
            <select
              id="defeitoComum"
              name="defeitoComum"
              value={draftForm.defeitoComum}
              onChange={handleChange}
            >
              {DEFEITOS_COMUNS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="status">Decisão / Status Final</label>
            <select
              id="status"
              name="status"
              value={draftForm.categoria !== 'opencell' ? 'defeito' : draftForm.status}
              onChange={handleChange}
              required
              disabled={draftForm.categoria !== 'opencell'}
              title={draftForm.categoria !== 'opencell' ? 'Status bloqueado para itens classificados fora de Painel' : ''}
            >
              <option value="utilizado">Painel Usado com Sucesso</option>
              <option value="devolvido">Vistoria (Voltou de Rota)</option>
              <option value="defeito">Rejeitado (Defeito de Componente)</option>
            </select>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '12px',
            marginTop: 'var(--space-lg)',
            borderTop: '1px solid var(--surface-border)',
            paddingTop: 'var(--space-lg)'
          }}>
            {hasDraft && (
              <button
                type="button"
                className="btn-outline"
                onClick={resetDraft}
                style={{ height: '44px' }}
              >
                Limpar Rascunho
              </button>
            )}
            <button type="submit" className="btn-primary" style={{ padding: '16px 36px', fontSize: '16px' }}>
              <Save size={20} />
              Processar Vistoria
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
