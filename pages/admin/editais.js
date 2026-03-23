// pages/admin/editais.js

const AdminEditais = {

  _filtroSeg: 'todos',
  _filtroStatus: '',

  render(app) {
    const { editais } = SOA;
    app.innerHTML = `
    <div class="ph">
      <div>
        <h1>Editais</h1>
        <p>${editais.length} edital(is) cadastrado(s)</p>
      </div>
      <div class="phr">
        <div class="export-wrap" id="exp-editais">
          <button class="btn bd" onclick="AdminEditais.toggleExport()">↓ Exportar</button>
          <div class="export-menu">
            <div class="export-item" onclick="AdminEditais.exportar('pdf')">📄 PDF</div>
            <div class="export-item" onclick="AdminEditais.exportar('xlsx')">📊 Excel</div>
            <div class="export-item" onclick="AdminEditais.exportar('csv')">📋 CSV</div>
          </div>
        </div>
        <button class="btn bp" onclick="AdminRouter.ir('cad-edital')">+ Novo edital</button>
      </div>
    </div>

    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center">
      ${[
        {seg:'todos',        cor:'#00843D',       label:'Todos'},
        {seg:'Ensino',       cor:'var(--ensi)',   label:'Ensino'},
        {seg:'Pesquisa',     cor:'var(--pesq)',   label:'Pesquisa'},
        {seg:'Extensão',     cor:'var(--exte)',   label:'Extensão'},
        {seg:'Indissociável',cor:'var(--indi)',   label:'Indissociável'},
      ].map(s => `
        <button class="segbtn ${AdminEditais._filtroSeg===s.seg?'on':''}"
          style="--sc:${s.cor}"
          onclick="AdminEditais.filtrarSeg('${s.seg}',this)">
          <span class="segdot" style="background:${s.cor}"></span>${s.label}
        </button>`).join('')}
      <div style="width:1px;height:24px;background:var(--g3);margin:0 4px"></div>
      <select class="sel" id="filtro-status-ed"
        style="width:auto;max-width:180px;height:32px;font-size:12px"
        onchange="AdminEditais.filtrarStatus(this.value)">
        <option value="">Todos os status</option>
        <option value="Publicado">Publicado</option>
        <option value="Rascunho">Rascunho</option>
        <option value="Pendente">Pendente</option>
        <option value="Encerrado">Encerrado</option>
      </select>
    </div>

    <div id="ebar" style="height:3px;border-radius:2px;margin-bottom:14px;
      background:linear-gradient(to right,var(--ensi),var(--pesq),var(--exte));
      transition:background .3s"></div>

    <div id="cnt-editais" style="font-size:12px;color:var(--g4);margin-bottom:12px"></div>

    <div class="card">
      <table id="tbl-editais">
        <thead><tr>
          <th>Número / Tipo</th><th>Título</th><th>Segmento</th>
          <th>Vigência</th><th>Status</th><th>Ações</th>
          <th style="font-size:10px;color:var(--g4)">Criado em</th>
        </tr></thead>
        <tbody id="tbody-editais"></tbody>
      </table>
      <div id="editais-empty" style="display:none;padding:48px;text-align:center;color:var(--g4)">
        <div style="font-size:32px;margin-bottom:10px;opacity:.3">📋</div>
        <div>Nenhum edital encontrado para este filtro.</div>
      </div>
    </div>`;

    AdminEditais.renderRows();
    document.addEventListener('click', AdminEditais._fecharExport);
  },

  renderRows() {
    const tbody = document.getElementById('tbody-editais');
    if (!tbody) return;

    let lista = SOA.editais.filter(e => {
      const segOk    = AdminEditais._filtroSeg === 'todos' || e.segmento === AdminEditais._filtroSeg;
      const statusOk = !AdminEditais._filtroStatus || e.status === AdminEditais._filtroStatus;
      return segOk && statusOk;
    });

    const cnt   = document.getElementById('cnt-editais');
    const empty = document.getElementById('editais-empty');
    const tbl   = document.getElementById('tbl-editais');

    if (cnt)   cnt.innerHTML = `Mostrando <strong style="color:var(--tx)">${lista.length}</strong> de <strong style="color:var(--tx)">${SOA.editais.length}</strong> registros`;
    if (empty) empty.style.display = lista.length === 0 ? '' : 'none';
    if (tbl)   tbl.style.display   = lista.length === 0 ? 'none' : '';

    tbody.innerHTML = lista.map(e => `
      <tr>
        <td><div class="tm">${e.numero}</div><div class="ts">${e.tipo||''}</div></td>
        <td><div class="tm">${e.titulo}</div></td>
        <td>${segBadge(e.segmento)}</td>
        <td style="font-size:12px;white-space:nowrap">${e.vigIni||''} – ${e.vigFim||''}</td>
        <td>${statusBadge(e.status)}</td>
        <td>
          <div class="acts">
            <button class="ab" onclick="AdminEditais.toggleNotif('${e.id}')" title="Notificação">🔔</button>
            <button class="ab" onclick="AdminEditais.toggleVer('${e.id}')">Ver</button>
            <button class="ab" onclick="AdminEditais.editar('${e.id}')">Editar</button>
            <button class="ab" onclick="AdminEditais.duplicar('${e.id}')">Duplicar</button>
            <button class="ab dg" onclick="AdminEditais.excluir('${e.id}','${e.titulo.replace(/'/g,"\\'")}')">Excluir</button>
          </div>
        </td>
        <td style="font-size:11px;color:var(--g4)">${e.criadoEm||''}</td>
      </tr>

      <!-- Painel Ver -->
      <tr id="ver-${e.id}" style="display:none">
        <td colspan="7" style="padding:0">
          <div style="background:#f0f9ff;border-top:2px solid #bae6fd;padding:20px 24px">
            <div style="font-size:13px;font-weight:600;color:#0e4d6b;margin-bottom:14px">
              👁 ${e.numero} — ${e.titulo}
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:12px">
              <div><div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Segmento</div>${segBadge(e.segmento)}</div>
              <div><div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Tipo</div><span style="font-size:13px">${e.tipo||'—'}</span></div>
              <div><div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Status</div>${statusBadge(e.status)}</div>
              <div><div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Vigência</div><span style="font-size:13px">${e.vigIni||''} – ${e.vigFim||''}</span></div>
              <div><div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Bolsa</div><span style="font-size:13px">R$ ${e.bolsaValor||'—'} / ${e.bolsaCH||'—'}h/sem</span></div>
              <div><div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Vagas</div><span style="font-size:13px">${e.vagas||'—'}</span></div>
            </div>
            ${e.descricao ? `<div style="font-size:13px;color:var(--g5);line-height:1.6;margin-bottom:12px">${e.descricao}</div>` : ''}
            <div style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid #bae6fd;padding-top:12px">
              <button class="btn bo" style="height:30px;font-size:12px" onclick="AdminEditais.toggleVer('${e.id}')">Fechar</button>
              <button class="btn bp" style="height:30px;font-size:12px" onclick="AdminEditais.editar('${e.id}')">✏ Editar</button>
            </div>
          </div>
        </td>
      </tr>

      <!-- Painel Notificação -->
      <tr id="notif-${e.id}" style="display:none">
        <td colspan="7" style="padding:0">
          <div style="background:#fffbeb;border-top:2px solid #fde68a;padding:20px 24px">
            <div style="font-size:13px;font-weight:600;color:#854d0e;margin-bottom:14px">
              🔔 Notificação — ${e.titulo}
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
              <div class="fl">
                <label>Destinatários</label>
                <div style="display:flex;gap:12px;flex-wrap:wrap;padding:10px;background:var(--g1);border:1.5px solid var(--g3);border-radius:8px">
                  ${['Bolsistas','Voluntários','Coordenadores'].map(d =>
                    `<label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer;font-weight:400;text-transform:none;letter-spacing:0">
                      <input type="checkbox" checked style="accent-color:var(--green)"> ${d}
                    </label>`).join('')}
                </div>
              </div>
              <div class="fl">
                <label>Tipo de notificação</label>
                <select class="sel" id="ntipo-${e.id}" onchange="AdminEditais.preencherNotif('${e.id}',this.value)">
                  <option value="">Selecione...</option>
                  <option value="relatorio">Relatório pendente</option>
                  <option value="assiduidade">Assiduidade pendente</option>
                  <option value="documentacao">Documentação incompleta</option>
                  <option value="livre">Mensagem livre</option>
                </select>
              </div>
              <div class="fl">
                <label>Assunto</label>
                <input class="inp" id="nassunto-${e.id}" style="height:36px" placeholder="Assunto do e-mail">
              </div>
              <div class="fl">
                <label>Mensagem</label>
                <textarea class="inp" id="nmsg-${e.id}" style="height:80px" placeholder="Mensagem..."></textarea>
              </div>
            </div>
            <div style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid #fde68a;padding-top:12px">
              <button class="btn bo" style="height:30px;font-size:12px" onclick="AdminEditais.toggleNotif('${e.id}')">Cancelar</button>
              <button class="btn bp" style="height:30px;font-size:12px" onclick="AdminEditais.enviarNotif('${e.id}')">✉ Enviar notificação</button>
            </div>
          </div>
        </td>
      </tr>
    `).join('');
  },

  // ── Filtros ───────────────────────────────────
  filtrarSeg(seg, btn) {
    AdminEditais._filtroSeg = seg;
    document.querySelectorAll('.segbtn').forEach(b => b.classList.remove('on'));
    if (btn) btn.classList.add('on');
    const cores = {
      todos:         'linear-gradient(to right,var(--ensi),var(--pesq),var(--exte))',
      Ensino:        'var(--ensi)',
      Pesquisa:      'var(--pesq)',
      'Extensão':    'var(--exte)',
      Indissociável: 'var(--indi)'
    };
    const bar = document.getElementById('ebar');
    if (bar) bar.style.background = cores[seg] || cores.todos;
    AdminEditais.renderRows();
  },

  filtrarStatus(v) {
    AdminEditais._filtroStatus = v;
    AdminEditais.renderRows();
  },

  // ── Painéis ───────────────────────────────────
  toggleVer(id) {
    const row   = document.getElementById('ver-' + id);
    if (!row) return;
    const aberto = row.style.display !== 'none';
    document.querySelectorAll('[id^="ver-"],[id^="notif-"]').forEach(r => r.style.display = 'none');
    if (!aberto) row.style.display = '';
  },

  toggleNotif(id) {
    const row   = document.getElementById('notif-' + id);
    if (!row) return;
    const aberto = row.style.display !== 'none';
    document.querySelectorAll('[id^="ver-"],[id^="notif-"]').forEach(r => r.style.display = 'none');
    if (!aberto) row.style.display = '';
  },

  preencherNotif(id, tipo) {
    const tpls = {
      relatorio:    { ass: 'SOA/IFRS — Relatório Pendente',      msg: 'Prezado(a),\n\nO relatório está pendente. Acesse o SOA e regularize.\n\nAtenciosamente,\nSecretaria Acadêmica — IFRS Campus Rio Grande' },
      assiduidade:  { ass: 'SOA/IFRS — Assiduidade Pendente',    msg: 'Prezado(a),\n\nO registro de assiduidade está pendente.\n\nAtenciosamente,\nSecretaria Acadêmica — IFRS Campus Rio Grande' },
      documentacao: { ass: 'SOA/IFRS — Documentação Incompleta', msg: 'Prezado(a),\n\nSua documentação está incompleta. Por favor regularize no SIGAA.\n\nAtenciosamente,\nSecretaria Acadêmica — IFRS Campus Rio Grande' },
      livre:        { ass: '', msg: '' }
    };
    const tpl = tpls[tipo]; if (!tpl) return;
    const a = document.getElementById('nassunto-' + id);
    const m = document.getElementById('nmsg-' + id);
    if (a) a.value = tpl.ass;
    if (m) m.value = tpl.msg;
  },

  enviarNotif(id) {
    const assunto = (document.getElementById('nassunto-' + id)||{}).value || '';
    const msg     = (document.getElementById('nmsg-' + id)||{}).value || '';
    if (!assunto || !msg) { toast('⚠ Preencha assunto e mensagem.'); return; }
    toast('✉ Notificação enviada com sucesso!');
    AdminEditais.toggleNotif(id);
  },

  // ── CRUD ─────────────────────────────────────
  form(app, dados = {}) {
    const segs  = ['Pesquisa','Ensino','Extensão','Indissociável'];
    const tipos = ['Bolsas','Auxílio','Fluxo Contínuo','Fomento Externo'];
    const stats = ['Rascunho','Publicado','Pendente','Encerrado'];

    app.innerHTML = `
    <div class="ph">
      <div><h1>${dados.id ? 'Editar' : 'Cadastrar'} edital</h1></div>
      <div class="phr"><button class="btn bo" onclick="AdminRouter.ir('editais')">← Cancelar</button></div>
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
        <button class="btn bo" onclick="AdminRouter.ir('editais')">Cancelar</button>
        <button class="btn bp" onclick="AdminEditais.salvar('${dados.id||''}')">💾 Salvar edital</button>
      </div>
    </div>`;
  },

  async salvar(id) {
    const dados = {
      id:         id || null,
      numero:     val('f-numero'),   titulo:    val('f-titulo'),
      segmento:   val('f-segmento'), tipo:      val('f-tipo'),
      status:     val('f-status'),   bolsaValor:val('f-bolsaValor'),
      bolsaCH:    val('f-bolsaCH'),  vagas:     val('f-vagas'),
      vigIni:     val('f-vigIni'),   vigFim:    val('f-vigFim'),
      descricao:  val('f-descricao')
    };
    if (!dados.numero || !dados.titulo) { toast('⚠ Preencha número e título.'); return; }
    toast('⏳ Salvando...');
    try {
      const res = await API.salvarEdital(dados);
      if (id) {
        const idx = SOA.editais.findIndex(e => e.id === id);
        if (idx >= 0) SOA.editais[idx] = { ...SOA.editais[idx], ...dados };
      } else {
        SOA.editais.unshift({ ...dados, id: res.id });
      }
      toast('✓ Edital salvo!');
      AdminRouter.ir('editais');
    } catch(e) { toast('❌ ' + e.message); }
  },

  editar(id) {
    const e = SOA.editais.find(x => x.id === id);
    if (e) this.form(document.getElementById('app'), e);
  },

  async duplicar(id) {
    const e = SOA.editais.find(x => x.id === id);
    if (!e) return;
    const novo = { ...e, id: null, numero: e.numero + ' (cópia)', status: 'Rascunho' };
    toast('⏳ Duplicando...');
    try {
      const res = await API.salvarEdital(novo);
      SOA.editais.unshift({ ...novo, id: res.id });
      toast('✓ Edital duplicado como Rascunho.');
      AdminEditais.renderRows();
    } catch(err) { toast('❌ ' + err.message); }
  },

  excluir(id, titulo) {
    Modal.confirm(
      'Excluir edital',
      `Deseja excluir <strong>${titulo}</strong>? Esta ação não pode ser desfeita.`,
      async () => {
        toast('⏳ Excluindo...');
        try {
          await API.excluirEdital(id);
          SOA.editais = SOA.editais.filter(e => e.id !== id);
          toast('✓ Edital excluído.');
          AdminEditais.renderRows();
        } catch(e) { toast('❌ ' + e.message); }
      }
    );
  },

  // ── Exportar ──────────────────────────────────
  toggleExport() {
    document.getElementById('exp-editais').classList.toggle('open');
  },

  _fecharExport(e) {
    if (!e.target.closest('#exp-editais')) {
      const w = document.getElementById('exp-editais');
      if (w) w.classList.remove('open');
    }
  },

  exportar(fmt) {
    document.getElementById('exp-editais').classList.remove('open');
    const lista = SOA.editais.filter(e => {
      return (AdminEditais._filtroSeg === 'todos' || e.segmento === AdminEditais._filtroSeg)
          && (!AdminEditais._filtroStatus || e.status === AdminEditais._filtroStatus);
    });
    const headers = ['Número','Título','Segmento','Tipo','Status','Vigência Início','Vigência Fim','Bolsa R$','CH/sem','Vagas','Descrição'];
    const rows    = lista.map(e => [e.numero,e.titulo,e.segmento,e.tipo,e.status,e.vigIni,e.vigFim,e.bolsaValor,e.bolsaCH,e.vagas,e.descricao]);

    if (fmt === 'csv') {
      const csv = [headers,...rows].map(r=>r.map(c=>`"${(c||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
      AdminEditais._dl('editais.csv','text/csv','\uFEFF'+csv);
    } else if (fmt === 'xlsx') {
      const tsv = [headers,...rows].map(r=>r.join('\t')).join('\n');
      AdminEditais._dl('editais.xls','application/vnd.ms-excel',tsv);
    } else if (fmt === 'pdf') {
      const w = window.open('','_blank');
      if (!w) { toast('⚠ Permita pop-ups para exportar PDF.'); return; }
      w.document.write(`<html><head><title>Editais — SOA IFRS</title>
        <style>body{font-family:Arial;padding:20px}h2{color:#00843D}
        table{width:100%;border-collapse:collapse}
        th{background:#00843D;color:#fff;padding:8px;font-size:11px;text-align:left}
        td{padding:7px;border-bottom:1px solid #eee;font-size:11px}</style></head><body>
        <h2>SOA — IFRS Campus Rio Grande</h2>
        <p style="color:#6b7280;font-size:12px">Editais · ${new Date().toLocaleDateString('pt-BR')}</p>
        <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c||''}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></body></html>`);
      w.document.close(); w.print();
    }
  },

  _dl(nome, mime, conteudo) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([conteudo],{type:mime}));
    a.download = nome; a.click();
  }
};
