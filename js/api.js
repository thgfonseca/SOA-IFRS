// js/api.js — Chamadas ao Apps Script com token

const API = {

  async carregar(token) {
    const url  = `${CONFIG.API_URL}?action=tudo&token=${encodeURIComponent(token)}`;
    const res  = await fetch(url);
    const data = await res.json();
    return data;
  },

  async salvarEdital(dados)   { return API._post({ action:'salvarEdital',   ...dados }); },
  async excluirEdital(id)     { return API._post({ action:'excluirEdital',   id }); },
  async salvarProjeto(dados)  { return API._post({ action:'salvarProjeto',  ...dados }); },
  async excluirProjeto(id)    { return API._post({ action:'excluirProjeto',  id }); },
  async salvarInscricao(d)    { return API._post({ action:'salvarInscricao', ...d }); },
  async avaliarInscricao(id, resultado, obs='') {
    return API._post({ action:'avaliarInscricao', id, resultado, observacao:obs });
  },
  async salvarAssiduidade(d)  { return API._post({ action:'salvarAssiduidade', ...d }); },

  async _post(body) {
    const res  = await fetch(CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify({ ...body, token: SOA.token || '' })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.erro);
    return data;
  }
};
