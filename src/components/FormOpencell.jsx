import React, { useState } from 'react';
import { Save, CheckCircle2, ClipboardSignature, AlertTriangle } from 'lucide-react';
import { addVistoria, getVistorias } from '../utils/storage';

export default function FormOpencell() {
    const [formData, setFormData] = useState({
        modelo: '',
        os: '',
        data: new Date().toISOString().split('T')[0],
        tecnico: '',
        status: 'utilizado'
    });

    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation: Check for duplicate OS
        const vistorias = getVistorias();
        const osExiste = vistorias.some(v => v.os === formData.os);

        if (osExiste) {
            setShowError(true);
            setTimeout(() => setShowError(false), 4000);
            return;
        }

        addVistoria(formData);

        // Feedback visual premium
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 4000);

        setFormData(prev => ({
            ...prev,
            modelo: '',
            os: '',
            status: 'utilizado'
        }));
    };

    return (
        <div style={{ maxWidth: '680px', margin: '40px auto', position: 'relative' }}>

            {/* Toast Error Notification */}
            <div style={{
                position: 'absolute',
                top: showError ? '-80px' : '-60px',
                left: '50%',
                transform: 'translateX(-50%)',
                opacity: showError ? 1 : 0,
                pointerEvents: showError ? 'auto' : 'none',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                backgroundColor: 'var(--status-danger)',
                color: 'white',
                padding: '14px 28px',
                borderRadius: '100px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 12px 32px rgba(255,51,51,0.3)',
                zIndex: 51
            }}>
                <AlertTriangle size={20} color="white" />
                <span style={{ fontWeight: '600', fontSize: '15px' }}>Ordem de Serviço já registrada no sistema!</span>
            </div>

            {/* Toast Success Notification */}
            <div style={{
                position: 'absolute',
                top: showSuccess ? '-80px' : '-60px',
                left: '50%',
                transform: 'translateX(-50%)',
                opacity: showSuccess ? 1 : 0,
                pointerEvents: showSuccess ? 'auto' : 'none',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                backgroundColor: 'var(--samsung-gray-900)',
                color: 'white',
                padding: '14px 28px',
                borderRadius: '100px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                zIndex: 50
            }}>
                <CheckCircle2 size={20} color="var(--status-success)" />
                <span style={{ fontWeight: '600', fontSize: '15px' }}>Vistoria documentada com sucesso!</span>
            </div>

            <div className="glass-card animate-fade-in" style={{ padding: 'var(--spacing-xl) var(--spacing-2xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: 'var(--spacing-2xl)' }}>
                    <div style={{ background: 'var(--primary-gradient)', padding: '12px', borderRadius: '16px', boxShadow: 'var(--shadow-glow)' }}>
                        <ClipboardSignature size={28} color="white" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '28px', marginBottom: '4px' }}>Entrada de Vistoria</h2>
                        <p className="text-muted" style={{ fontSize: '15px' }}>
                            Utilize o formulário oficial para registrar o status final da peça.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 var(--spacing-xl)' }}>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label htmlFor="modelo">Part Number / Modelo do Painel</label>
                            <input
                                type="text"
                                id="modelo"
                                name="modelo"
                                value={formData.modelo}
                                onChange={handleChange}
                                placeholder="Ex: BN95-07223A ou UN50TU8000"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="os">Ordem de Serviço</label>
                            <input
                                type="text"
                                id="os"
                                name="os"
                                value={formData.os}
                                onChange={handleChange}
                                placeholder="Ex: 4165551234"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="data">Data de Execução</label>
                            <input
                                type="date"
                                id="data"
                                name="data"
                                value={formData.data}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label htmlFor="tecnico">Analista / Técnico Responsável</label>
                            <input
                                type="text"
                                id="tecnico"
                                name="tecnico"
                                value={formData.tecnico}
                                onChange={handleChange}
                                placeholder="Nome completo do responsável no laboratório"
                                required
                            />
                        </div>

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label htmlFor="status">Decisão / Status Final</label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                required
                            >
                                <option value="utilizado">Painel Usado com Sucesso</option>
                                <option value="devolvido">Vistoria (Voltou de Rota)</option>
                                <option value="defeito">Rejeitado (Defeito de Fábrica / Danificado)</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-lg)', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 'var(--spacing-lg)' }}>
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
