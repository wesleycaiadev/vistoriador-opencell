import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, Inbox, Activity, CheckCircle, AlertTriangle, Filter, Edit2, Trash2, X, RotateCcw } from 'lucide-react';
import { getVistorias, importVistorias, deleteVistoria, updateVistoria } from '../utils/storage';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from 'recharts';
import * as XLSX from 'xlsx-js-style';
import { Badge } from './ui';

const CHART_COLORS = ['#1428A0', '#1E3BD4', '#3D5CE8', '#6B83F0', '#A3B0F7'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--surface-border)',
                borderRadius: '10px',
                padding: '10px 16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                fontSize: '13px',
            }}>
                <p style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{label}</p>
                <p style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
                    {payload[0].value} registro{payload[0].value !== 1 ? 's' : ''}
                </p>
            </div>
        );
    }
    return null;
};

export default function Dashboard() {
    const [vistorias, setVistorias] = useState([]);
    const [filterPaineis, setFilterPaineis] = useState('utilizado');
    const [filterDefeitos, setFilterDefeitos] = useState('todos');
    const [showAllPaineis, setShowAllPaineis] = useState(false);
    const [showAllDefeitos, setShowAllDefeitos] = useState(false);
    const [editingVistoria, setEditingVistoria] = useState(null);
    const fileInputRef = useRef(null);

    const loadData = () => setVistorias(getVistorias());

    useEffect(() => { loadData(); }, []);

    const total = vistorias.length;
    const utilizados = vistorias.filter(v => v.status === 'utilizado').length;
    const defeitos = vistorias.filter(v => v.status === 'defeito').length;
    const devolvidos = vistorias.filter(v => v.status === 'devolvido').length;

    const modelsCount = vistorias.reduce((acc, curr) => {
        acc[curr.modelo] = (acc[curr.modelo] || 0) + 1;
        return acc;
    }, {});

    const chartData = Object.keys(modelsCount)
        .map(key => ({ name: key, qtd: modelsCount[key] }))
        .sort((a, b) => b.qtd - a.qtd)
        .slice(0, 5);

    const handleExport = () => {
        if (vistorias.length === 0) { alert('Não há dados para exportar.'); return; }

        const headers = ['Categoria', 'Peça', 'Modelo', 'OS', 'Data', 'Hora', 'Técnico', 'Status'];
        const data = vistorias.map(v => [
            v.categoria === 'opencell' ? 'Painel (OpenCell)' : v.categoria === 'mainboard' ? 'Placa Principal' : v.categoria === 'fonte' ? 'Fonte de Alimentação' : 'Outros',
            v.peca || '-', v.modelo, v.os,
            v.data ? new Date(v.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '',
            v.hora || '-', v.tecnico,
            v.status === 'utilizado' ? 'USADO COM SUCESSO' : v.status === 'devolvido' ? 'VISTORIA' : 'DEFEITO',
        ]);

        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        ws['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 35 }, { wch: 30 }];
        const borderAll = { top: { style: 'thin', color: { rgb: 'E5E5E5' } }, bottom: { style: 'thin', color: { rgb: 'E5E5E5' } }, left: { style: 'thin', color: { rgb: 'E5E5E5' } }, right: { style: 'thin', color: { rgb: 'E5E5E5' } } };
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
                if (!ws[cellRef]) continue;
                let style = { font: { name: 'Arial', sz: 11, color: { rgb: '333333' } }, border: borderAll, alignment: { vertical: 'center', horizontal: 'left' } };
                if (R === 0) style = { font: { name: 'Arial', sz: 12, bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1428A0' } }, border: borderAll, alignment: { vertical: 'center', horizontal: 'center' } };
                ws[cellRef].s = style;
            }
        }
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Vistorias Oficiais');
        XLSX.writeFile(wb, `Relatorio_Opencell_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const workbook = XLSX.read(evt.target.result, { type: 'binary' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                if (jsonData.length <= 1) return alert('Planilha vazia ou inválida.');
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
                    if (typeof dataBruta === 'number') dataBruta = new Date((dataBruta - 25569) * 86400 * 1000).toISOString().split('T')[0];
                    const s = String(row[idxStatus]).toUpperCase();
                    let st = 'utilizado';
                    if (s.includes('DEFEITO')) st = 'defeito';
                    if (s.includes('SOBRA') || s.includes('VISTORIA') || s.includes('ROTA') || s.includes('NÃO') || s.includes('DEVOLVIDO')) st = 'devolvido';
                    parsedData.push({ peca: idxPeca !== -1 ? String(row[idxPeca] || '') : '', modelo: String(row[idxModelo] || ''), os: String(row[idxOs] || ''), data: dataBruta || new Date().toISOString().split('T')[0], tecnico: String(row[idxTecnico] || 'Não Informado'), status: st });
                }
                importVistorias(parsedData);
                alert(`${parsedData.length} registros importados!`);
                loadData();
            } catch { alert('Erro ao ler o arquivo.'); }
            e.target.value = null;
        };
        reader.readAsBinaryString(file);
    };

    const handleDelete = (id) => {
        if (window.confirm('Deseja realmente excluir esta vistoria permanentemente?')) { deleteVistoria(id); loadData(); }
    };

    const handleEditSave = (e) => {
        e.preventDefault();
        updateVistoria(editingVistoria.id, editingVistoria);
        setEditingVistoria(null);
        loadData();
    };

    const getStatusBadge = (status) => {
        const map = {
            utilizado: { variant: 'success', label: 'USADO' },
            devolvido: { variant: 'warning', label: 'VISTORIA' },
            defeito: { variant: 'danger', label: 'DEFEITO' },
        };
        const { variant, label } = map[status] || { variant: 'default', label: 'USADO' };
        return <Badge variant={variant}>{label}</Badge>;
    };

    const getCategoryLabel = (cat) => ({ opencell: 'Painel', mainboard: 'Placa', fonte: 'Fonte', outros: 'Outro' }[cat] || 'Painel');

    // Peças Aprovadas = tudo que foi utilizado com sucesso (independente da categoria)
    const paineisAprovados = vistorias.filter(v => v.status === 'utilizado');

    // Defeitos e Retornos = tudo que NÃO foi utilizado (devolvidos, vistorias, defeitos de fábrica)
    const defeitosOutros = vistorias.filter(v => v.status !== 'utilizado');

    const filteredPaineis = filterPaineis === 'todos' ? paineisAprovados : paineisAprovados.filter(v => v.status === filterPaineis);
    const filteredDefeitos = filterDefeitos === 'todos' ? defeitosOutros : defeitosOutros.filter(v => v.status === filterDefeitos);

    const displayedPaineis = showAllPaineis ? filteredPaineis.slice().reverse() : filteredPaineis.slice().reverse().slice(0, 5);
    const displayedDefeitos = showAllDefeitos ? filteredDefeitos.slice().reverse() : filteredDefeitos.slice().reverse().slice(0, 5);

    const TableRows = ({ items, emptyMsg }) => (
        <>
            {items.length === 0 ? (
                <tr>
                    <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>
                        {emptyMsg}
                    </td>
                </tr>
            ) : items.map((v) => (
                <tr key={v.id}>
                    <td style={{ fontSize: '12px', fontWeight: 'bold' }}>{getCategoryLabel(v.categoria)}</td>
                    <td>{v.peca || '-'}</td>
                    <td>{v.modelo || '-'}</td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '13px' }}>{v.os}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {v.data ? new Date(v.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}{' '}
                        <span style={{ opacity: 0.6 }}>{v.hora || ''}</span>
                    </td>
                    <td style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>{v.tecnico || 'Não Informado'}</td>
                    <td>{getStatusBadge(v.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setEditingVistoria(v)} className="btn-secondary" style={{ padding: '8px', height: 'auto', minWidth: 'auto', borderRadius: 'var(--radius-sm)' }} title="Editar">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(v.id)} className="btn-secondary" style={{ padding: '8px', height: 'auto', minWidth: 'auto', borderRadius: 'var(--radius-sm)' }} title="Excluir">
                                <Trash2 size={16} color="var(--color-danger)" />
                            </button>
                        </div>
                    </td>
                </tr>
            ))}
        </>
    );

    const DataTable = ({ items, displayed, showAll, onToggleShowAll, filterValue, onFilterChange, filterOptions, accentColor = 'var(--color-primary)', title, icon, emptyMsg }) => (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 24px' }}>
                    <span style={{ color: accentColor }}>{icon}</span>
                    <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>{title}</span>
                    <span style={{
                        background: accentColor === 'var(--color-primary)' ? 'rgba(20,40,160,0.1)' : 'rgba(244,63,94,0.1)',
                        color: accentColor,
                        fontSize: '11px', fontWeight: '700',
                        padding: '2px 8px', borderRadius: '20px'
                    }}>{items.length}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingRight: '20px' }}>
                    <Filter size={15} color="var(--gray-500)" />
                    <select
                        style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '8px', height: 'auto', backgroundPosition: 'right 8px center', minWidth: '130px' }}
                        value={filterValue}
                        onChange={(e) => onFilterChange(e.target.value)}
                    >
                        {filterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="data-table-wrapper" style={{ flex: 1, maxHeight: showAll ? '500px' : 'auto', overflowY: showAll ? 'auto' : 'visible' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Categoria</th><th>Peça</th><th>Modelo</th><th>Ordem de Serviço</th>
                            <th>Data / Hora</th><th>Técnico</th><th>Classificação</th><th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <TableRows items={displayed} emptyMsg={emptyMsg} />
                    </tbody>
                </table>
            </div>

            <div style={{ padding: '14px', display: 'flex', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--surface-border)' }}>
                {items.length > 5 && (
                    <button onClick={onToggleShowAll} className="btn-outline" style={{ height: '36px', fontSize: '12px' }}>
                        {showAll ? 'Mostrar Apenas Recentes' : `Ver todos os ${items.length} registros`}
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ paddingBottom: 'var(--spacing-2xl)', position: 'relative' }}>

            {/* Modal de Edição */}
            {editingVistoria && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', margin: '20px', position: 'relative' }}>
                        <button onClick={() => setEditingVistoria(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
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
                            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>Salvar Alterações</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Inteligência & Analytics</h2>
                    <p className="text-muted">Métricas de alto nível e gestão em tempo real do laboratório.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} />
                    <button className="btn-secondary" onClick={() => fileInputRef.current.click()}><Upload size={18} /> Importar Excel</button>
                    <button className="btn-primary" onClick={handleExport} style={{ padding: '0 24px', fontSize: '14px' }}><Download size={18} /> Baixar Relatório</button>
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
                    {/* KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-2xl)' }}>
                        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ background: 'rgba(20, 40, 160, 0.1)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
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
                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                                <RotateCcw size={28} color="var(--color-warning)" />
                            </div>
                            <div>
                                <p className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '4px' }}>Devoluções</p>
                                <h3 style={{ fontSize: '32px', color: 'var(--color-warning)', fontFamily: 'var(--font-display)' }}>{devolvidos}</h3>
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

                    {/* Gráfico Elegante */}
                    <div className="glass-card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>Top 5 Modelos Registrados</h3>
                                <p className="text-muted" style={{ fontSize: '13px' }}>Distribuição por volume de atendimento</p>
                            </div>
                        </div>
                        {chartData.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Sem dados suficientes para exibir.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 10, right: 16, bottom: 8, left: -16 }} barCategoryGap="35%">
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2B45E8" stopOpacity={1} />
                            <stop offset="100%" stopColor="#1428A0" stopOpacity={0.8} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fontWeight: 600, fill: 'var(--text-secondary)' }}
                        dy={8}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--text-muted)' }}
                        allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 6 }} />
                    <Bar dataKey="qtd" radius={[6, 6, 0, 0]} maxBarSize={45}>
                        <LabelList dataKey="qtd" position="top" style={{ fill: 'var(--text-secondary)', fontSize: '11px', fontWeight: '800' }} offset={10} />
                        {chartData.map((_, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={index === 0 ? 'url(#barGradient)' : `rgba(20, 40, 160, ${0.8 - index * 0.1})`} 
                                style={{ filter: index === 0 ? 'drop-shadow(0px 0px 8px rgba(43, 69, 232, 0.4))' : 'none' }}
                            />
                        ))}
                    </Bar>
                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Seção 1: Peças Aprovadas */}
                    <DataTable
                        title="Peças Aprovadas (Sucesso)"
                        icon={<CheckCircle size={18} />}
                        accentColor="var(--color-primary)"
                        items={filteredPaineis}
                        displayed={displayedPaineis}
                        showAll={showAllPaineis}
                        onToggleShowAll={() => setShowAllPaineis(p => !p)}
                        filterValue={filterPaineis}
                        onFilterChange={(v) => { setFilterPaineis(v); setShowAllPaineis(false); }}
                        filterOptions={[
                            { value: 'todos', label: 'Listar Todos' },
                            { value: 'utilizado', label: 'Usados' },
                        ]}
                        emptyMsg="Nenhuma peça aprovada encontrada."
                    />

                    {/* Seção 2: Defeitos e Outras Peças */}
                    <div style={{ marginTop: 'var(--spacing-xl)' }}>
                        <DataTable
                            title="Defeitos / Outras Peças"
                            icon={<AlertTriangle size={18} />}
                            accentColor="var(--color-danger)"
                            items={filteredDefeitos}
                            displayed={displayedDefeitos}
                            showAll={showAllDefeitos}
                            onToggleShowAll={() => setShowAllDefeitos(p => !p)}
                            filterValue={filterDefeitos}
                            onFilterChange={(v) => { setFilterDefeitos(v); setShowAllDefeitos(false); }}
                            filterOptions={[
                                { value: 'todos', label: 'Listar Todos' },
                                { value: 'devolvido', label: 'Devoluções (Rota)' },
                                { value: 'defeito', label: 'Defeitos de Fábrica' },
                            ]}
                            emptyMsg="Nenhum defeito ou outra peça registrada."
                        />
                    </div>
                </>
            )}
        </div>
    );
}
