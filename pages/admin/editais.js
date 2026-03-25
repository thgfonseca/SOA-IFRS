// pages/admin/editais.js

const AdminEditais = {

  _filtroSeg: 'todos',
  _filtroStatus: '',

  render(app) {
    const { editais } = SOA;
    // Considera apenas não-excluídos para contadores
    const ativos = editais.filter(e => !e.deleted_at || e.deleted_at === '');
    const total  = ativos.length;
    const cnt    = (seg) => ativos.filter(e => e.segmento === seg).length;

    app.innerHTML = `
    <div class="ph">
      <div>
        <h1>Lista de editais</h1>
        <p>Editais cadastrados no SOA</p>
      </div>
      <div class="phr">
        <div class="export-wrap" id="exp-editais">
          <button onclick="AdminEditais.toggleExport()" style="height:36px;padding:0 16px;border-radius:8px;border:1.5px solid #0e7490;background:#0e7490;color:#fff;font-family:'Inter',sans-serif;font-size:13px;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;min-width:120px;justify-content:center;box-sizing:border-box">↓ Exportar</button>
          <div class="export-menu">
            <div class="export-item" onclick="AdminEditais.exportar('pdf')">📄 PDF</div>
            <div class="export-item" onclick="AdminEditais.exportar('xlsx')">📊 Excel (.xlsx)</div>
            <div class="export-item" onclick="AdminEditais.exportar('csv')">📋 CSV (vírgula)</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros segmento -->
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
      <button class="eseg-btn on" style="--ec:#00843D" onclick="AdminEditais.filtrarSeg('todos',this)">
        <span class="eseg-dot" style="background:#00843D"></span>Todos
        <span class="eseg-cnt" id="ec-todos">${total}</span>
      </button>
      <button class="eseg-btn" style="--ec:#9cbb31" onclick="AdminEditais.filtrarSeg('Ensino',this)">
        <span class="eseg-dot" style="background:#9cbb31"></span>Ensino
        <span class="eseg-cnt" id="ec-ensino">${cnt('Ensino')}</span>
      </button>
      <button class="eseg-btn" style="--ec:#54a4c3" onclick="AdminEditais.filtrarSeg('Pesquisa',this)">
        <span class="eseg-dot" style="background:#54a4c3"></span>Pesquisa
        <span class="eseg-cnt" id="ec-pesquisa">${cnt('Pesquisa')}</span>
      </button>
      <button class="eseg-btn" style="--ec:#f4b61d" onclick="AdminEditais.filtrarSeg('Extensão',this)">
        <span class="eseg-dot" style="background:#f4b61d"></span>Extensão
        <span class="eseg-cnt" id="ec-extensao">${cnt('Extensão')}</span>
      </button>
      <button class="eseg-btn" style="--ec:#592b9b" onclick="AdminEditais.filtrarSeg('Indissociável',this)">
        <span class="eseg-dot" style="background:#592b9b"></span>Indissociável
        <span class="eseg-cnt" id="ec-indi">${cnt('Indissociável')}</span>
      </button>
      <div style="width:1px;height:28px;background:var(--g3);margin:0 4px"></div>
      <select class="selbox" id="filtro-status-ed"
        style="width:auto;max-width:160px;height:34px;font-size:12px"
        onchange="AdminEditais.filtrarStatus(this.value)">
        <option value="">Todos os status</option>
        <option value="Publicado">Publicado</option>
        <option value="Rascunho">Rascunho</option>
        <option value="Pendente">Pendente</option>
        <option value="Encerrado">Encerrado</option>
      </select>
    </div>

    <!-- Barra colorida -->
    <div id="ebar" style="height:3px;border-radius:2px;margin-bottom:16px;
      background:linear-gradient(to right,var(--ensi),var(--pesq),var(--exte));
      transition:background .3s"></div>

    <div id="cnt-editais" style="font-size:12px;color:var(--g4);margin-bottom:12px">
      Mostrando <strong style="color:var(--tx)">${total}</strong> de <strong style="color:var(--tx)">${total}</strong> registros
    </div>

    <!-- Tabela -->
    <div class="card">
      <table id="tbl-editais">
        <thead><tr>
          <th class="sortable" onclick="AdminEditais.sortCol(0,this)">Status <span class="sort-ico">↕</span></th>
          <th class="sortable" onclick="AdminEditais.sortCol(1,this)">Segmento <span class="sort-ico">↕</span></th>
          <th class="sortable" onclick="AdminEditais.sortCol(2,this)">Número / Ano <span class="sort-ico">↕</span></th>
          <th class="sortable" onclick="AdminEditais.sortCol(3,this)">Título <span class="sort-ico">↕</span></th>
          <th class="sortable" onclick="AdminEditais.sortCol(4,this)">Tipo <span class="sort-ico">↕</span></th>
          <th class="sortable" onclick="AdminEditais.sortCol(5,this)">Vigência <span class="sort-ico">↕</span></th>
          <th>Ações</th>
          <th style="white-space:nowrap">Última atualização</th>
        </tr></thead>
        <tbody id="tbody-editais"></tbody>
      </table>
      <div id="editais-empty" style="display:none;padding:48px;text-align:center;color:var(--g4)">
        <div style="font-size:32px;margin-bottom:10px;opacity:.3">◈</div>
        <div style="font-size:14px">Nenhum edital encontrado para este filtro.</div>
      </div>
    </div>`;

    AdminEditais.renderRows();
    document.addEventListener('click', AdminEditais._fecharExport);
  },

  renderRows() {
    const tbody = document.getElementById('tbody-editais');
    if (!tbody) return;

    const lista = SOA.editais.filter(e => {
      if (e.deleted_at && e.deleted_at !== '') return false; // ocultar excluídos
      const segOk    = AdminEditais._filtroSeg === 'todos' || e.segmento === AdminEditais._filtroSeg;
      const statusOk = !AdminEditais._filtroStatus || e.status === AdminEditais._filtroStatus;
      return segOk && statusOk;
    });

    const cnt = document.getElementById('cnt-editais');
    const total = SOA.editais.filter(e => !e.deleted_at || e.deleted_at === '').length;
    if (cnt) cnt.innerHTML = `Mostrando <strong style="color:var(--tx)">${lista.length}</strong> de <strong style="color:var(--tx)">${total}</strong> registros`;

    const empty = document.getElementById('editais-empty');
    const tbl   = document.getElementById('tbl-editais');
    if (empty) empty.style.display = lista.length === 0 ? '' : 'none';
    if (tbl)   tbl.style.display   = lista.length === 0 ? 'none' : '';

    tbody.innerHTML = lista.map(e => {
      const sc = AdminEditais._segColors(e.segmento);
      const ss = AdminEditais._statusStyle(e.status);

      // Sanitizar valores antes de inserir no HTML
      const id        = AdminEditais._sanitize(e.id);
      const numero    = AdminEditais._sanitize(e.numero);
      const titulo    = AdminEditais._sanitize(e.titulo);
      const segmento  = AdminEditais._sanitize(e.segmento);
      const tipo      = AdminEditais._sanitize(e.tipo || '');
      const status    = AdminEditais._sanitize(e.status);
      const vigIni    = AdminEditais._fmtDataOnly(e.vigIni);
      const vigFim    = AdminEditais._fmtDataOnly(e.vigFim);
      const ultimaAtu = AdminEditais._fmtData(e.updated_at || e.criadoEm);

      return `
      <tr id="edital-row-${id}" data-seg="${segmento}" data-status="${status}">
        <td><span class="b" style="${ss};padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600">${status}</span></td>
        <td><span class="b" style="background:${sc.bg};color:${sc.color};border:1px solid ${sc.border}">${segmento}</span></td>
        <td><div class="tm">${numero}</div></td>
        <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${titulo}">${titulo}</td>
        <td>${tipo}</td>
        <td style="font-size:12px;white-space:nowrap">${vigIni} – ${vigFim}</td>
        <td><div class="acts">
          <button class="ab" onclick="AdminEditais.toggleNotif('${id}')" title="Notificações" style="font-size:14px;padding:0 8px">🔔</button>
          <button class="ab" onclick="AdminEditais.toggleVer('${id}')">Ver</button>
          <button class="ab" onclick="AdminEditais.editar('${id}')">Editar</button>
          <button class="ab" onclick="AdminEditais.duplicar('${id}')">Duplicar</button>
          <button class="ab dg" onclick="AdminEditais.excluir('${id}')">Excluir</button>
        </div></td>
        <td style="font-size:11px;color:var(--g4)">${ultimaAtu}</td>
      </tr>

      <!-- Painel Ver -->
      <tr id="ver-${id}" style="display:none">
        <td colspan="8" style="padding:0">
          ${AdminEditais._renderVerPanel(e)}
        </td>
      </tr>

      <!-- Painel Notificação -->
      <tr id="notif-${id}" style="display:none">
        <td colspan="8" style="padding:0">
          <div class="alarm-panel open">
            <div style="font-size:13px;font-weight:600;color:#854d0e;margin-bottom:14px">
              🔔 Notificação — ${titulo}
            </div>
            <div class="alarm-grid">
              <div>
                <label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--g5);display:block;margin-bottom:8px">Destinatários</label>
                <div class="mchk-row">
                  ${['Bolsistas','Voluntários','Coordenadores'].map(d =>
                    `<span class="mchk on" onclick="this.classList.toggle('on')">${d}</span>`
                  ).join('')}
                </div>
              </div>
              <div>
                <label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--g5);display:block;margin-bottom:8px">Tipo</label>
                <select class="selbox" id="ntipo-${id}" style="height:34px"
                  onchange="AdminEditais.preencherNotif('${id}',this.value)">
                  <option value="">Selecione...</option>
                  <option value="relatorio">Relatório pendente</option>
                  <option value="assiduidade">Assiduidade pendente</option>
                  <option value="documentacao">Documentação incompleta</option>
                  <option value="livre">Mensagem livre</option>
                </select>
              </div>
            </div>
            <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="mfl">
                <label>Assunto</label>
                <input type="text" id="nassunto-${id}" class="selbox" style="height:34px" placeholder="Assunto do e-mail">
              </div>
              <div class="mfl">
                <label>Mensagem</label>
                <textarea id="nmsg-${id}" rows="3" style="width:100%;padding:8px 10px;border:1.5px solid var(--g3);border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;color:var(--tx);resize:vertical;box-sizing:border-box"></textarea>
              </div>
            </div>
            <div class="alarm-footer" style="margin-top:12px">
              <span class="send-flash" id="nflash-${id}">✓ Enviado!</span>
              <div style="display:flex;gap:8px">
                <button class="btn bo" style="height:32px;font-size:12px" onclick="AdminEditais.toggleNotif('${id}')">Cancelar</button>
                <button class="btn bp" style="height:32px;font-size:12px" onclick="AdminEditais.enviarNotif('${id}')">✉ Enviar</button>
              </div>
            </div>
          </div>
        </td>
      </tr>`;
    }).join('');
  },

  // ── Painel Ver ────────────────────────────────────
  _renderVerPanel(e) {
    const sc     = AdminEditais._segColors(e.segmento);
    const ss     = AdminEditais._statusStyle(e.status);
    const id     = AdminEditais._sanitize(e.id);
    const numero = AdminEditais._sanitize(e.numero);
    const titulo = AdminEditais._sanitize(e.titulo);

    // Documentos anexados
    let docsHtml = '';
    if (e.documentos) {
      let docs = [];
      try { docs = JSON.parse(e.documentos); } catch(_) {}
      if (Array.isArray(docs) && docs.length > 0) {
        const itens = docs.map(d => {
          const tipo = AdminEditais._sanitize(d.tipo || '');
          const desc = AdminEditais._sanitize(d.descricao || '');
          const urlOk = AdminEditais._validateUrl(d.url);
          const urlSafe = urlOk ? AdminEditais._sanitize(d.url) : '';
          return `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #e0f2fe">
            <span style="font-size:11px;font-weight:600;color:var(--g5);min-width:110px">${tipo}</span>
            <span style="font-size:12px;flex:1;color:var(--tx)">${desc}</span>
            ${urlOk
              ? `<a href="${urlSafe}" target="_blank" rel="noopener noreferrer"
                   style="font-size:12px;color:#0e7490;text-decoration:none;font-weight:500;white-space:nowrap">⬇ Download</a>`
              : `<span style="font-size:11px;color:#ef4444">URL inválida</span>`
            }
          </div>`;
        }).join('');
        docsHtml = `
          <div style="margin-bottom:14px">
            <div style="font-size:11px;font-weight:600;color:var(--g5);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Documentos</div>
            ${itens}
          </div>`;
      }
    }

    return `
      <div class="alarm-panel open" style="background:#f0f9ff;border-top-color:#bae6fd">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px">
          <div style="font-size:13px;font-weight:600;color:#0e4d6b">
            👁 ${numero} — ${titulo}
          </div>
          <div style="font-size:10px;color:var(--g4);font-family:'Courier New',monospace;background:#e0f2fe;padding:2px 8px;border-radius:4px;white-space:nowrap">
            ID: ${id}
          </div>
        </div>
        <div class="alarm-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px">
          <div>
            <div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Tipo</div>
            <div style="font-size:13px">${AdminEditais._sanitize(e.tipo || '—')}</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Segmento</div>
            <span class="b" style="background:${sc.bg};color:${sc.color}">${AdminEditais._sanitize(e.segmento)}</span>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Vigência</div>
            <div style="font-size:13px">${AdminEditais._fmtDataOnly(e.vigIni)} – ${AdminEditais._fmtDataOnly(e.vigFim)}</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Status</div>
            <span style="${ss};padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600">${AdminEditais._sanitize(e.status)}</span>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Bolsa</div>
            <div style="font-size:13px">R$ ${AdminEditais._sanitize(e.bolsaValor || '—')} / ${AdminEditais._sanitize(e.bolsaCH || '—')}h/sem</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Vagas</div>
            <div style="font-size:13px">${AdminEditais._sanitize(e.vagas || '—')}</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Criado por</div>
            <div style="font-size:12px;color:var(--g5)">${AdminEditais._sanitize(e.criadoPor || '—')}</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Criado em</div>
            <div style="font-size:12px;color:var(--g5)">${AdminEditais._fmtData(e.criadoEm)}</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Última atualização</div>
            <div style="font-size:12px;color:var(--g5)">${AdminEditais._fmtData(e.updated_at || e.criadoEm)}</div>
          </div>
        </div>
        ${e.descricao ? `<div style="font-size:13px;color:var(--g5);line-height:1.6;margin-bottom:14px">${AdminEditais._sanitize(e.descricao)}</div>` : ''}
        ${docsHtml}
        <div style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid #bae6fd;padding-top:12px">
          <button class="btn bo" style="height:30px;font-size:12px" onclick="AdminEditais.toggleVer('${id}')">Fechar</button>
          <button class="btn bp" style="height:30px;font-size:12px" onclick="AdminEditais.editar('${id}')">✏ Editar este edital</button>
        </div>
      </div>`;
  },

  // ── Filtros ───────────────────────────────────────
  filtrarSeg(seg, btn) {
    AdminEditais._filtroSeg = seg;
    document.querySelectorAll('.eseg-btn').forEach(b => b.classList.remove('on'));
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

  // ── Painéis ───────────────────────────────────────
  toggleVer(id) {
    const row   = document.getElementById('ver-' + id);
    if (!row) return;
    const aberto = row.style.display === 'table-row';
    document.querySelectorAll('[id^="ver-"],[id^="notif-"]').forEach(r => r.style.display = 'none');
    if (!aberto) row.style.display = 'table-row';
  },

  toggleNotif(id) {
    const row   = document.getElementById('notif-' + id);
    if (!row) return;
    const aberto = row.style.display === 'table-row';
    document.querySelectorAll('[id^="ver-"],[id^="notif-"]').forEach(r => r.style.display = 'none');
    if (!aberto) row.style.display = 'table-row';
  },

  preencherNotif(id, tipo) {
    const tpls = {
      relatorio:    { ass: 'SOA/IFRS — Relatório Pendente',      msg: 'Prezado(a),\n\nO relatório está pendente. Acesse o SOA e regularize.\n\nAtenciosamente,\nSecretaria Acadêmica — IFRS Campus Rio Grande' },
      assiduidade:  { ass: 'SOA/IFRS — Assiduidade Pendente',    msg: 'Prezado(a),\n\nO registro de assiduidade está pendente.\n\nAtenciosamente,\nSecretaria Acadêmica — IFRS Campus Rio Grande' },
      documentacao: { ass: 'SOA/IFRS — Documentação Incompleta', msg: 'Prezado(a),\n\nSua documentação está incompleta. Regularize no SIGAA.\n\nAtenciosamente,\nSecretaria Acadêmica — IFRS Campus Rio Grande' },
      livre:        { ass: '', msg: '' }
    };
    const tpl = tpls[tipo]; if (!tpl) return;
    const a = document.getElementById('nassunto-' + id);
    const m = document.getElementById('nmsg-' + id);
    if (a) a.value = tpl.ass;
    if (m) m.value = tpl.msg;
  },

  enviarNotif(id) {
    const assunto = (document.getElementById('nassunto-' + id) || {}).value || '';
    const msg     = (document.getElementById('nmsg-' + id) || {}).value || '';
    if (!assunto || !msg) { toast('⚠ Preencha assunto e mensagem.'); return; }
    const fl = document.getElementById('nflash-' + id);
    if (fl) { fl.classList.add('show'); setTimeout(() => fl.classList.remove('show'), 3000); }
    toast('✉ Notificação enviada!');
  },

  // ── Sort ──────────────────────────────────────────
  _sortState: {},
  sortCol(colIdx, th) {
    const tbl = document.getElementById('tbl-editais');
    if (!tbl) return;
    const key = 'ed-' + colIdx;
    const asc = AdminEditais._sortState[key] !== true;
    AdminEditais._sortState[key] = asc;
    tbl.querySelectorAll('th').forEach(h => h.classList.remove('sort-asc','sort-desc'));
    th.classList.add(asc ? 'sort-asc' : 'sort-desc');
    const tbody = tbl.querySelector('tbody');
    const rows  = Array.from(tbody.querySelectorAll('tr[id^="edital-row-"]'));
    rows.sort((a, b) => {
      const at = (a.cells[colIdx]?.innerText || '').trim().toLowerCase();
      const bt = (b.cells[colIdx]?.innerText || '').trim().toLowerCase();
      return asc ? at.localeCompare(bt, 'pt') : bt.localeCompare(at, 'pt');
    });
    rows.forEach(r => tbody.appendChild(r));
  },

  // ── CRUD ──────────────────────────────────────────
  editar(id) {
    const e = SOA.editais.find(x => x.id === id);
    if (e) AdminCadEdital.render(document.getElementById('app'), e);
  },

  async duplicar(id) {
    const e = SOA.editais.find(x => x.id === id);
    if (!e) return;
    const novo = {
      ...e,
      id: null,
      numero:     e.numero + ' (cópia)',
      status:     'Rascunho',
      updated_at: undefined,
      deleted_at: undefined
    };
    toast('⏳ Duplicando...');
    try {
      await API.salvarEdital(novo);
      toast('✓ Edital duplicado como Rascunho.');
      await AdminEditais._recarregar();
    } catch(err) { toast('❌ ' + err.message); }
  },

  excluir(id) {
    const e = SOA.editais.find(x => x.id === id);
    const titulo = e ? AdminEditais._sanitize(e.titulo || id) : id;
    Modal.confirm(
      'Excluir edital',
      `Deseja excluir <strong>${titulo}</strong>?<br>
       <span style="font-size:12px;color:var(--g4)">O registro será ocultado (exclusão lógica) e registrado no log.</span>`,
      async () => {
        toast('⏳ Excluindo...');
        try {
          await API.excluirEdital(id);
          toast('✓ Edital excluído.');
          await AdminEditais._recarregar();
        } catch(e) { toast('❌ ' + e.message); }
      }
    );
  },

  // Recarrega todos os dados do servidor após operações CRUD
  async _recarregar() {
    const token = sessionStorage.getItem('soa_token');
    if (!token) return;
    try {
      const data = await API.carregar(token);
      if (data.ok) {
        SOA.editais     = data.editais     || [];
        SOA.projetos    = data.projetos    || [];
        SOA.inscricoes  = data.inscricoes  || [];
        SOA.assiduidade = data.assiduidade || [];
      }
    } catch(_) {}
    AdminEditais.renderRows();
  },

  // ── Helpers de formatação e sanitização ──────────

  // Escapa caracteres HTML para prevenir XSS
  _sanitize(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },

  // Valida que uma URL é HTTPS (seguro para links de download)
  _validateUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
      const u = new URL(url.trim());
      return u.protocol === 'https:';
    } catch(_) {
      return false;
    }
  },

  // Formata data exibindo apenas dd/MM/yyyy (sem horário) — para vigência
  _fmtDataOnly(v) {
    if (!v || v === '—') return '—';
    const s = String(v).trim();
    // dd/MM/yyyy ou dd/MM/yyyy HH:mm:ss → pega apenas os 10 primeiros chars
    if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) return s.substring(0, 10);
    // ISO: yyyy-MM-dd
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return m[3] + '/' + m[2] + '/' + m[1];
    return s.substring(0, 10);
  },

  // Formata data mostrando dd/MM/yyyy HH:mm:ss quando há horário — para auditoria
  _fmtData(v) {
    if (!v || v === '—') return '—';
    const s = String(v).trim();
    if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) return s;
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      if (s.includes(':')) {
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
      }
      return `${dd}/${mm}/${yyyy}`;
    }
    return s;
  },

  _segColors(seg) {
    const map = {
      Pesquisa:     { bg: '#e8f4fc', color: '#54a4c3', border: '#54a4c330' },
      Ensino:       { bg: '#f0f7dc', color: '#9cbb31', border: '#9cbb3130' },
      'Extensão':   { bg: '#fffbeb', color: '#f4b61d', border: '#f4b61d30' },
      Indissociável:{ bg: '#f3e8ff', color: '#592b9b', border: '#592b9b30' }
    };
    return map[seg] || { bg: '#f1f5f9', color: '#475569', border: '#e5e7eb' };
  },

  _statusStyle(status) {
    const map = {
      Publicado: 'background:#dcfce7;color:#166534',
      Rascunho:  'background:#f1f5f9;color:#475569',
      Pendente:  'background:#fef9c3;color:#854d0e',
      Encerrado: 'background:#f1f5f9;color:#475569'
    };
    return map[status] || 'background:#f1f5f9;color:#475569';
  },

  // ── Exportar ──────────────────────────────────────
  toggleExport() {
    const w = document.getElementById('exp-editais');
    if (w) w.classList.toggle('open');
  },

  _fecharExport(e) {
    if (!e.target.closest('#exp-editais')) {
      const w = document.getElementById('exp-editais');
      if (w) w.classList.remove('open');
    }
  },

  exportar(fmt) {
    const w = document.getElementById('exp-editais');
    if (w) w.classList.remove('open');

    const lista = SOA.editais.filter(e => {
      if (e.deleted_at && e.deleted_at !== '') return false;
      return (AdminEditais._filtroSeg === 'todos' || e.segmento === AdminEditais._filtroSeg)
          && (!AdminEditais._filtroStatus || e.status === AdminEditais._filtroStatus);
    });

    const headers = ['ID','Número','Título','Segmento','Tipo','Status','Vigência Início','Vigência Fim','Bolsa R$','CH/sem','Vagas','Descrição'];
    const rows    = lista.map(e => [
      e.id, e.numero, e.titulo, e.segmento, e.tipo, e.status,
      AdminEditais._fmtDataOnly(e.vigIni),
      AdminEditais._fmtDataOnly(e.vigFim),
      e.bolsaValor, e.bolsaCH, e.vagas, e.descricao
    ]);

    // Proteção contra CSV Injection: prefixar células que iniciam com =, +, -, @, tab, CR
    const csvEsc = v => {
      const s = String(v || '');
      const safe = /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
      return '"' + safe.replace(/"/g, '""') + '"';
    };

    if (fmt === 'csv') {
      const csv = [headers, ...rows].map(r => r.map(csvEsc).join(',')).join('\n');
      AdminEditais._dl('editais.csv', 'text/csv', '\uFEFF' + csv);
    } else if (fmt === 'xlsx') {
      const tsv = [headers, ...rows].map(r => r.map(c => String(c || '')).join('\t')).join('\n');
      AdminEditais._dl('editais.xls', 'application/vnd.ms-excel', '\uFEFF' + tsv);
    } else if (fmt === 'pdf') {
      const w2 = window.open('', '_blank');
      if (!w2) { toast('⚠ Permita pop-ups para exportar PDF.'); return; }
      const esc = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      w2.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Editais — SOA IFRS</title>
        <style>body{font-family:Arial;padding:20px;font-size:11px}h2{color:#00843D}
        table{width:100%;border-collapse:collapse}
        th{background:#00843D;color:#fff;padding:7px 9px;text-align:left;font-size:11px}
        td{padding:6px 9px;border-bottom:1px solid #eee}
        tr:nth-child(even)td{background:#f8f9fa}</style></head><body>
        <h2>SOA — IFRS Campus Rio Grande</h2>
        <p style="color:#6b7280">Editais · ${new Date().toLocaleDateString('pt-BR')}</p>
        <table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></body></html>`);
      w2.document.close(); w2.print();
    }
  },

  _dl(nome, mime, conteudo) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([conteudo], { type: mime }));
    a.download = nome; a.click();
  }
};

// ══════════════════════════════════════════════════════════════════
// pages/admin/cad_edital.js — Formulário completo de cadastro/edição
// ══════════════════════════════════════════════════════════════════

const AdminCadEdital = {

  _editId:    null,   // ID do edital em edição (null = novo)
  _updatedAt: '',     // updated_at do edital em edição (para controle de concorrência)
  _cronoEtapas: [],
  _recursoRows: 0,
  _bolsaRows:   0,
  _pdfCnt:      0,

  RESPS: [
    'Direção Geral',
    'Direção de Ensino, Pesquisa e Extensão (DEPE)',
    'DEX — Departamento de Extensão',
    'DEN — Departamento de Ensino',
    'DPPI — Departamento de Pesquisa e Pós-Graduação',
    'Secretaria Acadêmica',
    'Setor de RH / Pessoal',
    'Coordenador(a) do Projeto',
    'Candidatos às bolsas',
    'Bolsistas',
    'Voluntários',
    'Outro'
  ],

  CRONO_DEFAULT: [
    {etapa:'Publicação do edital',                         dataIni:'', dataFim:'', resp:'Direção de Ensino, Pesquisa e Extensão (DEPE)'},
    {etapa:'Período de inscrição dos estudantes',          dataIni:'', dataFim:'', resp:'Candidatos às bolsas'},
    {etapa:'Envio de documentos aos coordenadores',        dataIni:'', dataFim:'', resp:'Candidatos às bolsas'},
    {etapa:'Retorno do coordenador (horários)',            dataIni:'', dataFim:'', resp:'Coordenador(a) do Projeto'},
    {etapa:'Publicação da lista de candidatos',            dataIni:'', dataFim:'', resp:'Direção de Ensino, Pesquisa e Extensão (DEPE)'},
    {etapa:'Período para seleção dos bolsistas',           dataIni:'', dataFim:'', resp:'Coordenador(a) do Projeto'},
    {etapa:'Envio da Ata de seleção',                      dataIni:'', dataFim:'', resp:'Coordenador(a) do Projeto'},
    {etapa:'Divulgação do resultado preliminar',           dataIni:'', dataFim:'', resp:'Direção de Ensino, Pesquisa e Extensão (DEPE)'},
    {etapa:'Período para interposição de recursos',        dataIni:'', dataFim:'', resp:'Candidatos às bolsas'},
    {etapa:'Análise dos recursos',                         dataIni:'', dataFim:'', resp:'Coordenador(a) do Projeto'},
    {etapa:'Divulgação do resultado final',                dataIni:'', dataFim:'', resp:'Direção de Ensino, Pesquisa e Extensão (DEPE)'},
    {etapa:'Envio dos formulários do bolsista',            dataIni:'', dataFim:'', resp:'Coordenador(a) do Projeto'},
    {etapa:'Início das atividades (Ensino/Pesquisa)',      dataIni:'', dataFim:'', resp:'Bolsistas'},
    {etapa:'Início das atividades (Extensão)',             dataIni:'', dataFim:'', resp:'Bolsistas'},
    {etapa:'Término (Extensão)',                           dataIni:'', dataFim:'', resp:'Bolsistas'},
    {etapa:'Término (Ensino / Pesquisa / Indissociáveis)', dataIni:'', dataFim:'', resp:'Bolsistas'},
  ],

  render(app, dados = {}) {
    // Armazenar contexto de edição para controle de concorrência
    this._editId    = dados.id    || null;
    this._updatedAt = dados.updated_at || '';

    this._cronoEtapas = JSON.parse(JSON.stringify(this.CRONO_DEFAULT));
    this._recursoRows = 0;
    this._bolsaRows   = 0;
    this._pdfCnt      = 0;

    const segs  = ['Pesquisa','Ensino','Extensão','Indissociável'];
    const tipos = ['Bolsas','Auxílio','Fluxo Contínuo','Curricularização da Extensão','Fomento Externo'];
    const stats = ['Rascunho','Publicado','Pendente','Encerrado'];
    const ambs  = ['Interno — IFRS Campus Rio Grande','Externo — outra instituição ou órgão'];

    const esc = s => String(s || '').replace(/"/g, '&quot;');

    app.innerHTML = `
    <div class="ph">
      <div>
        <h1>${dados.id ? 'Editar' : 'Cadastrar'} edital</h1>
        <p>${dados.id ? `Editando: ${esc(dados.titulo || '')}` : 'Preencha os dados do novo edital'}</p>
      </div>
      <div class="phr"><button class="btn bo" onclick="AdminRouter.ir('editais')">← Cancelar</button></div>
    </div>

    <!-- 1. Dados gerais -->
    <div class="card">
      <div class="ch"><h3>Dados gerais</h3></div>
      <div class="fg">
        <div class="fl"><label>Número</label>
          <input class="inp" id="f-numero" value="${esc(dados.numero||'')}" placeholder="001"></div>
        <div class="fl"><label>Ano</label>
          <input class="inp" id="f-ano" value="${esc(dados.ano||String(new Date().getFullYear()))}" placeholder="2025"></div>
        <div class="fl"><label>Tipo de edital</label>
          <select class="inp" id="f-tipo">${selectOpts(tipos, dados.tipo)}</select></div>
        <div class="fl"><label>Âmbito</label>
          <select class="inp" id="f-ambito">${selectOpts(ambs, dados.ambito)}</select></div>
        <div class="fl"><label>Segmento</label>
          <select class="inp" id="f-segmento" onchange="AdminCadEdital.onSegChange(this)">${selectOpts([''].concat(segs), dados.segmento)}</select></div>
        <div class="fl"><label>Status</label>
          <select class="inp" id="f-status">${selectOpts(stats, dados.status||'Rascunho')}</select></div>
        <div class="fl s2"><label>Título completo</label>
          <input class="inp" id="f-titulo" value="${esc(dados.titulo||'')}" placeholder="Edital 001/2025 — Bolsas de Pesquisa AIPCTI"></div>
        <div class="fl s2"><label>Descrição / Ementa</label>
          <textarea class="inp" id="f-descricao" placeholder="Descrição resumida do edital...">${esc(dados.descricao||'')}</textarea></div>
      </div>
    </div>

    <!-- 2. Recursos financeiros -->
    <div class="card">
      <div class="ch" style="justify-content:space-between">
        <div><h3>Recursos e auxílios financeiros</h3>
          <p style="font-size:12px;color:var(--g4);margin-top:2px">Um recurso por segmento — custeio e capital</p></div>
        <button class="btn bo" style="font-size:12px" onclick="AdminCadEdital.addRecurso()">+ Adicionar recurso</button>
      </div>
      <div style="overflow-x:auto">
        <table style="width:100%;min-width:860px;border-collapse:collapse">
          <thead>
            <tr style="background:var(--g1)">
              <th rowspan="2" style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;padding:8px 12px;border-bottom:1px solid var(--g3);text-align:left;min-width:160px">Tipo / Programa</th>
              <th rowspan="2" style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;padding:8px 12px;border-bottom:1px solid var(--g3);text-align:left;min-width:120px">Segmento</th>
              <th colspan="3" style="font-size:11px;font-weight:600;color:#166534;text-transform:uppercase;padding:6px 12px;border-bottom:1px solid var(--g3);text-align:center;background:#f0fdf4">Campus (R$)</th>
              <th colspan="3" style="font-size:11px;font-weight:600;color:#0e4d6b;text-transform:uppercase;padding:6px 12px;border-bottom:1px solid var(--g3);text-align:center;background:#f0f9ff">Outro órgão (R$)</th>
              <th rowspan="2" style="padding:8px 6px;border-bottom:1px solid var(--g3);width:32px"></th>
            </tr>
            <tr style="background:var(--g1)">
              <th style="font-size:10px;font-weight:600;color:#166534;text-transform:uppercase;padding:5px 12px;border-bottom:1px solid var(--g3);text-align:center;background:#f0fdf4;min-width:90px">Custeio</th>
              <th style="font-size:10px;font-weight:600;color:#166534;text-transform:uppercase;padding:5px 12px;border-bottom:1px solid var(--g3);text-align:center;background:#f0fdf4;min-width:90px">Capital</th>
              <th style="font-size:10px;font-weight:600;color:#166534;text-transform:uppercase;padding:5px 12px;border-bottom:1px solid var(--g3);text-align:center;background:#dcfce7;min-width:90px">Total</th>
              <th style="font-size:10px;font-weight:600;color:#0e4d6b;text-transform:uppercase;padding:5px 12px;border-bottom:1px solid var(--g3);text-align:center;background:#f0f9ff;min-width:90px">Custeio</th>
              <th style="font-size:10px;font-weight:600;color:#0e4d6b;text-transform:uppercase;padding:5px 12px;border-bottom:1px solid var(--g3);text-align:center;background:#f0f9ff;min-width:90px">Capital</th>
              <th style="font-size:10px;font-weight:600;color:#0e4d6b;text-transform:uppercase;padding:5px 12px;border-bottom:1px solid var(--g3);text-align:center;background:#e0f2fe;min-width:90px">Total</th>
            </tr>
          </thead>
          <tbody id="recurso-rows"></tbody>
        </table>
      </div>
    </div>

    <!-- 3. Configuração de bolsas -->
    <div class="card">
      <div class="ch" style="justify-content:space-between">
        <div><h3>Configuração de bolsas</h3>
          <p style="font-size:12px;color:var(--g4);margin-top:2px">Adicione uma linha por carga horária diferente</p></div>
        <button class="btn bo" style="font-size:12px" onclick="AdminCadEdital.addBolsa()">+ Adicionar bolsa</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 110px 110px 110px 32px;gap:8px;padding:8px 20px;border-bottom:1px solid var(--g3);background:var(--g1)">
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;letter-spacing:.05em">Tipo de bolsa</div>
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;letter-spacing:.05em">Segmento</div>
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;letter-spacing:.05em;text-align:center">CH/sem (h)</div>
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;letter-spacing:.05em;text-align:center">Valor campus</div>
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;letter-spacing:.05em;text-align:center">Valor outro órgão</div>
        <div></div>
      </div>
      <div id="bolsa-rows" style="padding:8px 20px;display:flex;flex-direction:column;gap:6px"></div>
    </div>

    <!-- 4. Documentos do edital (links HTTPS) -->
    <div class="card">
      <div class="ch" style="justify-content:space-between">
        <h3>Documentos do edital</h3>
        <span style="font-size:11px;color:var(--g4)">Edital, anexos, retificações — informe URLs HTTPS (ex: Google Drive)</span>
      </div>
      <div style="padding:20px 24px;display:flex;flex-direction:column;gap:12px" id="pdf-list"></div>
      <div style="padding:0 24px 20px">
        <button class="btn bo" style="font-size:12px" onclick="AdminCadEdital.addPdf()">+ Adicionar documento</button>
      </div>
    </div>

    <!-- 5. Vigências por segmento -->
    <div class="card">
      <div class="ch"><h3>Vigências das bolsas</h3>
        <span style="font-size:11px;color:var(--g4)">Datas de início e término por segmento</span>
      </div>
      <div class="fg">
        <div class="fl"><label>Ensino — início</label><input class="inp" id="vig-ensi-ini" type="date"></div>
        <div class="fl"><label>Ensino — término</label><input class="inp" id="vig-ensi-fim" type="date"></div>
        <div class="fl"><label>Pesquisa — início</label><input class="inp" id="vig-pesq-ini" type="date"></div>
        <div class="fl"><label>Pesquisa — término</label><input class="inp" id="vig-pesq-fim" type="date"></div>
        <div class="fl"><label>Extensão — início</label><input class="inp" id="vig-exte-ini" type="date"></div>
        <div class="fl"><label>Extensão — término</label><input class="inp" id="vig-exte-fim" type="date"></div>
        <div class="fl"><label>Indissociável — início</label><input class="inp" id="vig-indi-ini" type="date"></div>
        <div class="fl"><label>Indissociável — término</label><input class="inp" id="vig-indi-fim" type="date"></div>
      </div>
    </div>

    <!-- 6. Contatos por segmento -->
    <div class="card" id="contatos-card" style="display:none">
      <div class="ch"><h3>Contatos por segmento</h3>
        <span style="font-size:11px;color:var(--g4)">E-mails para comunicações</span>
      </div>
      <div class="fg" id="contatos-body"></div>
    </div>

    <!-- 7. Cronograma -->
    <div class="card">
      <div class="ch" style="justify-content:space-between">
        <div><h3>Cronograma</h3>
          <p style="font-size:12px;color:var(--g4);margin-top:2px">Datas e responsáveis de cada fase do processo seletivo</p></div>
        <button class="btn bo" style="font-size:12px" onclick="AdminCadEdital.addCrono()">+ Adicionar etapa</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 140px 12px 140px 190px 30px 30px;gap:6px;padding:8px 20px;border-bottom:1px solid var(--g3);background:var(--g1)">
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;letter-spacing:.06em">Etapa</div>
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;letter-spacing:.06em">Início</div>
        <div></div>
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;letter-spacing:.06em">Fim</div>
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;letter-spacing:.06em">Responsável</div>
        <div></div><div></div>
      </div>
      <div id="crono-rows" style="padding:12px 20px;display:flex;flex-direction:column;gap:8px"></div>
    </div>

    <!-- Footer -->
    <div class="fa">
      <button class="btn bo" onclick="AdminRouter.ir('editais')">Cancelar</button>
      <button class="btn bo" onclick="AdminCadEdital.salvar('Rascunho')">Salvar rascunho</button>
      <button class="btn bp" onclick="AdminCadEdital.salvar()">💾 Publicar edital</button>
    </div>`;

    this.addRecurso();
    this.addBolsa();
    this._initPdf(dados.documentos);
    this.renderCrono();

    // Pré-preencher vigências se editando
    if (dados.vigIni) this._preencherVig(dados.vigIni, dados.vigFim);
    if (dados.segmento) this.onSegChange(document.getElementById('f-segmento'));
  },

  // Converte dd/MM/yyyy para yyyy-MM-dd (formato do input date)
  _toInputDate(v) {
    if (!v) return '';
    const m = String(v).match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return v;
  },

  _preencherVig(ini, fim) {
    const iniVal = this._toInputDate(ini);
    const fimVal = this._toInputDate(fim);
    ['ensi','pesq','exte','indi'].forEach(s => {
      const i = document.getElementById(`vig-${s}-ini`);
      const f = document.getElementById(`vig-${s}-fim`);
      if (i) i.value = iniVal;
      if (f) f.value = fimVal;
    });
  },

  // ── Segmento change ───────────────────────────────
  onSegChange(sel) {
    const seg  = sel.value;
    const card = document.getElementById('contatos-card');
    const body = document.getElementById('contatos-body');
    if (!card || !body) return;
    if (!seg) { card.style.display = 'none'; return; }
    const segs = seg === 'Indissociável' ? ['Ensino','Pesquisa','Extensão'] : [seg];
    body.innerHTML = segs.map(s => `
      <div class="fl"><label>${s} — e-mail de contato</label>
        <input class="inp" id="contato-${s}" placeholder="email@riogrande.ifrs.edu.br"></div>
    `).join('');
    card.style.display = '';
  },

  // ── Recursos financeiros ─────────────────────────
  addRecurso() {
    const idx   = this._recursoRows++;
    const tipos = ['PIBEX','BICT','BIDTI','CNPq','PAIEX','PAIEN','AIPCTI','Outro'];
    const segs  = ['Pesquisa','Ensino','Extensão','Indissociável'];
    const tbody = document.getElementById('recurso-rows');
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.id = `rec-row-${idx}`;
    tr.innerHTML = `
      <td style="padding:8px 12px">
        <select style="width:100%;height:36px;padding:0 8px;border:1.5px solid var(--g3);border-radius:7px;font-family:'Inter',sans-serif;font-size:13px;color:var(--tx);background:var(--wh);outline:none">
          ${tipos.map(t => `<option>${t}</option>`).join('')}
        </select>
      </td>
      <td style="padding:8px 12px">
        <select style="width:100%;height:36px;padding:0 8px;border:1.5px solid var(--g3);border-radius:7px;font-family:'Inter',sans-serif;font-size:13px;color:var(--tx);background:var(--wh);outline:none">
          ${segs.map(s => `<option>${s}</option>`).join('')}
        </select>
      </td>
      ${['rec-cc','rec-cap','rec-tot','rec-oc','rec-ocap','rec-otot'].map((id,i) => `
        <td style="padding:8px 6px;background:${i<3?'#f0fdf4':'#f0f9ff'}">
          <input id="${id}-${idx}" type="number" min="0" placeholder="0"
            style="width:100%;height:32px;padding:0 8px;border:1.5px solid var(--g3);border-radius:6px;font-family:'Inter',sans-serif;font-size:12px;color:var(--tx);background:var(--wh);outline:none;text-align:center"
            ${i===2||i===5?'readonly style="width:100%;height:32px;padding:0 8px;border:1.5px solid var(--g3);border-radius:6px;font-family:Inter,sans-serif;font-size:12px;color:var(--green);background:#f0fdf4;outline:none;text-align:center;font-weight:700"':''}>
        </td>`).join('')}
      <td style="padding:8px 6px">
        <button onclick="AdminCadEdital.delRecurso(${idx})"
          style="width:30px;height:30px;border-radius:6px;border:1px solid #fca5a5;background:transparent;color:#ef4444;cursor:pointer;font-size:13px">✕</button>
      </td>`;
    tbody.appendChild(tr);
  },

  delRecurso(idx) {
    const el = document.getElementById(`rec-row-${idx}`);
    if (el) el.remove();
  },

  // ── Bolsas ────────────────────────────────────────
  addBolsa() {
    const idx   = this._bolsaRows++;
    const tipos = ['PIBEX — Pesquisa e Extensão','BICT — Iniciação Científica','BIDTI — Iniciação Tecnológica','CNPq Ensino Médio','Outro'];
    const segs  = ['Pesquisa','Ensino','Extensão','Indissociável'];
    const container = document.getElementById('bolsa-rows');
    if (!container) return;
    const div = document.createElement('div');
    div.id = `bolsa-row-${idx}`;
    div.style.cssText = 'background:var(--g1);border:1px solid var(--g3);border-radius:8px;padding:10px 12px';
    div.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr 110px 110px 110px 32px;gap:8px;align-items:center">
        <select style="height:36px;padding:0 10px;border:1.5px solid var(--g3);border-radius:7px;font-family:'Inter',sans-serif;font-size:13px;color:var(--tx);background:var(--wh);outline:none;width:100%">
          ${tipos.map(t => `<option>${t}</option>`).join('')}
        </select>
        <select style="height:36px;padding:0 10px;border:1.5px solid var(--g3);border-radius:7px;font-family:'Inter',sans-serif;font-size:13px;color:var(--tx);background:var(--wh);outline:none;width:100%">
          ${segs.map(s => `<option>${s}</option>`).join('')}
        </select>
        <input type="number" min="1" placeholder="20" value="20"
          style="height:36px;padding:0 8px;border:1.5px solid var(--g3);border-radius:7px;font-family:'Inter',sans-serif;font-size:13px;color:var(--tx);background:var(--wh);outline:none;text-align:center;width:100%">
        <input type="number" min="0" placeholder="700" value="700"
          style="height:36px;padding:0 8px;border:1.5px solid var(--g3);border-radius:7px;font-family:'Inter',sans-serif;font-size:13px;color:var(--tx);background:var(--wh);outline:none;text-align:center;width:100%">
        <input type="number" min="0" placeholder="0"
          style="height:36px;padding:0 8px;border:1.5px solid var(--g3);border-radius:7px;font-family:'Inter',sans-serif;font-size:13px;color:var(--tx);background:var(--wh);outline:none;text-align:center;width:100%">
        <button onclick="AdminCadEdital.delBolsa(${idx})"
          style="width:30px;height:30px;border-radius:6px;border:1px solid #fca5a5;background:transparent;color:#ef4444;cursor:pointer;font-size:13px">✕</button>
      </div>`;
    container.appendChild(div);
  },

  delBolsa(idx) {
    const el = document.getElementById(`bolsa-row-${idx}`);
    if (el) el.remove();
  },

  // ── Documentos (URLs HTTPS) ────────────────────────
  _initPdf(documentosJson) {
    this._pdfCnt = 0;
    document.getElementById('pdf-list').innerHTML = '';
    // Carregar documentos existentes ao editar
    let docs = [];
    if (documentosJson) {
      try { docs = JSON.parse(documentosJson); } catch(_) {}
    }
    if (Array.isArray(docs) && docs.length > 0) {
      docs.forEach(d => this.addPdf(d));
    } else {
      this.addPdf();
    }
  },

  addPdf(prefill = {}) {
    const idx   = this._pdfCnt++;
    const tipos = ['Edital principal','Anexo','Retificação','Comunicado','Resultado'];
    const list  = document.getElementById('pdf-list');
    if (!list) return;
    const esc = s => String(s || '').replace(/"/g, '&quot;');
    const div = document.createElement('div');
    div.id = `pdf-${idx}`;
    div.innerHTML = `
      <div style="display:flex;gap:10px;align-items:flex-end">
        <div class="fl" style="flex:1"><label>Tipo</label>
          <select class="inp" id="pdf-tipo-${idx}">${tipos.map(t =>
            `<option${t === (prefill.tipo||'') ? ' selected' : ''}>${t}</option>`
          ).join('')}</select></div>
        <div class="fl" style="flex:1.5"><label>Descrição (opcional)</label>
          <input class="inp" type="text" id="pdf-desc-${idx}" value="${esc(prefill.descricao||'')}" placeholder="Ex: Retificação 01"></div>
        <div class="fl" style="flex:2"><label>URL do documento (Google Drive, etc.)</label>
          <input class="inp" type="url" id="pdf-url-${idx}" value="${esc(prefill.url||'')}"
            placeholder="https://drive.google.com/..."
            style="border-color:${prefill.url && !prefill.url.startsWith('https://') ? '#ef4444' : ''}"></div>
        <div class="fl" style="flex:0 0 auto">
          <button onclick="AdminCadEdital.remPdf(${idx})" ${idx===0?'disabled':''}
            style="height:40px;width:36px;border-radius:8px;border:1px solid #fca5a5;background:transparent;color:#ef4444;cursor:pointer;font-size:13px${idx===0?';opacity:.4;cursor:not-allowed':''}">✕</button>
        </div>
      </div>`;
    list.appendChild(div);
  },

  remPdf(idx) {
    const el = document.getElementById(`pdf-${idx}`);
    if (el) el.remove();
  },

  // Coleta e valida documentos do formulário
  _coletarDocs() {
    const docs = [];
    document.querySelectorAll('[id^="pdf-"]').forEach(div => {
      if (!/^pdf-\d+$/.test(div.id)) return;
      const idx  = div.id.replace('pdf-', '');
      const tipo = (document.getElementById(`pdf-tipo-${idx}`)?.value || '').trim();
      const desc = (document.getElementById(`pdf-desc-${idx}`)?.value || '').trim();
      const url  = (document.getElementById(`pdf-url-${idx}`)?.value  || '').trim();
      if (!url) return; // ignora linhas sem URL
      // Validação: apenas HTTPS
      if (!/^https:\/\/.+/.test(url)) {
        throw new Error(`URL inválida em "${tipo}": "${url}". Use apenas URLs HTTPS.`);
      }
      docs.push({ tipo, descricao: desc, url });
    });
    return docs;
  },

  // ── Cronograma ────────────────────────────────────
  renderCrono() {
    const container = document.getElementById('crono-rows');
    if (!container) return;
    container.innerHTML = '';
    this._cronoEtapas.forEach((e, idx) => {
      const opts = this.RESPS.map(r => `<option${r===e.resp?' selected':''}>${r}</option>`).join('');
      const div  = document.createElement('div');
      div.id = `crono-${idx}`;
      div.style.cssText = 'background:var(--wh);border:1px solid var(--g3);border-radius:8px;padding:8px 10px';
      div.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 140px 12px 140px 190px 30px 30px;gap:6px;align-items:center">
          <input type="text" value="${String(e.etapa||'').replace(/"/g,'&quot;')}" placeholder="Nome da etapa"
            style="height:36px;padding:0 12px;border:1.5px solid var(--g3);border-radius:7px;font-family:'Inter',sans-serif;font-size:13px;color:var(--tx);background:var(--wh);outline:none;width:100%"
            oninput="AdminCadEdital._cronoEtapas[${idx}].etapa=this.value">
          <input type="date" value="${e.dataIni||''}"
            style="height:36px;padding:0 8px;border:1.5px solid var(--g3);border-radius:7px;font-family:'Inter',sans-serif;font-size:12px;color:var(--tx);background:var(--wh);outline:none;width:100%"
            onchange="AdminCadEdital._cronoEtapas[${idx}].dataIni=this.value">
          <span style="font-size:11px;color:var(--g4);text-align:center">a</span>
          <input type="date" value="${e.dataFim||''}"
            style="height:36px;padding:0 8px;border:1.5px solid var(--g3);border-radius:7px;font-family:'Inter',sans-serif;font-size:12px;color:var(--tx);background:var(--wh);outline:none;width:100%"
            onchange="AdminCadEdital._cronoEtapas[${idx}].dataFim=this.value">
          <select style="height:36px;padding:0 8px;border:1.5px solid var(--g3);border-radius:7px;font-family:'Inter',sans-serif;font-size:12px;color:var(--tx);background:var(--wh);outline:none;width:100%"
            onchange="AdminCadEdital._cronoEtapas[${idx}].resp=this.value">${opts}</select>
          <button title="Alarme" style="width:30px;height:30px;border-radius:6px;border:1.5px solid var(--g3);background:transparent;color:var(--g4);cursor:pointer;font-size:14px"
            onclick="toast('🔔 Alarmes em breve!')">🔔</button>
          <button onclick="AdminCadEdital.delCrono(${idx})"
            style="width:30px;height:30px;border-radius:6px;border:1px solid #fca5a5;background:transparent;color:#ef4444;cursor:pointer;font-size:13px">✕</button>
        </div>`;
      container.appendChild(div);
    });
  },

  addCrono() {
    this._cronoEtapas.push({ etapa: '', dataIni: '', dataFim: '', resp: 'Coordenador(a) do Projeto' });
    this.renderCrono();
    const rows = document.querySelectorAll('#crono-rows > div');
    if (rows.length) {
      const inp = rows[rows.length-1].querySelector('input[type=text]');
      if (inp) inp.focus();
    }
  },

  delCrono(idx) {
    if (this._cronoEtapas.length <= 1) return;
    this._cronoEtapas.splice(idx, 1);
    this.renderCrono();
  },

  // ── Salvar (criar ou atualizar) ───────────────────
  async salvar(forcarStatus) {
    const numero = val('f-numero');
    const titulo = val('f-titulo');
    if (!numero || !titulo) { toast('⚠ Preencha número e título.'); return; }

    // Coletar e validar documentos
    let documentos;
    try {
      const docs = AdminCadEdital._coletarDocs();
      documentos = JSON.stringify(docs);
    } catch(e) {
      toast('⚠ ' + e.message);
      return;
    }

    const dados = {
      id:         AdminCadEdital._editId,       // null = novo, string = atualizar
      updated_at: AdminCadEdital._updatedAt,    // controle de concorrência
      numero,
      titulo,
      segmento:  val('f-segmento'),
      tipo:      val('f-tipo'),
      status:    forcarStatus || val('f-status'),
      descricao: val('f-descricao'),
      documentos,
      vigIni: val('vig-pesq-ini') || val('vig-ensi-ini') || val('vig-exte-ini'),
      vigFim: val('vig-pesq-fim') || val('vig-ensi-fim') || val('vig-exte-fim'),
      bolsaValor: '',
      bolsaCH:    '',
      vagas:      ''
    };

    toast('⏳ Salvando...');
    try {
      await API.salvarEdital(dados);
      toast('✓ Edital salvo!');
      // Recarrega dados do servidor para garantir consistência
      await AdminEditais._recarregar();
      AdminRouter.ir('editais');
    } catch(e) { toast('❌ ' + e.message); }
  }
};
