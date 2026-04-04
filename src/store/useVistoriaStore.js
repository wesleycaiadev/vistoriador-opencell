import { create } from 'zustand';
import { persist } from 'zustand/middleware';


const INITIAL_DRAFT = {
  categoria: 'opencell',
  peca: '',
  modelo: '',
  os: '',
  data: new Date().toISOString().split('T')[0],
  hora: new Date().toTimeString().substring(0, 5),
  tecnico: '',
  status: 'utilizado',
  defeitoComum: '',
};

export const useVistoriaStore = create(
  persist(
    (set, get) => ({
      draftForm: { ...INITIAL_DRAFT },
      vistorias: [],
      lastSavedAt: null,

      // === DRAFT ACTIONS ===

      updateDraft: (partial) =>
        set((state) => ({
          draftForm: { ...state.draftForm, ...partial },
          lastSavedAt: Date.now(),
        })),

      resetDraft: () =>
        set((state) => {
          const now = new Date();
          const tempoBR = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
          const dataBR = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
          return {
            draftForm: { 
              ...INITIAL_DRAFT, 
              data: dataBR, 
              hora: tempoBR,
              tecnico: state.draftForm.tecnico
            },
            lastSavedAt: null,
          };
        }),

      // === VISTORIA ACTIONS ===

      submitVistoria: () => {
        const { draftForm, vistorias } = get();

        const osExiste = vistorias.some((v) => v.os === draftForm.os);
        if (osExiste) return { success: false, reason: 'OS_DUPLICADA' };

        const novaVistoria = {
          ...draftForm,
          id: Date.now().toString(),
          dataCriacao: new Date().toISOString(),
        };

        set({
          vistorias: [...vistorias, novaVistoria],
          draftForm: {
            ...INITIAL_DRAFT,
            data: new Date().toISOString().split('T')[0],
            hora: new Date().toTimeString().substring(0, 5),
          },
          lastSavedAt: null,
        });

        syncToLegacyStorage([...vistorias, novaVistoria]);

        return { success: true };
      },

      deleteVistoria: (id) => {
        const updated = get().vistorias.filter((v) => v.id !== id);
        set({ vistorias: updated });
        syncToLegacyStorage(updated);
      },

      updateVistoria: (id, partial) => {
        const updated = get().vistorias.map((v) =>
          v.id === id ? { ...v, ...partial } : v
        );
        set({ vistorias: updated });
        syncToLegacyStorage(updated);
      },

      importVistorias: (dadosArray) => {
        const { vistorias } = get();
        const novos = dadosArray.map((v) => ({
          ...v,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          dataCriacao: new Date().toISOString(),
        }));
        const merged = [...vistorias, ...novos];
        set({ vistorias: merged });
        syncToLegacyStorage(merged);
        return novos.length;
      },

      // === HYDRATION ===

      hydrateFromLegacy: () => {
        try {
          const raw = localStorage.getItem('opencell_vistorias');
          if (!raw) return;
          const legacy = JSON.parse(raw);
          if (Array.isArray(legacy) && legacy.length > 0) {
            const { vistorias } = get();
            if (vistorias.length === 0) {
              set({ vistorias: legacy });
            }
          }
        } catch {
          /* localStorage corrompido — ignora silenciosamente */
        }
      },
    }),
    {
      name: 'vistoriador-opencell-store',
      // Persiste apenas os campos essenciais — exclui funções
      partialize: (state) => ({
        draftForm: state.draftForm,
        vistorias: state.vistorias,
        lastSavedAt: state.lastSavedAt,
      }),
    }
  )
);

function syncToLegacyStorage(vistorias) {
  try {
    localStorage.setItem('opencell_vistorias', JSON.stringify(vistorias));
  } catch {
    /* quota exceeded — fail silently */
  }
}
