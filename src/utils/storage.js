const STORAGE_KEY = 'opencell_vistorias';

export const getVistorias = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error("Erro ao ler dados do localStorage", e);
        return [];
    }
};

export const addVistoria = (vistoria) => {
    const vistorias = getVistorias();
    const novaVistoria = {
        ...vistoria,
        id: Date.now().toString(),
        dataCriacao: new Date().toISOString()
    };
    vistorias.push(novaVistoria);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vistorias));
    return novaVistoria;
};

export const clearVistorias = () => {
    localStorage.removeItem(STORAGE_KEY);
};

export const importVistorias = (dadosArray) => {
    const vistorias = getVistorias();

    const novosRegistros = dadosArray.map(vistoria => ({
        ...vistoria,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        dataCriacao: new Date().toISOString()
    }));

    const atualizadas = [...vistorias, ...novosRegistros];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizadas));

    return novosRegistros.length;
};

export const updateVistoria = (id, vistoriaAtualizada) => {
    const vistorias = getVistorias();
    const index = vistorias.findIndex(v => v.id === id);
    if (index !== -1) {
        vistorias[index] = { ...vistorias[index], ...vistoriaAtualizada };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(vistorias));
    }
};

export const deleteVistoria = (id) => {
    const vistorias = getVistorias();
    const atualizadas = vistorias.filter(v => v.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizadas));
};
