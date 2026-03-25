// pages/admin/projetos.js

const AdminProjetos = {

  render(app) {
    const { projetos } = SOA;
    let html = `<div class="ph">
      <div><h1>Ações / Projetos</h1><p>${projetos.length} projeto(s)</p></div>
      <div class="phr"><button class="btn bp" onclick="AdminRouter.ir('cad-projeto')">+ Nova ação</button></div>
    </div>`;

    if (projetos.length === 0) {
      html += `<div class="card">${emptyState('📁', 'Nenhum projeto cadastrado ainda.')}</div>`;
    } else {
      const rows = projetos.map(p => [
        `<div class="tm">${p.titulo}</div>`,
        `<span style="font-size:12px">${p.editalId}</span>`,
        segBadge(p.segmento),
        `<div class="tm">${p.coordNome}</div><div class="ts">${p.coordEmail}</div>`,
        statusBadge(p.status),
        `<div class="acts">
          <button class="ab" onclick="AdminProjetos.editar('${p.id}')">Editar</button>
          <button class="ab dg" onclick="AdminProjetos.excluir('${p.id}','${p.titulo}')">Excluir</button>
        </div>`
      ]);
      html += `<div class="card">${buildTable(
        ['Título','Edital','Segmento','Coordenador','Status','Ações'], rows
      )}</div>`;
    }
    app.innerHTML = html;
  },

  form(app, dados = {}) {
    const segs  = ['Pesquisa','Ensino','Extensão','Indissociável'];
    const tipos = ['Projeto','Programa','Evento','Curso'];
    const stats = ['Ativo','Pendente','Encerrado'];
    const optsEditais = SOA.editais.map(e =>
      `<option value="${e.id}"${dados.editalId===e.id?' selected':''}>${e.numero} — ${e.titulo}</option>`
    ).join('');

    app.innerHTML = `
    <div class="ph">
      <div><h1>${dados.id ? 'Editar' : 'Nova'} ação</h1></div>
      <div class="phr"><button class="btn bo" onclick="AdminRouter.ir('projetos')">Cancelar</button></div>
    </div>
    <div class="card">
      <div class="ch"><h3>Dados do projeto</h3></div>
      <div class="fg">
        <div class="fl s2"><label>Edital</label>
          <select class="sel" id="p-edital"><option value="">Selecione...</option>${optsEditais}</select></div>
        <div class="fl s2"><label>Título</label>
          <input class="inp" id="p-titulo" value="${dados.titulo||''}" placeholder="Título do projeto"></div>
        <div class="fl"><label>Segmento</label>
          <select class="sel" id="p-segmento">${selectOpts(segs, dados.segmento)}</select></div>
        <div class="fl"><label>Tipo</label>
          <select class="sel" id="p-tipo">${selectOpts(tipos, dados.tipoProjeto)}</select></div>
        <div class="fl"><label>E-mail do coordenador</label>
          <input class="inp" id="p-coordEmail" value="${dados.coordEmail||''}" placeholder="coord@riogrande.ifrs.edu.br"></div>
        <div class="fl"><label>Nome do coordenador</label>
          <input class="inp" id="p-coordNome" value="${dados.coordNome||''}" placeholder="Nome completo"></div>
        <div class="fl"><label>Recurso</label>
          <input class="inp" id="p-recurso" value="${dados.recurso||''}" placeholder="AIPCTI, PAIEX..."></div>
        <div class="fl"><label>Status</label>
          <select class="sel" id="p-status">${selectOpts(stats, dados.status||'Ativo')}</select></div>
      </div>
      <div class="fa">
        <button class="btn bp" onclick="AdminProjetos.salvar('${dados.id||''}')">💾 Salvar projeto</button>
      </div>
    </div>`;
  },

  async salvar(id) {
    const dados = {
      id:          id || null,
      editalId:    val('p-edital'),
      titulo:      val('p-titulo'),
      segmento:    val('p-segmento'),
      tipoProjeto: val('p-tipo'),
      coordEmail:  val('p-coordEmail'),
      coordNome:   val('p-coordNome'),
      recurso:     val('p-recurso'),
      status:      val('p-status')
    };
    if (!dados.titulo || !dados.editalId) { toast('⚠ Preencha edital e título.'); return; }
    toast('⏳ Salvando...');
    try {
      const res = await API.salvarProjeto(dados);
      if (id) {
        const idx = SOA.projetos.findIndex(p => p.id === id);
        if (idx >= 0) SOA.projetos[idx] = { ...SOA.projetos[idx], ...dados };
      } else {
        SOA.projetos.push({ ...dados, id: res.id });
      }
      toast('✓ Projeto salvo!');
      AdminRouter.ir('projetos');
    } catch(e) { toast('❌ ' + e.message); }
  },

  editar(id) {
    const p = SOA.projetos.find(x => x.id === id);
    if (p) this.form(document.getElementById('app'), p);
  },

  excluir(id, titulo) {
    Modal.confirm(
      'Excluir projeto', `Deseja excluir <strong>${titulo}</strong>?`,
      async () => {
        try {
          await API.excluirProjeto(id);
          SOA.projetos = SOA.projetos.filter(p => p.id !== id);
          toast('✓ Projeto excluído.');
          AdminRouter.ir('projetos');
        } catch(e) { toast('❌ ' + e.message); }
      }
    );
  }
};
