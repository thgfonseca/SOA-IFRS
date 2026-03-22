// js/api.js — Todas as chamadas ao Apps Script

const API = {

  // ── Leitura ─────────────────────────────────────
  async carregar() {
    const res = await fetch(CONFIG.API_URL + '?action=tudo');
    const data = await res.json();
    if (!data.ok) throw new Error(data.erro);
    return data;
  },

  // ── Editais ─────────────────────────────────────
  async salvarEdital(dados) {
    return API._post({ action: 'salvarEdital', ...dados });
  },

  async excluirEdital(id) {
    return API._post({ action: 'excluirEdital', id });
  },

  // ── Projetos ────────────────────────────────────
  async salvarProjeto(dados) {
    return API._post({ action: 'salvarProjeto', ...dados });
  },

  async excluirProjeto(id) {
    return API._post({ action: 'excluirProjeto', id });
  },

  // ── Inscrições ──────────────────────────────────
  async salvarInscricao(dados) {
    return API._post({ action: 'salvarInscricao', ...dados });
  },

  async avaliarInscricao(id, resultado, observacao = '') {
    return API._post({ action: 'avaliarInscricao', id, resultado, observacao });
  },

  // ── Assiduidade ─────────────────────────────────
  async salvarAssiduidade(dados) {
    return API._post({ action: 'salvarAssiduidade', ...dados });
  },

  // ── Interno ─────────────────────────────────────
  async _post(body) {
    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.erro);
    return data;
  }

};
