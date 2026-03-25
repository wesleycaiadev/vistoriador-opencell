import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, Inbox, Activity, CheckCircle, AlertTriangle, Filter, Edit2, Trash2, X, Save } from 'lucide-react';
import { getVistorias, importVistorias, deleteVistoria, updateVistoria } from '../utils/storage';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import * as XLSX from 'xlsx-js-style';
import { Badge } from './ui';

export default function Dashboard() {
    const [vistorias, setVistorias] = useState([]);
    const [filterStatus, setFilterStatus] = useState('todos'); // 'todos', 'utilizado', 'devolvido', 'defeito'
    const [showAll, setShowAll] = useState(false);

    // Edit Modal State
    const [editingVistoria, setEditingVistoria] = useState(null);

    const fileInputRef = useRef(null);

    const loadData = () => {
        setVistorias(getVistorias());
    };

    useEffect(() => {
        loadData();
    }, []);

    const total = vistorias.length;
    const utilizados = vistorias.filter(v => v.status === 'utilizado').length;
    const defeitos = vistorias.filter(v => v.status === 'defeito').length;

    const modelsCount = vistorias.reduce((acc, curr) => {
        acc[curr.modelo] = (acc[curr.modelo] || 0) + 1;
        return acc;
    }, {});

    const chartData = Object.keys(modelsCount).map(key => ({
        name: key,
        Quantidade: modelsCount[key]
    })).sort((a, b) => b.Quantidade - a.Quantidade).slice(0, 5);

    const handleExport = () => {
        if (vistorias.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }

        const headers = ['Peça', 'Modelo', 'OS', 'Data', 'Técnico', 'Status'];
        const data = vistorias.map(v => [
            v.peca || '-',
            v.modelo,
            v.os,
            v.data ? new Date(v.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '',
            v.tecnico,
            v.status === 'utilizado' ? 'USADO COM SUCESSO' : v.status === 'devolvido' ? 'VISTORIA' : 'DEFEITO DE FÁBRICA'
        ]);

        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        ws['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 35 }, { wch: 30 }];

        const borderAll = {
            top: { style: 'thin', color: { rgb: "E5E5E5" } },
            bottom: { style: 'thin', color: { rgb: "E5E5E5" } },
            left: { style: 'thin', color: { rgb: "E5E5E5" } },
            right: { style: 'thin', color: { rgb: "E5E5E5" } }
        };

        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
                if (!ws[cellRef]) continue;

                let style = {
                    font: { name: 'Arial', sz: 11, color: { rgb: "333333" } },
                    border: borderAll,
                    alignment: { vertical: 'center', horizontal: 'left' }
                };

                if (R === 0) {
                    style = {
                        font: { name: 'Arial', sz: 12, bold: true, color: { rgb: "FFFFFF" } },
                        fill: { fgColor: { rgb: "1428A0" } },
                        border: borderAll,
                        alignment: { vertical: 'center', horizontal: 'center' }
                    };
                }
                else if (C === 5) {
                    const val = ws[cellRef].v;
                    let fgColor = "FFFFFF";
                    let fontColor = "0A1450";
                    if (val && val.includes('USADO')) {
                        fgColor = "FFEBEE"; fontColor = "FF3333";
                    } else if (val && val.includes('VISTORIA')) {
                        fgColor = "FFF8E1"; fontColor = "D49B00";
                    } else if (val && val.includes('DEFEITO')) {
                        fgColor = "FFEBEE"; fontColor = "FF3333";
                    }
                    style.font = { ...style.font, color: { rgb: fontColor }, bold: true };
                    style.fill = { fgColor: { rgb: fgColor } };
                    style.alignment = { vertical: 'center', horizontal: 'center' };
                }
                ws[cellRef].s = style;
            }
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Vistorias Oficiais");
        XLSX.writeFile(wb, `Relatorio_Opencell_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = evt.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                if (jsonData.length <= 1) return alert("Planilha vazia ou inválida.");

                const headersRow = jsonData[0].map(h => String(h).toUpperCase().trim());
                const idxPeca = headersRow.indexOf('PEÇA') !== -1 ? headersRow.indexOf('PEÇA') : headersRow.indexOf('PART NUMBER');
                const idxModelo = headersRow.indexOf('MODELO');
                const idxOs = headersRow.indexOf('OS');
                const idxData = headersRow.indexOf('DATA');
                const idxTecnico = headersRow.findIndex(h => h.includes('TÉCNICO') || h.includes('TECNICO'));
                const idxStatus = headersRow.indexOf('STATUS');

                const parsedData = [];
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || (!row[idxModelo] && !row[idxPeca])) continue;

                    let dataBruta = row[idxData];
                    if (typeof dataBruta === 'number') {
                        dataBruta = new Date((dataBruta - 25569) * 86400 * 1000).toISOString().split('T')[0];
                    }

                    const s = String(row[idxStatus]).toUpperCase();
                    let st = 'utilizado';
                    if (s.includes('DEFEITO')) st = 'defeito';
                    if (s.includes('SOBRA') || s.includes('VISTORIA') || s.includes('ROTA') || s.includes('NÃO') || s.includes('DEVOLVIDO')) st = 'devolvido';

                    parsedData.push({
                        peca: idxPeca !== -1 ? String(row[idxPeca] || '') : '',
                        modelo: String(row[idxModelo] || ''),
                        os: String(row[idxOs] || ''),
                        data: dataBruta || new Date().toISOString().split('T')[0],
                        tecnico: String(row[idxTecnico] || 'Não Informado'),
                        status: st
                    });
                }

                importVistorias(parsedData);
                alert(`${parsedData.length} registros importados!`);
                loadData();
            } catch (error) {
                alert("Erro ao ler o arquivo válido.");
            }
            e.target.value = null;
        };
        reader.readAsBinaryString(file);
    };

    const handleDelete = (id) => {
        if (window.confirm("Deseja realmente excluir esta vistoria permanentemente?")) {
            deleteVistoria(id);
            loadData();
        }
    };

    const handleEditSave = (e) => {
        e.preventDefault();
        updateVistoria(editingVistoria.id, editingVistoria);
        setEditingVistoria(null);
        loadData();
    };

    const getStatusBadge = (status) => {
        const variantMap = {
            utilizado: 'danger',
            devolvido: 'warning',
            defeito: 'danger'
        };
        const labelMap = {
            utilizado: 'USADO',
            devolvido: 'VISTORIA',
            defeito: 'DEFEITO'
        };

        return (
            <Badge variant={variantMap[status] || 'default'}>
                {labelMap[status] || 'USADO'}
            </Badge>
        );
    };

    const filteredVistorias = filterStatus === 'todos'
        ? vistorias
        : vistorias.filter(v => v.status === filterStatus);

    const displayedVistorias = showAll ? filteredVistorias.slice().reverse() : filteredVistorias.slice().reverse().slice(0, 5);

    return (
        <div className="animate-fade-in" style={{ paddingBottom: 'var(--spacing-2xl)', position: 'relative' }}>

            {/* Modal de Edição */}
            {editingVistoria && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', margin: '20px', position: 'relative' }}>
                        <button
                            onClick={() => setEditingVistoria(null)}
                            style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >
                            <X size={24} />
                        </button>
                        <h3 style={{ marginBottom: '24px' }}>Editar Vistoria (OS: {editingVistoria.os})</h3>
                        <form onSubmit={handleEditSave}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Peça</label>
                                    <input type="text" value={editingVistoria.peca || ''} onChange={(e) => setEditingVistoria({ ...editingVistoria, peca: e.target.value })} required />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Modelo</label>
                                    <input type="text" value={editingVistoria.modelo || ''} onChange={(e) => setEditingVistoria({ ...editingVistoria, modelo: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Técnico</label>
                                <input type="text" value={editingVistoria.tecnico} onChange={(e) => setEditingVistoria({ ...editingVistoria, tecnico: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select value={editingVistoria.status} onChange={(e) => setEditingVistoria({ ...editingVistoria, status: e.target.value })}>
                                    <option value="utilizado">Painel Usado com Sucesso</option>
                                    <option value="devolvido">Vistoria (Voltou de Rota)</option>
                                    <option value="defeito">Rejeitado (Defeito de Fábrica)</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                                Salvar Alterações
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Inteligência & Analytics</h2>
                    <p className="text-muted">
                        Métricas de alto nível e gestão em tempo real do laboratório.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} />
                    <button className="btn-secondary" onClick={() => fileInputRef.current.click()}>
                        <Upload size={18} /> Importar Excel
                    </button>
                    <button className="btn-primary" onClick={handleExport} style={{ padding: '0 24px', fontSize: '14px' }}>
                        <Download size={18} /> Baixar Relatório Mestre
                    </button>
                </div>
            </div>

            {vistorias.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '80px 24px' }}>
                    <div style={{ background: 'var(--surface-hover)', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-lg)' }}>
                        <Inbox size={40} color="var(--gray-500)" />
                    </div>
                    <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>Base de dados limpa</h3>
                    <p className="text-muted" style={{ maxWidth: '400px', margin: '0 auto' }}>
                        Ainda não há dados rastreáveis. Faça um registro manual na aba "Registro" ou importe sua antiga planilha do Excel.
                    </p>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-2xl)' }}>
                        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ background: 'rgba(20, 40, 160, 0.12)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                                <Activity size={28} color="var(--color-primary)" />
                            </div>
                            <div>
                                <p className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '4px' }}>Volume Total</p>
                                <h3 style={{ fontSize: '32px', color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>{total}</h3>
                            </div>
                        </div>

                        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ background: 'var(--status-success-bg)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                                <CheckCircle size={28} color="var(--color-success)" />
                            </div>
                            <div>
                                <p className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '4px' }}>Aproveitamento</p>
                                <h3 style={{ fontSize: '32px', color: 'var(--color-success)', fontFamily: 'var(--font-display)' }}>{utilizados}</h3>
                            </div>
                        </div>

                        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ background: 'var(--status-danger-bg)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                                <AlertTriangle size={28} color="var(--color-danger)" />
                            </div>
                            <div>
                                <p className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '4px' }}>Incidência de Falhas</p>
                                <h3 style={{ fontSize: '32px', color: 'var(--color-danger)', fontFamily: 'var(--font-display)' }}>{defeitos}</h3>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(500px, 2fr)', gap: 'var(--spacing-xl)' }}>
                        <div className="glass-card">
                            <h3 style={{ fontSize: '20px', marginBottom: 'var(--spacing-xl)' }}>Tendência de Modelos</h3>
                            <div style={{ height: '340px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 20, right: 30, bottom: 5, left: -20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: '600', fill: 'var(--gray-500)' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: '600', fill: 'var(--gray-500)' }} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(20, 40, 160, 0.06)' }}
                                            contentStyle={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-lg)', fontWeight: '600', padding: '14px', background: 'var(--surface-card)', color: 'var(--text-primary)' }}
                                            labelStyle={{ color: 'var(--text-secondary)' }}
                                        />
                                        <Bar dataKey="Quantidade" radius={[8, 8, 0, 0]} maxBarSize={48}>
                                            {
                                                chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-primary)' : 'rgba(20, 40, 160, 0.3)'} />
                                                ))
                                            }
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-border)' }}>
                                <h3 style={{ fontSize: '20px' }}>Feed de Movimentações</h3>

                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <Filter size={16} color="var(--gray-500)" />
                                    <select
                                        style={{ padding: '8px 12px', fontSize: '12px', borderRadius: 'var(--radius-sm)', height: 'auto', backgroundPosition: 'right 8px center' }}
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                    >
                                        <option value="todos">Todos os Status</option>
                                        <option value="utilizado">Usados</option>
                                        <option value="devolvido">Vistoria (Rota)</option>
                                        <option value="defeito">Defeitos</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto', flex: 1, maxHeight: showAll ? '500px' : 'auto' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Peça</th>
                                            <th>Modelo</th>
                                            <th>Ordem de Serviço</th>
                                            <th>Técnico</th>
                                            <th>Classificação</th>
                                            <th style={{ textAlign: 'right' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayedVistorias.map((vistoria) => (
                                            <tr key={vistoria.id}>
                                                <td>{vistoria.peca || '-'}</td>
                                                <td>{vistoria.modelo || '-'}</td>
                                                <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '13px' }}>{vistoria.os}</td>
                                                <td style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                                                    {vistoria.tecnico || 'Não Informado'}
                                                </td>
                                                <td>{getStatusBadge(vistoria.status)}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={() => setEditingVistoria(vistoria)}
                                                            className="btn-secondary"
                                                            style={{ padding: '8px', height: 'auto', minWidth: 'auto', borderRadius: 'var(--radius-sm)' }}
                                                            title="Editar Vistoria"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(vistoria.id)}
                                                            className="btn-secondary"
                                                            style={{ padding: '8px', height: 'auto', minWidth: 'auto', borderRadius: 'var(--radius-sm)', color: 'var(--color-danger)' }}
                                                            title="Deletar Vistoria"
                                                        >
                                                            <Trash2 size={16} color="var(--color-danger)" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {displayedVistorias.length === 0 && (
                                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>
                                        Nenhum registro corresponde a este filtro.
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '14px', display: 'flex', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--surface-border)' }}>
                                {filteredVistorias.length > 5 && (
                                    <button
                                        onClick={() => setShowAll(!showAll)}
                                        className="btn-outline"
                                        style={{ height: '36px', fontSize: '12px' }}
                                    >
                                        {showAll ? 'Mostrar Apenas Recentes' : `Ver todos os ${filteredVistorias.length} registros`}
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </>
            )}
        </div>
    );
}
