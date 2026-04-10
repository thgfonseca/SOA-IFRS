// pages/coordenador/home.js

const CoordHome = {
  render(body) {
    // Deduplica projetos por id
    const projetos   = [...new Map(SOA.projetos.map(p => [p.id, p])).values()];
    const inscricoes = SOA.inscricoes;
    const pendentes  = inscricoes.filter(i => i.status === 'Pendente').length;

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
    // Deduplica projetos por id
    const projetos = [...new Map(SOA.projetos.map(p => [p.id, p])).values()];
    let html = `<div class="ph"><div><h1>Meus Projetos</h1></div></div>`;

    if (projetos.length === 0) {
      html += `<div class="card">${emptyState('📁', 'Nenhum projeto vinculado a você ainda.')}</div>`;
    } else {
      projetos.forEach(p => {
        const temReq = p.requisitos || p.criterios;
        html += `<div class="card" style="padding:20px">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
                ${statusBadge(p.status)} ${segBadge(p.segmento)}
              </div>
              <div style="font-size:15px;font-weight:600;margin-bottom:4px">${p.titulo}</div>
              <div style="font-size:12px;color:var(--g5)">
                Edital: ${p.editalId || '—'} · Recurso: ${p.recurso || '—'} · Tipo: ${p.tipoProjeto || '—'}
              </div>
            </div>
            <button class="btn ${temReq ? 'bo' : 'bp'}" style="font-size:12px;white-space:nowrap"
              onclick="CoordRouter.ir('requisitos','${p.id}')">
              ${temReq ? '✏ Editar requisitos' : '📋 Preencher requisitos'}
            </button>
          </div>
        </div>`;
      });
    }
    body.innerHTML = html;
  }
};
