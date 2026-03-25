// pages/coordenador/home.js

const CoordHome = {
  render(body) {
    const { projetos, inscricoes } = SOA;
    const pendentes = inscricoes.filter(i => i.status === 'Pendente').length;

    body.innerHTML = `
    <div class="ph"><div><h1>Painel do Coordenador</h1><p>Bem-vindo(a), ${SOA.perfil.nome}</p></div></div>
    <div class="stats">
      <div class="stat"><div class="stat-val">${projetos.length}</div><div class="stat-lbl">Projetos ativos</div></div>
      <div class="stat"><div class="stat-val" style="color:var(--pesq)">${inscricoes.length}</div><div class="stat-lbl">Inscrições recebidas</div></div>
      <div class="stat"><div class="stat-val" style="color:var(--exte)">${pendentes}</div><div class="stat-lbl">Pendentes de avaliação</div></div>
    </div>
    ${pendentes > 0 ? `<div class="notice"><strong>⚠ Inscrições pendentes</strong>Você tem ${pendentes} inscrição(ões) aguardando avaliação.</div>` : ''}
    <div class="card">
      <div class="ch"><h3>Ações rápidas</h3></div>
      <div style="display:flex;flex-direction:column;gap:8px;padding:16px">
        <button class="btn bo" style="height:42px;justify-content:flex-start"
          onclick="CoordRouter.ir('inscricoes')">✍ Avaliar inscrições pendentes</button>
        <button class="btn bo" style="height:42px;justify-content:flex-start"
          onclick="CoordRouter.ir('assiduidade')">✓ Registrar assiduidade</button>
        <button class="btn bo" style="height:42px;justify-content:flex-start"
          onclick="CoordRouter.ir('projetos')">📁 Ver meus projetos</button>
      </div>
    </div>`;
  },

  renderProjetos(body) {
    const { projetos } = SOA;
    let html = `<div class="ph"><div><h1>Meus Projetos</h1></div></div>`;
    if (projetos.length === 0) {
      html += `<div class="card">${emptyState('📁', 'Nenhum projeto vinculado a você ainda.')}</div>`;
    } else {
      projetos.forEach(p => {
        html += `<div class="card" style="padding:20px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            ${statusBadge(p.status)} ${segBadge(p.segmento)}
            <strong style="font-size:15px">${p.titulo}</strong>
          </div>
          <div style="font-size:12px;color:var(--g5)">
            Edital: ${p.editalId} · Recurso: ${p.recurso} · Tipo: ${p.tipoProjeto}
          </div>
        </div>`;
      });
    }
    body.innerHTML = html;
  }
};
