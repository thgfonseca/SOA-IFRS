// pages/admin/editais.js

const AdminEditais = {

  render(app) {
    const { editais } = SOA;
    let html = `<div class="ph">
      <div><h1>Editais</h1><p>${editais.length} edital(is) cadastrado(s)</p></div>
      <div class="phr">
        <button class="btn bp" onclick="AdminRouter.ir('cad-edital')">+ Novo edital</button>
      </div>
    </div>`;

    if (editais.length === 0) {
      html += `<div class="card">${emptyState('📋', 'Nenhum edital cadastrado ainda.')}</div>`;
    } else {
      const rows = editais.map(e => [
        `<div class="tm">${e.numero}</div><div class="ts">${e.tipo}</div>`,
        e.titulo,
        segBadge(e.segmento),
        `${e.vigIni} – ${e.vigFim}`,
        statusBadge(e.status),
        `<div class="acts">
          <button class="ab" onclick="AdminEditais.editar('${e.id}')">Editar</button>
          <button class="ab dg" onclick="AdminEditais.excluir('${e.id}','${e.titulo}')">Excluir</button>
        </div>`
      ]);
      html += `<div class="card">${buildTable(
        ['Número','Título','Segmento','Vigência','Status','Ações'], rows
      )}</div>`;
    }
    app.innerHTML = html;
  },

  form(app, dados = {}) {
    const segs  = ['Pesquisa','Ensino','Extensão','Indissociável'];
    const tipos = ['Bolsas','Auxílio','Fluxo Contínuo','Fomento Externo'];
    const stats = ['Rascunho','Publicado','Pendente','Encerrado'];

    app.innerHTML = `
    <div class="ph">
      <div><h1>${dados.id ? 'Editar' : 'Cadastrar'} edital</h1></div>
      <div class="phr"><button class="btn bo" onclick="AdminRouter.ir('editais')">Cancelar</button></div>
    </div>
    <div class="card">
      <div class="ch"><h3>Dados do edital</h3></div>
      <div class="fg">
        <div class="fl"><label>Número</label>
          <input class="inp" id="f-numero" value="${dados.numero||''}" placeholder="001/2025"></div>
        <div class="fl"><label>Título</label>
          <input class="inp" id="f-titulo" value="${dados.titulo||''}" placeholder="Edital 001/2025 — Bolsas..."></div>
        <div class="fl"><label>Segmento</label>
          <select class="sel" id="f-segmento">${selectOpts(segs, dados.segmento)}</select></div>
        <div class="fl"><label>Tipo</label>
          <select class="sel" id="f-tipo">${selectOpts(tipos, dados.tipo)}</select></div>
        <div class="fl"><label>Status</label>
          <select class="sel" id="f-status">${selectOpts(stats, dados.status||'Rascunho')}</select></div>
        <div class="fl"><label>Valor da bolsa (R$)</label>
          <input class="inp" id="f-bolsaValor" type="number" value="${dados.bolsaValor||700}"></div>
        <div class="fl"><label>CH semanal (h)</label>
          <input class="inp" id="f-bolsaCH" type="number" value="${dados.bolsaCH||20}"></div>
        <div class="fl"><label>Vagas</label>
          <input class="inp" id="f-vagas" type="number" value="${dados.vagas||''}"></div>
        <div class="fl"><label>Vigência início</label>
          <input class="inp" id="f-vigIni" value="${dados.vigIni||''}" placeholder="01/03/2025"></div>
        <div class="fl"><label>Vigência fim</label>
          <input class="inp" id="f-vigFim" value="${dados.vigFim||''}" placeholder="28/02/2026"></div>
        <div class="fl s2"><label>Descrição</label>
          <textarea class="inp" id="f-descricao" placeholder="Descrição do edital...">${dados.descricao||''}</textarea></div>
      </div>
      <div class="fa">
        <button class="btn bp" onclick="AdminEditais.salvar('${dados.id||''}')">💾 Salvar edital</button>
      </div>
    </div>`;
  },

  async salvar(id) {
    const dados = {
      id: id || null,
      numero:     val('f-numero'),
      titulo:     val('f-titulo'),
      segmento:   val('f-segmento'),
      tipo:       val('f-tipo'),
      status:     val('f-status'),
      bolsaValor: val('f-bolsaValor'),
      bolsaCH:    val('f-bolsaCH'),
      vagas:      val('f-vagas'),
      vigIni:     val('f-vigIni'),
      vigFim:     val('f-vigFim'),
      descricao:  val('f-descricao')
    };
    if (!dados.numero || !dados.titulo) { toast('⚠ Preencha número e título.'); return; }
    toast('⏳ Salvando...');
    try {
      const res = await API.salvarEdital(dados);
      if (id) {
        // atualiza em memória
        const idx = SOA.editais.findIndex(e => e.id === id);
        if (idx >= 0) SOA.editais[idx] = { ...SOA.editais[idx], ...dados };
      } else {
        SOA.editais.push({ ...dados, id: res.id });
      }
      toast('✓ Edital salvo!');
      AdminRouter.ir('editais');
    } catch(e) { toast('❌ ' + e.message); }
  },

  editar(id) {
    const e = SOA.editais.find(x => x.id === id);
    if (e) this.form(document.getElementById('app'), e);
  },

  excluir(id, titulo) {
    Modal.confirm(
      'Excluir edital', `Deseja excluir <strong>${titulo}</strong>? Esta ação não pode ser desfeita.`,
      async () => {
        toast('⏳ Excluindo...');
        try {
          await API.excluirEdital(id);
          SOA.editais = SOA.editais.filter(e => e.id !== id);
          toast('✓ Edital excluído.');
          AdminRouter.ir('editais');
        } catch(e) { toast('❌ ' + e.message); }
      }
    );
  }
};
