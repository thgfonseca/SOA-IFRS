// pages/admin/editais.js

// ══════════════════════════════════════════════════════════════════
// AdminEditais — Listagem de editais
// ══════════════════════════════════════════════════════════════════
const AdminEditais = {

  _filtroSeg:    'todos',
  _filtroStatus: '',

  render(app) {
    const ativos = (SOA.editais || []).filter(e => !e.deleted_at || e.deleted_at === '');
    const total  = ativos.length;
    const cnt    = seg => ativos.filter(e => e.segmento === seg).length;

    app.innerHTML = `
    <div class="ph">
      <div><h1>Lista de editais</h1><p>Editais cadastrados no SOA</p></div>
      <div class="phr" style="display:flex;gap:8px;align-items:center">
        <div class="export-wrap" id="exp-editais">
          <button onclick="AdminEditais.toggleExport()"
            style="height:36px;padding:0 16px;border-radius:8px;border:1.5px solid #0e7490;background:#0e7490;color:#fff;font-family:'Inter',sans-serif;font-size:13px;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:6px">
            ↓ Exportar
          </button>
          <div class="export-menu">
            <div class="export-item" onclick="AdminEditais.exportar('pdf')">📄 PDF</div>
            <div class="export-item" onclick="AdminEditais.exportar('xlsx')">📊 Excel (.xlsx)</div>
            <div class="export-item" onclick="AdminEditais.exportar('csv')">📋 CSV (vírgula)</div>
          </div>
        </div>
        <button onclick="AdminCadEdital.render(document.getElementById('app'))"
          style="height:36px;padding:0 16px;border-radius:8px;border:1.5px solid var(--green);background:var(--green);color:#fff;font-family:'Inter',sans-serif;font-size:13px;font-weight:500;cursor:pointer">
          + Cadastrar edital
        </button>
      </div>
    </div>

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

    <div id="ebar" style="height:3px;border-radius:2px;margin-bottom:16px;
      background:linear-gradient(to right,var(--ensi),var(--pesq),var(--exte));transition:background .3s"></div>

    <div id="cnt-editais" style="font-size:12px;color:var(--g4);margin-bottom:12px">
      Mostrando <strong style="color:var(--tx)">${total}</strong> de <strong style="color:var(--tx)">${total}</strong> registros
    </div>

    <div class="card">
      <table id="tbl-editais">
        <thead><tr>
          <th class="sortable" onclick="AdminEditais.sortCol(0,this)">Status <span class="sort-ico">↕</span></th>
          <th class="sortable" onclick="AdminEditais.sortCol(1,this)">Segmento <span class="sort-ico">↕</span></th>
          <th class="sortable" onclick="AdminEditais.sortCol(2,this)">Número/Ano <span class="sort-ico">↕</span></th>
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

    const lista = (SOA.editais || []).filter(e => {
      if (e.deleted_at && e.deleted_at !== '') return false;
      const segOk    = AdminEditais._filtroSeg === 'todos' || e.segmento === AdminEditais._filtroSeg;
      const statusOk = !AdminEditais._filtroStatus || e.status === AdminEditais._filtroStatus;
      return segOk && statusOk;
    });

    const total = (SOA.editais || []).filter(e => !e.deleted_at || e.deleted_at === '').length;
    const cnt   = document.getElementById('cnt-editais');
    if (cnt) cnt.innerHTML = `Mostrando <strong style="color:var(--tx)">${lista.length}</strong> de <strong style="color:var(--tx)">${total}</strong> registros`;

    const empty = document.getElementById('editais-empty');
    const tbl   = document.getElementById('tbl-editais');
    if (empty) empty.style.display = lista.length === 0 ? '' : 'none';
    if (tbl)   tbl.style.display   = lista.length === 0 ? 'none' : '';

    tbody.innerHTML = lista.map(e => {
      const sc     = AdminEditais._segColors(e.segmento);
      const ss     = AdminEditais._statusStyle(e.status);
      const id     = AdminEditais._sanitize(e.id);
      const numero = AdminEditais._sanitize(e.numero);
      const titulo = AdminEditais._sanitize(e.titulo);
      const seg    = AdminEditais._sanitize(e.segmento);
      const tipo   = AdminEditais._sanitize(e.tipo || '');
      const status = AdminEditais._sanitize(e.status);
      const vigIni = AdminEditais._fmtDataOnly(e.vigIni);
      const vigFim = AdminEditais._fmtDataOnly(e.vigFim);
      const upd    = AdminEditais._fmtData(e.updated_at || e.criadoEm);

      return `
      <tr id="edital-row-${id}" data-seg="${seg}" data-status="${status}">
        <td><span class="b" style="${ss};padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600">${status}</span></td>
        <td><span class="b" style="background:${sc.bg};color:${sc.color};border:1px solid ${sc.border}">${seg}</span></td>
        <td><div class="tm">${numero}</div></td>
        <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${titulo}">${titulo}</td>
        <td style="font-size:12px">${tipo}</td>
        <td style="font-size:12px;white-space:nowrap">${vigIni} – ${vigFim}</td>
        <td><div class="acts">
          <button class="ab" onclick="AdminEditais.toggleNotif('${id}')" title="Enviar notificação" style="font-size:14px;padding:0 8px">🔔</button>
          <button class="ab" onclick="AdminEditais.toggleVer('${id}')">Ver</button>
          <button class="ab" onclick="AdminEditais.editar('${id}')">Editar</button>
          <button class="ab" onclick="AdminEditais.duplicar('${id}')">Duplicar</button>
          <button class="ab dg" onclick="AdminEditais.excluir('${id}')">Excluir</button>
        </div></td>
        <td style="font-size:11px;color:var(--g4)">${upd}</td>
      </tr>

      <tr id="ver-${id}" style="display:none">
        <td colspan="8" style="padding:0">${AdminEditais._renderVerPanel(e)}</td>
      </tr>

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
                  <option value="retificacao">Retificação publicada</option>
                  <option value="livre">Mensagem livre</option>
                </select>
              </div>
            </div>
            <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="mfl"><label>Assunto</label>
                <input type="text" id="nassunto-${id}" class="selbox" style="height:34px" placeholder="Assunto do e-mail"></div>
              <div class="mfl"><label>Mensagem</label>
                <textarea id="nmsg-${id}" rows="3" style="width:100%;padding:8px 10px;border:1.5px solid var(--g3);border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;color:var(--tx);resize:vertical;box-sizing:border-box"></textarea></div>
            </div>
            <!-- Agendamento -->
            <div style="margin-top:10px;padding:8px 12px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px">
              <div style="font-size:11px;font-weight:600;color:var(--g5);margin-bottom:6px">⏰ Quando enviar?</div>
              <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
                <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px;user-select:none">
                  <input type="radio" name="notif-modo-${id}" value="agora" checked
                    onchange="document.getElementById('nsched-wrap-${id}').style.display='none'">
                  Enviar agora
                </label>
                <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px;user-select:none">
                  <input type="radio" name="notif-modo-${id}" value="agendar"
                    onchange="document.getElementById('nsched-wrap-${id}').style.display='flex'">
                  Agendar para:
                </label>
                <div id="nsched-wrap-${id}" style="display:none;gap:6px;align-items:center">
                  <input type="date" id="nsched-data-${id}"
                    style="height:30px;padding:0 8px;border:1.5px solid var(--g3);border-radius:7px;font-family:'Inter',sans-serif;font-size:12px;color:var(--tx)">
                  <input type="time" id="nsched-hora-${id}" value="08:00"
                    style="height:30px;padding:0 8px;border:1.5px solid var(--g3);border-radius:7px;font-family:'Inter',sans-serif;font-size:12px;color:var(--tx)">
                </div>
              </div>
            </div>
            <div class="alarm-footer" style="margin-top:12px">
              <span class="send-flash" id="nflash-${id}">✓ Enviado!</span>
              <div style="display:flex;gap:8px">
                <button class="btn bo" style="height:32px;font-size:12px" onclick="AdminEditais.toggleNotif('${id}')">Cancelar</button>
                <button class="btn bp" style="height:32px;font-size:12px" onclick="AdminEditais._despacharNotif('${id}','${id}')">✉ Enviar / Agendar</button>
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

    // Documentos
    let docsHtml = '';
    if (e.documentos) {
      let docs = [];
      try { docs = JSON.parse(e.documentos); } catch(_) {}
      if (Array.isArray(docs) && docs.length > 0) {
        const itens = docs.map(d => {
          const tipo  = AdminEditais._sanitize(d.tipo || '');
          const desc  = AdminEditais._sanitize(d.descricao || '');
          const urlOk = AdminEditais._validateUrl(d.url);
          const urlS  = urlOk ? AdminEditais._sanitize(d.url) : '';
          const prin  = d.principal ? ' <span style="font-size:10px;background:#dcfce7;color:#166534;border-radius:4px;padding:1px 5px;font-weight:600">principal</span>' : '';
          return `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #e0f2fe">
            <span style="font-size:11px;font-weight:600;color:var(--g5);min-width:110px">${tipo}${prin}</span>
            <span style="font-size:12px;flex:1;color:var(--tx)">${desc}</span>
            ${urlOk
              ? `<a href="${urlS}" target="_blank" rel="noopener noreferrer"
                   style="font-size:12px;color:#0e7490;text-decoration:none;font-weight:500;white-space:nowrap">⬇ Download</a>`
              : `<span style="font-size:11px;color:#ef4444">URL inválida</span>`}
          </div>`;
        }).join('');
        docsHtml = `<div style="margin-bottom:14px">
          <div style="font-size:11px;font-weight:600;color:var(--g5);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Documentos</div>
          ${itens}</div>`;
      }
    }

    // Vigências adicionais
    let vigsHtml = '';
    if (e.vigencias) {
      let vigs = [];
      try { vigs = JSON.parse(e.vigencias); } catch(_) {}
      if (Array.isArray(vigs) && vigs.length > 0) {
        const linhas = vigs.map(v => {
          const sc2 = AdminEditais._segColors(v.segmento || '');
          return `<div style="display:flex;align-items:center;gap:10px;padding:5px 0;border-bottom:1px solid #f1f5f9">
            <span class="b" style="background:${sc2.bg};color:${sc2.color};font-size:11px">${AdminEditais._sanitize(v.segmento||'')}</span>
            <span style="font-size:12px;color:var(--g5)">${AdminEditais._sanitize(v.ini||'—')} → ${AdminEditais._sanitize(v.fim||'—')}</span>
          </div>`;
        }).join('');
        vigsHtml = `<div style="margin-bottom:14px">
          <div style="font-size:11px;font-weight:600;color:var(--g5);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Vigências das Ações</div>
          ${linhas}</div>`;
      }
    }

    return `
      <div class="alarm-panel open" style="background:#f0f9ff;border-top-color:#bae6fd">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px">
          <div style="font-size:13px;font-weight:600;color:#0e4d6b">👁 ${numero} — ${titulo}</div>
          <div style="font-size:10px;color:var(--g4);font-family:'Courier New',monospace;background:#e0f2fe;padding:2px 8px;border-radius:4px;white-space:nowrap">ID: ${id}</div>
        </div>
        <div class="alarm-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px">
          <div>
            <div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Tipo</div>
            <div style="font-size:13px">${AdminEditais._sanitize(e.tipo||'—')}</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Âmbito</div>
            <div style="font-size:13px">${AdminEditais._sanitize(e.ambito||'—')}</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Segmento</div>
            <span class="b" style="background:${sc.bg};color:${sc.color}">${AdminEditais._sanitize(e.segmento||'—')}</span>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Status</div>
            <span style="${ss};padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600">${AdminEditais._sanitize(e.status||'—')}</span>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Vigência geral</div>
            <div style="font-size:13px">${AdminEditais._fmtDataOnly(e.vigIni)} – ${AdminEditais._fmtDataOnly(e.vigFim)}</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Criado por</div>
            <div style="font-size:12px;color:var(--g5)">${AdminEditais._sanitize(e.criadoPor||'—')}</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Criado em</div>
            <div style="font-size:12px;color:var(--g5)">${AdminEditais._fmtData(e.criadoEm)}</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:var(--g5);text-transform:uppercase;margin-bottom:4px">Última atualização</div>
            <div style="font-size:12px;color:var(--g5)">${AdminEditais._fmtData(e.updated_at||e.criadoEm)}</div>
          </div>
        </div>
        ${e.descricao ? `<div style="font-size:13px;color:var(--g5);line-height:1.6;margin-bottom:14px;padding:10px;background:#e0f2fe;border-radius:8px">${AdminEditais._sanitize(e.descricao)}</div>` : ''}
        ${vigsHtml}
        ${docsHtml}
        <div style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid #bae6fd;padding-top:12px">
          <button class="btn bo" style="height:30px;font-size:12px" onclick="AdminEditais.toggleVer('${id}')">Fechar</button>
          <button class="btn" style="height:30px;font-size:12px;background:#0e7490;color:#fff;border:none;border-radius:8px;padding:0 14px;cursor:pointer"
            onclick="AdminCadEdital.exportarPdf('${id}')">📄 Exportar PDF</button>
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
      Ensino:        'var(--ensi)', Pesquisa: 'var(--pesq)',
      'Extensão':    'var(--exte)', Indissociável: 'var(--indi)'
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
    const row  = document.getElementById('ver-' + id);
    if (!row) return;
    const open = row.style.display === 'table-row';
    document.querySelectorAll('[id^="ver-"],[id^="notif-"]').forEach(r => r.style.display = 'none');
    if (!open) row.style.display = 'table-row';
  },

  toggleNotif(id) {
    const row  = document.getElementById('notif-' + id);
    if (!row) return;
    const open = row.style.display === 'table-row';
    document.querySelectorAll('[id^="ver-"],[id^="notif-"]').forEach(r => r.style.display = 'none');
    if (!open) row.style.display = 'table-row';
  },

  preencherNotif(id, tipo) {
    const tpls = {
      relatorio:    { ass: 'SOA/IFRS — Relatório Pendente',      msg: 'Prezado(a),\n\nO relatório está pendente. Acesse o SOA e regularize.\n\nAtenciosamente,\nSecretaria Acadêmica — IFRS Campus Rio Grande' },
      assiduidade:  { ass: 'SOA/IFRS — Assiduidade Pendente',    msg: 'Prezado(a),\n\nO registro de assiduidade está pendente.\n\nAtenciosamente,\nSecretaria Acadêmica — IFRS Campus Rio Grande' },
      documentacao: { ass: 'SOA/IFRS — Documentação Incompleta', msg: 'Prezado(a),\n\nSua documentação está incompleta. Regularize no SIGAA.\n\nAtenciosamente,\nSecretaria Acadêmica — IFRS Campus Rio Grande' },
      retificacao:  { ass: 'SOA/IFRS — Retificação Publicada',   msg: 'Prezado(a),\n\nUma retificação foi publicada para este edital. Acesse o SOA para verificar.\n\nAtenciosamente,\nSecretaria Acadêmica — IFRS Campus Rio Grande' },
      livre:        { ass: '', msg: '' }
    };
    const tpl = tpls[tipo]; if (!tpl) return;
    const a = document.getElementById('nassunto-' + id);
    const m = document.getElementById('nmsg-' + id);
    if (a) a.value = tpl.ass;
    if (m) m.value = tpl.msg;
  },

  async enviarNotif(id, editalId) {
    const assunto = (document.getElementById('nassunto-' + id) || {}).value || '';
    const msg     = (document.getElementById('nmsg-' + id) || {}).value || '';
    if (!assunto || !msg) { toast('⚠ Preencha assunto e mensagem.'); return; }
    try {
      await API.enviarNotificacao({ editalId, assunto, mensagem: msg });
      const fl = document.getElementById('nflash-' + id);
      if (fl) { fl.classList.add('show'); setTimeout(() => fl.classList.remove('show'), 3000); }
      toast('✉ Notificação enviada!');
    } catch(e) { toast('❌ ' + e.message); }
  },

  async _despacharNotif(id, editalId) {
    const modoEl = document.querySelector(`input[name="notif-modo-${id}"]:checked`);
    const modo   = modoEl ? modoEl.value : 'agora';
    if (modo === 'agendar') {
      await AdminEditais._agendarNotif(id, editalId);
    } else {
      await AdminEditais.enviarNotif(id, editalId);
    }
  },

  async _agendarNotif(id, editalId) {
    const assunto  = (document.getElementById('nassunto-' + id) || {}).value || '';
    const msg      = (document.getElementById('nmsg-' + id)     || {}).value || '';
    const dataRaw  = (document.getElementById('nsched-data-' + id) || {}).value || '';
    const horaVal  = (document.getElementById('nsched-hora-' + id) || {}).value || '08:00';
    if (!assunto || !msg) { toast('⚠ Preencha assunto e mensagem.'); return; }
    if (!dataRaw)         { toast('⚠ Selecione a data para agendamento.'); return; }
    const m = dataRaw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const dataBR       = m ? `${m[3]}/${m[2]}/${m[1]}` : dataRaw;
    const agendadoPara = `${dataBR} ${horaVal}`;
    try {
      await API.agendarNotificacao({ editalId, assunto, mensagem: msg, agendadoPara });
      toast(`⏰ Notificação agendada para ${agendadoPara}!`);
      AdminEditais.toggleNotif(id);
    } catch(e) { toast('❌ ' + e.message); }
  },

  // ── Sort ──────────────────────────────────────────
  _sortState: {},
  sortCol(colIdx, th) {
    const tbl = document.getElementById('tbl-editais'); if (!tbl) return;
    const key = 'ed-' + colIdx;
    const asc = AdminEditais._sortState[key] !== true;
    AdminEditais._sortState[key] = asc;
    tbl.querySelectorAll('th').forEach(h => h.classList.remove('sort-asc','sort-desc'));
    th.classList.add(asc ? 'sort-asc' : 'sort-desc');
    const tbody = tbl.querySelector('tbody');
    Array.from(tbody.querySelectorAll('tr[id^="edital-row-"]'))
      .sort((a, b) => {
        const at = (a.cells[colIdx]?.innerText || '').trim().toLowerCase();
        const bt = (b.cells[colIdx]?.innerText || '').trim().toLowerCase();
        return asc ? at.localeCompare(bt, 'pt') : bt.localeCompare(at, 'pt');
      })
      .forEach(r => tbody.appendChild(r));
  },

  // ── CRUD ──────────────────────────────────────────
  editar(id) {
    const e = (SOA.editais || []).find(x => x.id === id);
    if (e) AdminCadEdital.render(document.getElementById('app'), e);
  },

  async duplicar(id) {
    const e = (SOA.editais || []).find(x => x.id === id);
    if (!e) return;
    const novo = { ...e, id: null, numero: e.numero + ' (cópia)', status: 'Rascunho', updated_at: undefined, deleted_at: undefined };
    toast('⏳ Duplicando...');
    try {
      await API.salvarEdital(novo);
      toast('✓ Edital duplicado como Rascunho.');
      await AdminEditais._recarregar();
    } catch(err) { toast('❌ ' + err.message); }
  },

  excluir(id) {
    const e     = (SOA.editais || []).find(x => x.id === id);
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
        } catch(e2) { toast('❌ ' + e2.message); }
      }
    );
  },

  async _recarregar() {
    const token = sessionStorage.getItem('soa_token'); if (!token) return;
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

  // ── Helpers ───────────────────────────────────────
  _sanitize(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
  },

  _validateUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try { return new URL(url.trim()).protocol === 'https:'; } catch(_) { return false; }
  },

  _fmtDataOnly(v) {
    if (!v || v === '—') return '—';
    const s = String(v).trim();
    if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) return s.substring(0, 10);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return s.substring(0, 10);
  },

  _fmtData(v) {
    if (!v || v === '—') return '—';
    const s = String(v).trim();
    if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) return s;
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2,'0'), mm = String(d.getMonth()+1).padStart(2,'0'), yyyy = d.getFullYear();
      if (s.includes(':')) {
        const hh = String(d.getHours()).padStart(2,'0'), mi = String(d.getMinutes()).padStart(2,'0'), ss2 = String(d.getSeconds()).padStart(2,'0');
        return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss2}`;
      }
      return `${dd}/${mm}/${yyyy}`;
    }
    return s;
  },

  _segColors(seg) {
    const map = {
      Pesquisa:     { bg:'#e8f4fc', color:'#54a4c3', border:'#54a4c330' },
      Ensino:       { bg:'#f0f7dc', color:'#9cbb31', border:'#9cbb3130' },
      'Extensão':   { bg:'#fffbeb', color:'#f4b61d', border:'#f4b61d30' },
      Indissociável:{ bg:'#f3e8ff', color:'#592b9b', border:'#592b9b30' }
    };
    return map[seg] || { bg:'#f1f5f9', color:'#475569', border:'#e5e7eb' };
  },

  _statusStyle(status) {
    const map = {
      Publicado:'background:#dcfce7;color:#166534', Rascunho:'background:#f1f5f9;color:#475569',
      Pendente:'background:#fef9c3;color:#854d0e',  Encerrado:'background:#f1f5f9;color:#6b7280'
    };
    return map[status] || 'background:#f1f5f9;color:#475569';
  },

  // ── Exportar ──────────────────────────────────────
  toggleExport() {
    document.getElementById('exp-editais')?.classList.toggle('open');
  },

  _fecharExport(e) {
    if (!e.target.closest('#exp-editais'))
      document.getElementById('exp-editais')?.classList.remove('open');
  },

  exportar(fmt) {
    document.getElementById('exp-editais')?.classList.remove('open');
    const lista = (SOA.editais || []).filter(e => {
      if (e.deleted_at && e.deleted_at !== '') return false;
      return (AdminEditais._filtroSeg === 'todos' || e.segmento === AdminEditais._filtroSeg)
          && (!AdminEditais._filtroStatus || e.status === AdminEditais._filtroStatus);
    });
    const headers = ['ID','Número','Título','Segmento','Tipo','Âmbito','Status','Vigência Início','Vigência Fim','Descrição'];
    const rows = lista.map(e => [
      e.id, e.numero, e.titulo, e.segmento, e.tipo, e.ambito || '', e.status,
      AdminEditais._fmtDataOnly(e.vigIni), AdminEditais._fmtDataOnly(e.vigFim), e.descricao
    ]);
    const csvEsc = v => {
      const s = String(v || '');
      return '"' + (/^[=+\-@\t\r]/.test(s) ? "'" + s : s).replace(/"/g,'""') + '"';
    };
    if (fmt === 'csv') {
      AdminEditais._dl('editais.csv','text/csv','\uFEFF'+[headers,...rows].map(r=>r.map(csvEsc).join(',')).join('\n'));
    } else if (fmt === 'xlsx') {
      AdminEditais._dl('editais.xls','application/vnd.ms-excel','\uFEFF'+[headers,...rows].map(r=>r.map(c=>String(c||'')).join('\t')).join('\n'));
    } else if (fmt === 'pdf') {
      const w = window.open('','_blank');
      if (!w) { toast('⚠ Permita pop-ups para exportar PDF.'); return; }
      const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Editais — SOA IFRS</title>
        <style>body{font-family:Arial;padding:20px;font-size:11px}h2{color:#00843D}
        table{width:100%;border-collapse:collapse}
        th{background:#00843D;color:#fff;padding:7px 9px;text-align:left;font-size:11px}
        td{padding:6px 9px;border-bottom:1px solid #eee}tr:nth-child(even)td{background:#f8f9fa}
        </style></head><body>
        <h2>SOA — IFRS Campus Rio Grande</h2>
        <p style="color:#6b7280">Lista de Editais · ${new Date().toLocaleDateString('pt-BR')}</p>
        <table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
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


// ══════════════════════════════════════════════════════════════════
// AdminCadEdital — Formulário de cadastro/edição de edital
// ══════════════════════════════════════════════════════════════════
const AdminCadEdital = {

  _editId:      null,
  _updatedAt:   '',
  _cronoEtapas: [],
  _recursoRows: 0,
  _bolsaRows:   0,
  _pdfCnt:      0,
  _vigRows:     0,
  _docsMeta:    {},   // { [idx]: { url, nome, mimeType, uploadedAt } }

  TIPOS_EDITAL:   ['Auxílio','Fluxo contínuo','Bolsas','Curricularização da Extensão','Conjunto','Outro'],
  AMBITOS:        ['Interno – IFRS Campus Rio Grande','Externo – Outra Instituição ou Órgão','Outro'],
  TIPOS_PROGRAMA: ['PAIEX','AIPTCI','PAIEN','Outro'],
  TIPOS_BOLSA:    ['PIBEX','BICT — Iniciação Científica','BIDTI — Iniciação ao DTI e Inovação','BAT — Apoio Técnico','BET — Ensino Técnico','BES — Educação Superior','Outro'],
  TIPOS_DOC:      ['Edital','Anexos','Retificações','Demais Publicações'],
  SEGS:           ['Pesquisa','Ensino','Extensão','Indissociável'],
  STATS:          ['Rascunho','Publicado','Pendente','Encerrado'],

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
    { etapa:'Publicação do edital',                          dataIni:'', dataFim:'', resp:'Direção de Ensino, Pesquisa e Extensão (DEPE)', respOutro:'' },
    { etapa:'Período de inscrição dos estudantes',           dataIni:'', dataFim:'', resp:'Candidatos às bolsas', respOutro:'' },
    { etapa:'Envio de documentos aos coordenadores',         dataIni:'', dataFim:'', resp:'Candidatos às bolsas', respOutro:'' },
    { etapa:'Retorno do coordenador (horários)',             dataIni:'', dataFim:'', resp:'Coordenador(a) do Projeto', respOutro:'' },
    { etapa:'Publicação da lista de candidatos',             dataIni:'', dataFim:'', resp:'Direção de Ensino, Pesquisa e Extensão (DEPE)', respOutro:'' },
    { etapa:'Período para seleção dos bolsistas',            dataIni:'', dataFim:'', resp:'Coordenador(a) do Projeto', respOutro:'' },
    { etapa:'Envio da Ata de seleção',                       dataIni:'', dataFim:'', resp:'Coordenador(a) do Projeto', respOutro:'' },
    { etapa:'Divulgação do resultado preliminar',            dataIni:'', dataFim:'', resp:'Direção de Ensino, Pesquisa e Extensão (DEPE)', respOutro:'' },
    { etapa:'Período para interposição de recursos',         dataIni:'', dataFim:'', resp:'Candidatos às bolsas', respOutro:'' },
    { etapa:'Análise dos recursos',                          dataIni:'', dataFim:'', resp:'Coordenador(a) do Projeto', respOutro:'' },
    { etapa:'Divulgação do resultado final',                 dataIni:'', dataFim:'', resp:'Direção de Ensino, Pesquisa e Extensão (DEPE)', respOutro:'' },
    { etapa:'Envio dos formulários do bolsista',             dataIni:'', dataFim:'', resp:'Coordenador(a) do Projeto', respOutro:'' },
    { etapa:'Início das atividades (Ensino/Pesquisa)',       dataIni:'', dataFim:'', resp:'Bolsistas', respOutro:'' },
    { etapa:'Início das atividades (Extensão)',              dataIni:'', dataFim:'', resp:'Bolsistas', respOutro:'' },
    { etapa:'Término (Extensão)',                            dataIni:'', dataFim:'', resp:'Bolsistas', respOutro:'' },
    { etapa:'Término (Ensino / Pesquisa / Indissociáveis)',  dataIni:'', dataFim:'', resp:'Bolsistas', respOutro:'' }
  ],

  // ── Render principal ─────────────────────────────
  render(app, dados = {}) {
    this._editId    = dados.id    || null;
    this._updatedAt = dados.updated_at || '';
    this._docsMeta  = {};
    this._recursoRows = 0;
    this._bolsaRows   = 0;
    this._pdfCnt      = 0;
    this._vigRows     = 0;

    // Carregar cronograma: do dado salvo ou padrão
    this._cronoEtapas = JSON.parse(JSON.stringify(this.CRONO_DEFAULT));
    if (dados.cronograma) {
      try {
        const c = JSON.parse(dados.cronograma);
        if (Array.isArray(c) && c.length > 0) this._cronoEtapas = c;
      } catch(_) {}
    }

    const esc = s => String(s || '').replace(/"/g,'&quot;');

    // Detectar "Outro" em tipo e âmbito
    const tipoStd    = this.TIPOS_EDITAL.slice(0,-1);
    const ambitoStd  = this.AMBITOS.slice(0,-1);
    const tipoIsOutro   = dados.tipo   && !tipoStd.includes(dados.tipo);
    const ambitoIsOutro = dados.ambito && !ambitoStd.includes(dados.ambito);
    const tipoVal    = tipoIsOutro   ? 'Outro' : (dados.tipo   || '');
    const ambitoVal  = ambitoIsOutro ? 'Outro' : (dados.ambito || '');

    app.innerHTML = `
    <div class="ph">
      <div>
        <h1>${dados.id ? 'Editar' : 'Cadastrar'} edital</h1>
        <p>${dados.id ? `Editando: <strong>${esc(dados.titulo||'')}</strong>` : 'Preencha os dados do novo edital'}</p>
      </div>
      <div class="phr"><button class="btn bo" onclick="AdminRouter.ir('editais')">← Cancelar</button></div>
    </div>

    <!-- ─── 1. Dados gerais ─────────────────────── -->
    <div class="card">
      <div class="ch"><h3>1. Dados gerais</h3></div>
      <div class="fg">
        <div class="fl">
          <label>Número <span style="color:#ef4444">*</span></label>
          <input class="inp" id="f-numero" value="${esc(dados.numero||'')}" placeholder="001">
        </div>
        <div class="fl">
          <label>Ano <span style="color:#ef4444">*</span></label>
          <input class="inp" id="f-ano" value="${esc(dados.ano||String(new Date().getFullYear()))}" placeholder="${new Date().getFullYear()}">
        </div>
        <div class="fl">
          <label>Tipo de edital <span style="color:#ef4444">*</span></label>
          <select class="inp" id="f-tipo" onchange="AdminCadEdital._onTipoChange()">
            <option value="">Selecione...</option>
            ${selectOpts(this.TIPOS_EDITAL, tipoVal)}
          </select>
          <input class="inp" id="f-tipo-outro" placeholder="Descreva o tipo..."
            value="${tipoIsOutro ? esc(dados.tipo||'') : ''}"
            style="${tipoIsOutro ? '' : 'display:none;'}margin-top:6px">
        </div>
        <div class="fl">
          <label>Âmbito <span style="color:#ef4444">*</span></label>
          <select class="inp" id="f-ambito" onchange="AdminCadEdital._onAmbitoChange()">
            <option value="">Selecione...</option>
            ${selectOpts(this.AMBITOS, ambitoVal)}
          </select>
          <input class="inp" id="f-ambito-outro" placeholder="Descreva o âmbito..."
            value="${ambitoIsOutro ? esc(dados.ambito||'') : ''}"
            style="${ambitoIsOutro ? '' : 'display:none;'}margin-top:6px">
        </div>
        <div class="fl">
          <label>Segmento <span style="color:#ef4444">*</span></label>
          <select class="inp" id="f-segmento" onchange="AdminCadEdital.onSegChange(this)">
            <option value="">Selecione...</option>
            ${selectOpts(this.SEGS, dados.segmento||'')}
          </select>
        </div>
        <div class="fl">
          <label>Status</label>
          <select class="inp" id="f-status">${selectOpts(this.STATS, dados.status||'Rascunho')}</select>
        </div>
        <div class="fl s2">
          <label>Título completo <span style="color:#ef4444">*</span></label>
          <input class="inp" id="f-titulo" value="${esc(dados.titulo||'')}" placeholder="Ex: Edital 001/2025 — Bolsas de Pesquisa AIPCTI">
        </div>
        <div class="fl s2">
          <label>Descrição / Ementa</label>
          <textarea class="inp" id="f-descricao" rows="3" placeholder="Descrição resumida do edital...">${esc(dados.descricao||'')}</textarea>
        </div>
      </div>
    </div>

    <!-- ─── 2. Recursos financeiros ─────────────── -->
    <div class="card">
      <div class="ch" style="justify-content:space-between">
        <div>
          <h3>2. Recursos e auxílios financeiros</h3>
          <p style="font-size:12px;color:var(--g4);margin-top:2px">Um recurso por segmento — custeio e capital (valores em R$)</p>
        </div>
        <button class="btn bo" style="font-size:12px" onclick="AdminCadEdital.addRecurso()">+ Adicionar recurso</button>
      </div>
      <div style="overflow-x:auto">
        <table style="width:100%;min-width:900px;border-collapse:collapse">
          <thead>
            <tr style="background:var(--g1)">
              <th rowspan="2" style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;padding:8px 12px;border-bottom:1px solid var(--g3);text-align:left;min-width:180px">Tipo / Programa</th>
              <th rowspan="2" style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;padding:8px 12px;border-bottom:1px solid var(--g3);text-align:left;min-width:130px">Segmento</th>
              <th colspan="3" style="font-size:11px;font-weight:600;color:#166534;text-transform:uppercase;padding:6px 12px;border-bottom:1px solid var(--g3);text-align:center;background:#f0fdf4">Campus (R$)</th>
              <th colspan="3" style="font-size:11px;font-weight:600;color:#0e4d6b;text-transform:uppercase;padding:6px 12px;border-bottom:1px solid var(--g3);text-align:center;background:#f0f9ff">Outro órgão (R$)</th>
              <th rowspan="2" style="padding:8px 6px;border-bottom:1px solid var(--g3);width:36px"></th>
            </tr>
            <tr style="background:var(--g1)">
              <th style="font-size:10px;font-weight:600;color:#166534;text-transform:uppercase;padding:5px 12px;border-bottom:1px solid var(--g3);text-align:center;background:#f0fdf4;min-width:90px">Custeio</th>
              <th style="font-size:10px;font-weight:600;color:#166534;text-transform:uppercase;padding:5px 12px;border-bottom:1px solid var(--g3);text-align:center;background:#f0fdf4;min-width:90px">Capital</th>
              <th style="font-size:10px;font-weight:600;color:#166534;text-transform:uppercase;padding:5px 12px;border-bottom:1px solid var(--g3);text-align:center;background:#dcfce7;min-width:90px">Total auto</th>
              <th style="font-size:10px;font-weight:600;color:#0e4d6b;text-transform:uppercase;padding:5px 12px;border-bottom:1px solid var(--g3);text-align:center;background:#f0f9ff;min-width:90px">Custeio</th>
              <th style="font-size:10px;font-weight:600;color:#0e4d6b;text-transform:uppercase;padding:5px 12px;border-bottom:1px solid var(--g3);text-align:center;background:#f0f9ff;min-width:90px">Capital</th>
              <th style="font-size:10px;font-weight:600;color:#0e4d6b;text-transform:uppercase;padding:5px 12px;border-bottom:1px solid var(--g3);text-align:center;background:#e0f2fe;min-width:90px">Total auto</th>
            </tr>
          </thead>
          <tbody id="recurso-rows"></tbody>
        </table>
      </div>
    </div>

    <!-- ─── 3. Bolsas ───────────────────────────── -->
    <div class="card">
      <div class="ch" style="justify-content:space-between">
        <div>
          <h3>3. Configuração de bolsas</h3>
          <p style="font-size:12px;color:var(--g4);margin-top:2px">Adicione uma linha por tipo de bolsa/carga horária</p>
        </div>
        <button class="btn bo" style="font-size:12px" onclick="AdminCadEdital.addBolsa()">+ Adicionar bolsa</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 130px 100px 120px 140px 36px;gap:8px;padding:8px 20px;border-bottom:1px solid var(--g3);background:var(--g1)">
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;letter-spacing:.05em">Tipo de bolsa</div>
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;letter-spacing:.05em">Segmento</div>
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;letter-spacing:.05em;text-align:center">CH/sem (h)</div>
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;letter-spacing:.05em;text-align:center">Valor campus (R$)</div>
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;letter-spacing:.05em;text-align:center">Valor outro órgão (R$)</div>
        <div></div>
      </div>
      <div id="bolsa-rows" style="padding:8px 20px;display:flex;flex-direction:column;gap:6px"></div>
    </div>

    <!-- ─── 4. Documentos ───────────────────────── -->
    <div class="card">
      <div class="ch" style="justify-content:space-between">
        <div>
          <h3>4. Documentos do edital</h3>
          <p style="font-size:12px;color:var(--g4);margin-top:2px">Faça upload direto para o Google Drive — ao menos um documento marcado como "Edital principal" é obrigatório para publicar</p>
        </div>
      </div>
      <div style="padding:20px 24px;display:flex;flex-direction:column;gap:14px" id="pdf-list"></div>
      <div style="padding:0 24px 20px">
        <button class="btn bo" style="font-size:12px" onclick="AdminCadEdital.addPdf()">+ Adicionar documento</button>
      </div>
    </div>

    <!-- ─── 5. Vigências das Ações ──────────────── -->
    <div class="card">
      <div class="ch" style="justify-content:space-between">
        <div>
          <h3>5. Vigência das Ações</h3>
          <p style="font-size:12px;color:var(--g4);margin-top:2px">Datas de início e término por segmento (dd/mm/AAAA)</p>
        </div>
        <button class="btn bo" style="font-size:12px" onclick="AdminCadEdital.addVig()">+ Adicionar vigência</button>
      </div>
      <div id="vig-list" style="padding:12px 20px;display:flex;flex-direction:column;gap:8px"></div>
    </div>

    <!-- ─── 6. Contatos por segmento ────────────── -->
    <div class="card" id="contatos-card" style="display:none">
      <div class="ch"><h3>6. Contatos por segmento</h3>
        <span style="font-size:11px;color:var(--g4)">E-mails para comunicações deste edital</span>
      </div>
      <div class="fg" id="contatos-body"></div>
    </div>

    <!-- ─── 7. Cronograma ───────────────────────── -->
    <div class="card">
      <div class="ch" style="justify-content:space-between">
        <div>
          <h3>7. Cronograma</h3>
          <p style="font-size:12px;color:var(--g4);margin-top:2px">Datas e responsáveis de cada fase do processo seletivo</p>
        </div>
        <button class="btn bo" style="font-size:12px" onclick="AdminCadEdital.addCrono()">+ Adicionar etapa</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 140px 12px 140px 1fr 72px;gap:6px;padding:8px 20px;border-bottom:1px solid var(--g3);background:var(--g1)">
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;letter-spacing:.06em">Etapa</div>
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;letter-spacing:.06em">Início</div>
        <div></div>
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;letter-spacing:.06em">Fim</div>
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;letter-spacing:.06em">Responsável</div>
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;letter-spacing:.06em">Ações</div>
      </div>
      <div id="crono-rows" style="padding:12px 20px;display:flex;flex-direction:column;gap:8px"></div>
    </div>

    <!-- ─── Footer ──────────────────────────────── -->
    <div class="fa" style="display:flex;gap:10px;align-items:center">
      <button class="btn bo" onclick="AdminRouter.ir('editais')">Cancelar</button>
      <div style="flex:1"></div>
      <button class="btn bo" onclick="AdminCadEdital.salvar('Rascunho')"
        title="Salva como rascunho — visível apenas para administradores">
        💾 Salvar rascunho
      </button>
      <button class="btn bp" onclick="AdminCadEdital.salvar('Publicado')"
        title="Valida todos os campos obrigatórios e torna visível para todos">
        🚀 Publicar edital
      </button>
    </div>`;

    // Inicializar seções dinâmicas
    this._initRecursos(dados.recursos);
    this._initBolsas(dados.bolsas);
    this._initPdf(dados.documentos);
    this._initVigs(dados.vigencias, dados.vigIni, dados.vigFim);
    this.renderCrono();
    if (dados.segmento) this.onSegChange(document.getElementById('f-segmento'));
  },

  // ── Helpers de máscara ────────────────────────────
  _maskData(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 8) v = v.substring(0, 8);
    if (v.length >= 5)      v = v.substring(0,2) + '/' + v.substring(2,4) + '/' + v.substring(4);
    else if (v.length >= 3) v = v.substring(0,2) + '/' + v.substring(2);
    input.value = v;
  },

  _isDataValida(s) { return /^\d{2}\/\d{2}\/\d{4}$/.test(s); },

  _dateMaior(a, b) {
    const [d1,m1,y1] = a.split('/').map(Number);
    const [d2,m2,y2] = b.split('/').map(Number);
    return new Date(y1,m1-1,d1) > new Date(y2,m2-1,d2);
  },

  _inputSty: 'height:36px;padding:0 10px;border:1.5px solid var(--g3);border-radius:7px;font-family:"Inter",sans-serif;font-size:13px;color:var(--tx);background:var(--wh);outline:none;box-sizing:border-box',

  // Converte dd/MM/yyyy → yyyy-MM-dd  (para valor do <input type="date">)
  _toInputDate(v) {
    if (!v) return '';
    const m = String(v).match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    if (/^\d{4}-\d{2}-\d{2}/.test(String(v))) return String(v).substring(0,10);
    return '';
  },

  // Converte yyyy-MM-dd → dd/MM/yyyy  (para armazenamento / exibição)
  _fromInputDate(v) {
    if (!v) return '';
    const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return v;
  },

  // ── 1.1 Tipo / Âmbito Outro ───────────────────────
  _onTipoChange() {
    const sel = document.getElementById('f-tipo');
    const inp = document.getElementById('f-tipo-outro');
    if (inp) inp.style.display = sel?.value === 'Outro' ? '' : 'none';
  },

  _onAmbitoChange() {
    const sel = document.getElementById('f-ambito');
    const inp = document.getElementById('f-ambito-outro');
    if (inp) inp.style.display = sel?.value === 'Outro' ? '' : 'none';
  },

  // ── 1.1 Segmento change ───────────────────────────
  onSegChange(sel) {
    const seg  = sel ? sel.value : '';
    const card = document.getElementById('contatos-card');
    const body = document.getElementById('contatos-body');
    if (!card || !body) return;
    if (!seg) { card.style.display = 'none'; return; }
    const segs = seg === 'Indissociável' ? ['Ensino','Pesquisa','Extensão','Indissociável'] : [seg];
    body.innerHTML = segs.map(s => `
      <div class="fl"><label>${s} — e-mail de contato</label>
        <input class="inp" id="contato-${s}" placeholder="email@riogrande.ifrs.edu.br"></div>
    `).join('');
    card.style.display = '';
  },

  // ── 1.2 Recursos financeiros ─────────────────────
  _initRecursos(recursosJson) {
    this._recursoRows = 0;
    document.getElementById('recurso-rows').innerHTML = '';
    let rows = [];
    if (recursosJson) { try { rows = JSON.parse(recursosJson); } catch(_) {} }
    if (Array.isArray(rows) && rows.length > 0) {
      rows.forEach(r => this.addRecurso(r));
    } else {
      this.addRecurso();
    }
  },

  addRecurso(prefill = {}) {
    const idx   = this._recursoRows++;
    const segs  = this.SEGS;
    const tbody = document.getElementById('recurso-rows');
    if (!tbody) return;
    const st = this._inputSty;
    const isOutro = prefill.tipo && !this.TIPOS_PROGRAMA.slice(0,-1).includes(prefill.tipo);
    const tipoVal = isOutro ? 'Outro' : (prefill.tipo || this.TIPOS_PROGRAMA[0]);
    const tipoLivreVal = isOutro ? (prefill.tipo || '') : '';

    const inp = (id, val, extra='') =>
      `<input id="${id}" type="number" min="0" step="0.01" placeholder="0" value="${val||''}"
        style="${st};text-align:right;width:100%" ${extra}>`;

    const tr = document.createElement('tr');
    tr.id = `rec-row-${idx}`;
    tr.innerHTML = `
      <td style="padding:6px 8px;vertical-align:top">
        <select id="rec-tipo-${idx}" onchange="AdminCadEdital._toggleRecTipoOutro(${idx})"
          style="${st};width:100%">
          ${this.TIPOS_PROGRAMA.map(t=>`<option${t===tipoVal?' selected':''}>${t}</option>`).join('')}
        </select>
        <input type="text" id="rec-tipo-livre-${idx}" value="${tipoLivreVal}" placeholder="Especifique..."
          style="${st};width:100%;margin-top:4px;${isOutro?'':'display:none'}">
      </td>
      <td style="padding:6px 8px">
        <select id="rec-seg-${idx}" style="${st};width:100%">
          ${segs.map(s=>`<option${s===(prefill.segmento||segs[0])?' selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td style="padding:6px 4px;background:#f0fdf4">${inp(`rec-cc-${idx}`, prefill.campusCusteio, `oninput="AdminCadEdital._calcRecTotal(${idx})"`)}</td>
      <td style="padding:6px 4px;background:#f0fdf4">${inp(`rec-cap-${idx}`,prefill.campusCapital, `oninput="AdminCadEdital._calcRecTotal(${idx})"`)}</td>
      <td style="padding:6px 4px;background:#dcfce7">
        <input id="rec-tot-${idx}" type="number" readonly value="${((+prefill.campusCusteio||0)+(+prefill.campusCapital||0)).toFixed(2)||''}"
          style="${st};text-align:right;width:100%;color:var(--green);font-weight:700;background:#dcfce7">
      </td>
      <td style="padding:6px 4px;background:#f0f9ff">${inp(`rec-oc-${idx}`, prefill.orgaoCusteio, `oninput="AdminCadEdital._calcRecOrgaoTotal(${idx})"`)}</td>
      <td style="padding:6px 4px;background:#f0f9ff">${inp(`rec-ocap-${idx}`,prefill.orgaoCapital, `oninput="AdminCadEdital._calcRecOrgaoTotal(${idx})"`)}</td>
      <td style="padding:6px 4px;background:#e0f2fe">
        <input id="rec-otot-${idx}" type="number" readonly value="${((+prefill.orgaoCusteio||0)+(+prefill.orgaoCapital||0)).toFixed(2)||''}"
          style="${st};text-align:right;width:100%;color:#0e4d6b;font-weight:700;background:#e0f2fe">
      </td>
      <td style="padding:6px 4px">
        <button onclick="AdminCadEdital.delRecurso(${idx})"
          style="width:32px;height:32px;border-radius:6px;border:1px solid #fca5a5;background:transparent;color:#ef4444;cursor:pointer;font-size:13px">✕</button>
      </td>`;
    tbody.appendChild(tr);
  },

  delRecurso(idx) { document.getElementById(`rec-row-${idx}`)?.remove(); },

  _calcRecTotal(idx) {
    const cc  = parseFloat(document.getElementById(`rec-cc-${idx}`)?.value  || '0') || 0;
    const cap = parseFloat(document.getElementById(`rec-cap-${idx}`)?.value || '0') || 0;
    const tot = document.getElementById(`rec-tot-${idx}`);
    if (tot) tot.value = (cc + cap).toFixed(2);
  },

  _calcRecOrgaoTotal(idx) {
    const oc  = parseFloat(document.getElementById(`rec-oc-${idx}`)?.value   || '0') || 0;
    const cap = parseFloat(document.getElementById(`rec-ocap-${idx}`)?.value || '0') || 0;
    const tot = document.getElementById(`rec-otot-${idx}`);
    if (tot) tot.value = (oc + cap).toFixed(2);
  },

  _toggleRecTipoOutro(idx) {
    const sel = document.getElementById(`rec-tipo-${idx}`);
    const inp = document.getElementById(`rec-tipo-livre-${idx}`);
    if (inp) inp.style.display = sel?.value === 'Outro' ? '' : 'none';
  },

  _coletarRecursos() {
    const recursos = [];
    document.querySelectorAll('[id^="rec-row-"]').forEach(row => {
      const idx   = row.id.replace('rec-row-','');
      const tipo  = document.getElementById(`rec-tipo-${idx}`)?.value  || '';
      const livre = (document.getElementById(`rec-tipo-livre-${idx}`)?.value || '').trim();
      const seg   = document.getElementById(`rec-seg-${idx}`)?.value   || '';
      const cc    = parseFloat(document.getElementById(`rec-cc-${idx}`)?.value    || '0') || 0;
      const cap   = parseFloat(document.getElementById(`rec-cap-${idx}`)?.value   || '0') || 0;
      const oc    = parseFloat(document.getElementById(`rec-oc-${idx}`)?.value    || '0') || 0;
      const ocap  = parseFloat(document.getElementById(`rec-ocap-${idx}`)?.value  || '0') || 0;
      if (cc < 0 || cap < 0 || oc < 0 || ocap < 0)
        throw new Error(`Valores de recurso não podem ser negativos (segmento ${seg}).`);
      recursos.push({ tipo: tipo === 'Outro' ? (livre || 'Outro') : tipo, segmento: seg, campusCusteio: cc, campusCapital: cap, orgaoCusteio: oc, orgaoCapital: ocap });
    });
    // Validar: apenas um recurso por segmento
    const usados = {};
    for (const r of recursos) {
      if (usados[r.segmento])
        throw new Error(`Segmento "${r.segmento}" aparece em mais de um recurso. Permitido apenas um por segmento.`);
      usados[r.segmento] = true;
    }
    return recursos;
  },

  // ── 1.3 Bolsas ───────────────────────────────────
  _initBolsas(bolsasJson) {
    this._bolsaRows = 0;
    document.getElementById('bolsa-rows').innerHTML = '';
    let rows = [];
    if (bolsasJson) { try { rows = JSON.parse(bolsasJson); } catch(_) {} }
    if (Array.isArray(rows) && rows.length > 0) {
      rows.forEach(b => this.addBolsa(b));
    } else {
      this.addBolsa();
    }
  },

  addBolsa(prefill = {}) {
    const idx  = this._bolsaRows++;
    const segs = this.SEGS;
    const st   = this._inputSty;
    const container = document.getElementById('bolsa-rows');
    if (!container) return;
    const isOutro  = prefill.tipo && !this.TIPOS_BOLSA.slice(0,-1).includes(prefill.tipo);
    const tipoVal  = isOutro ? 'Outro' : (prefill.tipo || this.TIPOS_BOLSA[0]);
    const div = document.createElement('div');
    div.id = `bolsa-row-${idx}`;
    div.style.cssText = 'background:var(--g1);border:1px solid var(--g3);border-radius:8px;padding:10px 12px';
    div.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 130px 100px 120px 140px 36px;gap:8px;align-items:start">
        <div>
          <select id="bolsa-tipo-${idx}" onchange="AdminCadEdital._toggleBolsaTipoOutro(${idx})"
            style="${st};width:100%">
            ${this.TIPOS_BOLSA.map(t=>`<option${t===tipoVal?' selected':''}>${t}</option>`).join('')}
          </select>
          <input type="text" id="bolsa-tipo-livre-${idx}" placeholder="Especifique o tipo..."
            value="${isOutro ? String(prefill.tipo||'').replace(/"/g,'&quot;') : ''}"
            style="${st};width:100%;margin-top:4px;${isOutro?'':'display:none'}">
        </div>
        <select id="bolsa-seg-${idx}" style="${st};width:100%">
          ${segs.map(s=>`<option${s===(prefill.segmento||segs[0])?' selected':''}>${s}</option>`).join('')}
        </select>
        <input id="bolsa-ch-${idx}" type="number" min="1" step="1" placeholder="20" value="${prefill.chSem||20}"
          style="${st};text-align:center;width:100%">
        <input id="bolsa-vc-${idx}" type="number" min="0" step="0.01" placeholder="700,00" value="${prefill.valorCampus||''}"
          style="${st};text-align:right;width:100%">
        <input id="bolsa-vo-${idx}" type="number" min="0" step="0.01" placeholder="0,00" value="${prefill.valorOrgao||''}"
          style="${st};text-align:right;width:100%">
        <button onclick="AdminCadEdital.delBolsa(${idx})"
          style="width:32px;height:32px;border-radius:6px;border:1px solid #fca5a5;background:transparent;color:#ef4444;cursor:pointer;font-size:13px;margin-top:2px">✕</button>
      </div>`;
    container.appendChild(div);
  },

  delBolsa(idx) { document.getElementById(`bolsa-row-${idx}`)?.remove(); },

  _toggleBolsaTipoOutro(idx) {
    const sel = document.getElementById(`bolsa-tipo-${idx}`);
    const inp = document.getElementById(`bolsa-tipo-livre-${idx}`);
    if (inp) inp.style.display = sel?.value === 'Outro' ? '' : 'none';
  },

  _coletarBolsas() {
    const bolsas = [];
    document.querySelectorAll('[id^="bolsa-row-"]').forEach(row => {
      const idx   = row.id.replace('bolsa-row-','');
      const tipo  = document.getElementById(`bolsa-tipo-${idx}`)?.value || '';
      const livre = (document.getElementById(`bolsa-tipo-livre-${idx}`)?.value || '').trim();
      const seg   = document.getElementById(`bolsa-seg-${idx}`)?.value || '';
      const ch    = parseFloat(document.getElementById(`bolsa-ch-${idx}`)?.value || '0') || 0;
      const vc    = parseFloat(document.getElementById(`bolsa-vc-${idx}`)?.value || '0') || 0;
      const vo    = parseFloat(document.getElementById(`bolsa-vo-${idx}`)?.value || '0') || 0;
      if (ch <= 0) throw new Error(`CH/sem deve ser maior que zero (${tipo||'bolsa'}).`);
      if (vc < 0 || vo < 0) throw new Error(`Valores de bolsa não podem ser negativos.`);
      bolsas.push({ tipo: tipo === 'Outro' ? (livre || 'Outro') : tipo, segmento: seg, chSem: ch, valorCampus: vc, valorOrgao: vo });
    });
    return bolsas;
  },

  // ── 1.4 Documentos com upload Google Drive ────────
  _initPdf(documentosJson) {
    this._pdfCnt  = 0;
    this._docsMeta = {};
    document.getElementById('pdf-list').innerHTML = '';
    let docs = [];
    if (documentosJson) { try { docs = JSON.parse(documentosJson); } catch(_) {} }
    if (Array.isArray(docs) && docs.length > 0) {
      docs.forEach(d => this.addPdf(d));
    } else {
      this.addPdf();
    }
  },

  addPdf(prefill = {}) {
    const idx  = this._pdfCnt++;
    const list = document.getElementById('pdf-list');
    if (!list) return;
    const st = this._inputSty;
    const esc = s => String(s||'').replace(/"/g,'&quot;');

    // Se já tem URL (editando), registrar metadados
    if (prefill.url) {
      this._docsMeta[idx] = {
        url: prefill.url, nome: prefill.nome || '', mimeType: prefill.mimeType || '', uploadedAt: prefill.uploadedAt || ''
      };
    }

    const temArquivo  = !!prefill.url;
    const isPrincipal = !!prefill.principal;

    // Decidir quando mostrar notificação (Retificações / Demais Publicações)
    const tipoAtual = prefill.tipo || 'Edital';
    const exibirNotif = tipoAtual === 'Retificações' || tipoAtual === 'Demais Publicações';

    const div = document.createElement('div');
    div.id = `pdf-${idx}`;
    div.style.cssText = 'border:1px solid var(--g3);border-radius:10px;padding:14px 16px;background:var(--g1)';
    div.innerHTML = `
      <div style="display:grid;grid-template-columns:160px 1fr 1fr auto;gap:10px;align-items:start">
        <!-- Tipo -->
        <div>
          <label style="font-size:11px;font-weight:600;color:var(--g5);text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:4px">Tipo</label>
          <select id="pdf-tipo-${idx}" style="${st};width:100%"
            onchange="AdminCadEdital._onDocTipoChange(${idx})">
            ${this.TIPOS_DOC.map(t=>`<option${t===tipoAtual?' selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <!-- Descrição -->
        <div>
          <label style="font-size:11px;font-weight:600;color:var(--g5);text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:4px">Descrição (opcional)</label>
          <input type="text" id="pdf-desc-${idx}" value="${esc(prefill.descricao||'')}" placeholder="Ex: Retificação 01"
            style="${st};width:100%">
        </div>
        <!-- Arquivo -->
        <div>
          <label style="font-size:11px;font-weight:600;color:var(--g5);text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:4px">Arquivo</label>
          <div style="display:flex;gap:6px;align-items:center">
            <input type="file" id="pdf-file-${idx}" accept=".pdf,.doc,.docx,.xls,.xlsx,.odt,.zip"
              style="font-size:12px;flex:1;${temArquivo ? 'display:none;' : ''}">
            <button onclick="AdminCadEdital._uploadArquivo(${idx})"
              id="pdf-upload-btn-${idx}"
              style="${st};padding:0 12px;background:#0e7490;color:#fff;border-color:#0e7490;cursor:pointer;white-space:nowrap;font-size:12px;${temArquivo ? 'display:none;' : ''}">
              ⬆ Enviar
            </button>
          </div>
          <div id="pdf-status-${idx}" style="margin-top:6px;font-size:12px;color:var(--g5)">
            ${temArquivo
              ? `✓ <a href="${esc(prefill.url||'')}" target="_blank" rel="noopener noreferrer" style="color:#0e7490">${esc(prefill.nome||'Arquivo enviado')}</a>
                 <button onclick="AdminCadEdital._trocarArquivo(${idx})" style="margin-left:8px;font-size:11px;color:var(--g4);background:none;border:none;cursor:pointer;text-decoration:underline">Trocar</button>`
              : '<span style="color:var(--g4)">Nenhum arquivo enviado</span>'}
          </div>
        </div>
        <!-- Remover -->
        <div style="padding-top:20px">
          <button onclick="AdminCadEdital.remPdf(${idx})"
            style="width:32px;height:32px;border-radius:6px;border:1px solid #fca5a5;background:transparent;color:#ef4444;cursor:pointer;font-size:13px">✕</button>
        </div>
      </div>
      <!-- Linha 2: Edital principal + notificação -->
      <div style="display:flex;align-items:center;gap:16px;margin-top:10px;padding-top:10px;border-top:1px solid var(--g3)">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;user-select:none">
          <input type="radio" name="pdf-principal" id="pdf-principal-${idx}" ${isPrincipal?' checked':''}>
          <span style="font-weight:600;color:var(--green)">⭐ Edital principal</span>
          <span style="font-size:11px;color:var(--g4)">(obrigatório para publicar)</span>
        </label>
        <div id="pdf-notif-wrap-${idx}" style="display:${exibirNotif?'flex':'none'};align-items:flex-start;gap:6px;flex-direction:column">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;user-select:none">
            <input type="checkbox" id="pdf-notif-${idx}" onchange="AdminCadEdital._onDocNotifChange(${idx})">
            <span>Notificar participantes por e-mail</span>
          </label>
          <div id="pdf-notif-sched-${idx}" style="display:none;margin-left:20px;padding:8px 12px;background:#fffbeb;border:1px solid #fde68a;border-radius:7px;width:calc(100% - 20px)">
            <div style="font-size:11px;font-weight:600;color:var(--g5);margin-bottom:6px">⏰ Quando enviar?</div>
            <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
              <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px;user-select:none">
                <input type="radio" name="pdf-notif-modo-${idx}" value="agora" checked
                  onchange="document.getElementById('pdf-notif-dt-${idx}').style.display='none'">
                Ao salvar
              </label>
              <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px;user-select:none">
                <input type="radio" name="pdf-notif-modo-${idx}" value="agendar"
                  onchange="document.getElementById('pdf-notif-dt-${idx}').style.display='flex'">
                Agendar para:
              </label>
              <div id="pdf-notif-dt-${idx}" style="display:none;gap:6px;align-items:center">
                <input type="date" id="pdf-notif-data-${idx}"
                  style="height:28px;padding:0 7px;border:1.5px solid var(--g3);border-radius:7px;font-family:'Inter',sans-serif;font-size:12px;color:var(--tx)">
                <input type="time" id="pdf-notif-hora-${idx}" value="08:00"
                  style="height:28px;padding:0 7px;border:1.5px solid var(--g3);border-radius:7px;font-family:'Inter',sans-serif;font-size:12px;color:var(--tx)">
              </div>
            </div>
          </div>
        </div>
      </div>`;
    list.appendChild(div);
  },

  _onDocTipoChange(idx) {
    const sel   = document.getElementById(`pdf-tipo-${idx}`);
    const wrap  = document.getElementById(`pdf-notif-wrap-${idx}`);
    if (wrap) wrap.style.display = (sel?.value === 'Retificações' || sel?.value === 'Demais Publicações') ? 'flex' : 'none';
  },

  _onDocNotifChange(idx) {
    const cb    = document.getElementById(`pdf-notif-${idx}`);
    const sched = document.getElementById(`pdf-notif-sched-${idx}`);
    if (sched) sched.style.display = cb?.checked ? '' : 'none';
  },

  remPdf(idx) { document.getElementById(`pdf-${idx}`)?.remove(); },

  _trocarArquivo(idx) {
    delete this._docsMeta[idx];
    const status = document.getElementById(`pdf-status-${idx}`);
    const fileInput = document.getElementById(`pdf-file-${idx}`);
    const btn = document.getElementById(`pdf-upload-btn-${idx}`);
    if (status)    status.innerHTML = '<span style="color:var(--g4)">Nenhum arquivo enviado</span>';
    if (fileInput) { fileInput.style.display = ''; fileInput.value = ''; }
    if (btn)       btn.style.display = '';
  },

  async _uploadArquivo(idx) {
    const fileInput = document.getElementById(`pdf-file-${idx}`);
    if (!fileInput || !fileInput.files[0]) { toast('⚠ Selecione um arquivo primeiro.'); return; }
    const file = fileInput.files[0];
    if (file.size > 20 * 1024 * 1024) { toast('⚠ Arquivo muito grande. Máximo: 20 MB.'); return; }

    const numero = val('f-numero') || 'rascunho';
    const ano    = val('f-ano')    || String(new Date().getFullYear());

    const btn    = document.getElementById(`pdf-upload-btn-${idx}`);
    const status = document.getElementById(`pdf-status-${idx}`);
    if (btn)    { btn.disabled = true; btn.textContent = '⏳ Enviando...'; }
    if (status) status.innerHTML = '<span style="color:var(--g4)">Enviando arquivo...</span>';

    const reader = new FileReader();
    reader.onload = async ev => {
      const base64 = ev.target.result.split(',')[1];
      try {
        const res = await API.uploadDocumento({
          conteudo:     base64,
          nomeArquivo:  file.name,
          mimeType:     file.type || 'application/octet-stream',
          editalNumero: numero,
          editalAno:    ano
        });
        this._docsMeta[idx] = { url: res.url, nome: res.nome, mimeType: res.mimeType, uploadedAt: res.uploadedAt };
        if (status) status.innerHTML = `✓ <a href="${res.url}" target="_blank" rel="noopener noreferrer" style="color:#0e7490">${res.nome}</a>
          <button onclick="AdminCadEdital._trocarArquivo(${idx})" style="margin-left:8px;font-size:11px;color:var(--g4);background:none;border:none;cursor:pointer;text-decoration:underline">Trocar</button>`;
        if (fileInput) fileInput.style.display = 'none';
        if (btn)       btn.style.display = 'none';
        toast('✓ Arquivo enviado para o Google Drive!');
      } catch(err) {
        if (btn)    { btn.disabled = false; btn.textContent = '⬆ Enviar'; }
        if (status) status.innerHTML = '<span style="color:#ef4444">❌ Erro no upload: ' + err.message + '</span>';
        toast('❌ ' + err.message);
      }
    };
    reader.onerror = () => toast('❌ Erro ao ler o arquivo.');
    reader.readAsDataURL(file);
  },

  _coletarDocs() {
    const docs = [];
    let temPrincipal = false;
    document.querySelectorAll('[id^="pdf-"]').forEach(div => {
      if (!/^pdf-\d+$/.test(div.id)) return;
      const idx   = div.id.replace('pdf-','');
      const meta  = AdminCadEdital._docsMeta[idx];
      if (!meta || !meta.url) return; // ignora rows sem upload
      const tipo      = (document.getElementById(`pdf-tipo-${idx}`)?.value  || '').trim();
      const desc      = (document.getElementById(`pdf-desc-${idx}`)?.value  || '').trim();
      const princ     = document.getElementById(`pdf-principal-${idx}`)?.checked || false;
      const notif     = document.getElementById(`pdf-notif-${idx}`)?.checked || false;
      const notifModo = document.querySelector(`input[name="pdf-notif-modo-${idx}"]:checked`)?.value || 'agora';
      const notifData = (document.getElementById(`pdf-notif-data-${idx}`)?.value || '').trim();
      const notifHora = (document.getElementById(`pdf-notif-hora-${idx}`)?.value || '08:00').trim();
      let agendarEm = '';
      if (notif && notifModo === 'agendar' && notifData) {
        const mn = notifData.match(/^(\d{4})-(\d{2})-(\d{2})/);
        agendarEm = mn ? `${mn[3]}/${mn[2]}/${mn[1]} ${notifHora}` : '';
      }
      if (princ) temPrincipal = true;
      docs.push({ tipo, descricao: desc, principal: princ, notificar: notif, agendarEm, ...meta });
    });
    return { docs, temPrincipal };
  },

  // ── 1.5 Vigências dinâmicas ────────────────────────
  _initVigs(vigenciasJson, vigIni, vigFim) {
    this._vigRows = 0;
    document.getElementById('vig-list').innerHTML = '';
    let vigs = [];
    if (vigenciasJson) { try { vigs = JSON.parse(vigenciasJson); } catch(_) {} }
    if (Array.isArray(vigs) && vigs.length > 0) {
      vigs.forEach(v => this.addVig(v));
    } else if (vigIni || vigFim) {
      // Compatibilidade com o formato antigo
      this.addVig({ segmento: 'Pesquisa', ini: vigIni || '', fim: vigFim || '' });
    } else {
      this.addVig();
    }
  },

  addVig(prefill = {}) {
    const idx = this._vigRows++;
    const st  = this._inputSty;
    const container = document.getElementById('vig-list');
    if (!container) return;
    const esc = s => String(s||'').replace(/"/g,'&quot;');
    const div = document.createElement('div');
    div.id = `vig-row-${idx}`;
    div.innerHTML = `
      <div style="display:grid;grid-template-columns:160px 1fr 20px 1fr 36px;gap:8px;align-items:center;
        background:var(--wh);border:1px solid var(--g3);border-radius:8px;padding:10px 14px">
        <select id="vig-seg-${idx}" style="${st};width:100%">
          ${this.SEGS.map(s=>`<option${s===(prefill.segmento||'Pesquisa')?' selected':''}>${s}</option>`).join('')}
        </select>
        <input type="date" id="vig-ini-${idx}" value="${AdminCadEdital._toInputDate(prefill.ini||'')}"
          style="${st};width:100%">
        <span style="text-align:center;color:var(--g4);font-size:12px;font-weight:600">→</span>
        <input type="date" id="vig-fim-${idx}" value="${AdminCadEdital._toInputDate(prefill.fim||'')}"
          style="${st};width:100%">
        <button onclick="AdminCadEdital.delVig(${idx})"
          style="width:32px;height:32px;border-radius:6px;border:1px solid #fca5a5;background:transparent;color:#ef4444;cursor:pointer;font-size:13px">✕</button>
      </div>`;
    container.appendChild(div);
  },

  delVig(idx) { document.getElementById(`vig-row-${idx}`)?.remove(); },

  _coletarVigs() {
    const vigs = [];
    document.querySelectorAll('[id^="vig-row-"]').forEach(row => {
      const idx = row.id.replace('vig-row-','');
      const seg = document.getElementById(`vig-seg-${idx}`)?.value || '';
      const iniRaw = (document.getElementById(`vig-ini-${idx}`)?.value || '').trim(); // yyyy-MM-dd
      const fimRaw = (document.getElementById(`vig-fim-${idx}`)?.value || '').trim(); // yyyy-MM-dd
      if (!seg) return;
      if (iniRaw && fimRaw && iniRaw > fimRaw)
        throw new Error(`Data de início maior que término em ${seg}.`);
      // Armazenar no formato dd/MM/yyyy
      vigs.push({ segmento: seg, ini: this._fromInputDate(iniRaw), fim: this._fromInputDate(fimRaw) });
    });
    return vigs;
  },

  // ── 1.6 Cronograma ───────────────────────────────
  renderCrono() {
    const container = document.getElementById('crono-rows');
    if (!container) return;
    container.innerHTML = '';
    const st = this._inputSty;
    this._cronoEtapas.forEach((e, idx) => {
      const isOutroResp = e.resp === 'Outro';
      const opts = this.RESPS.map(r => `<option${r === e.resp ? ' selected' : ''}>${r}</option>`).join('');
      const div  = document.createElement('div');
      div.id = `crono-${idx}`;
      div.style.cssText = 'background:var(--wh);border:1px solid var(--g3);border-radius:8px;padding:8px 10px';
      const etapaEsc = String(e.etapa||'').replace(/"/g,'&quot;').replace(/</g,'&lt;');
      div.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 140px 12px 140px 1fr 72px;gap:6px;align-items:start">
          <input type="text" value="${etapaEsc}" placeholder="Nome da etapa"
            style="${st};width:100%" oninput="AdminCadEdital._cronoEtapas[${idx}].etapa=this.value">
          <input type="date" id="crono-ini-${idx}" value="${AdminCadEdital._toInputDate(e.dataIni||'')}"
            style="${st};width:100%"
            onchange="AdminCadEdital._cronoEtapas[${idx}].dataIni=AdminCadEdital._fromInputDate(this.value)">
          <span style="font-size:11px;color:var(--g4);text-align:center;padding-top:10px">→</span>
          <input type="date" id="crono-fim-${idx}" value="${AdminCadEdital._toInputDate(e.dataFim||'')}"
            style="${st};width:100%"
            onchange="AdminCadEdital._cronoEtapas[${idx}].dataFim=AdminCadEdital._fromInputDate(this.value)">
          <div>
            <select style="${st};width:100%" onchange="AdminCadEdital._onCronoRespChange(${idx},this.value)">${opts}</select>
            <input type="text" id="crono-resp-outro-${idx}" value="${String(e.respOutro||'').replace(/"/g,'&quot;')}"
              placeholder="Especifique o responsável..."
              style="${st};width:100%;margin-top:4px;${isOutroResp ? '' : 'display:none'}"
              oninput="AdminCadEdital._cronoEtapas[${idx}].respOutro=this.value">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;align-items:center;padding-top:2px">
            <button onclick="AdminCadEdital._toggleNotifCrono(${idx})" title="Enviar notificação para esta etapa"
              style="width:32px;height:32px;border-radius:6px;border:1.5px solid #f4b61d;background:transparent;color:#d97706;cursor:pointer;font-size:14px">🔔</button>
            <button onclick="AdminCadEdital.delCrono(${idx})"
              style="width:32px;height:32px;border-radius:6px;border:1px solid #fca5a5;background:transparent;color:#ef4444;cursor:pointer;font-size:13px">✕</button>
          </div>
        </div>
        <!-- Painel de notificação da etapa -->
        <div id="crono-notif-${idx}" style="display:none;margin-top:8px;padding:12px 14px;background:#fffbeb;border:1.5px solid #fde68a;border-radius:8px">
          <div style="font-size:12px;font-weight:600;color:#92400e;margin-bottom:10px">🔔 Notificação — ${etapaEsc}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
            <div>
              <label style="font-size:11px;font-weight:600;color:var(--g5);display:block;margin-bottom:3px">Assunto</label>
              <input type="text" id="crono-notif-assunto-${idx}"
                value="SOA/IFRS — ${etapaEsc}"
                style="${st};width:100%">
            </div>
            <div>
              <label style="font-size:11px;font-weight:600;color:var(--g5);display:block;margin-bottom:3px">
                E-mails extras <span style="font-weight:400;color:var(--g4)">(vírgula, opcional)</span>
              </label>
              <input type="text" id="crono-notif-dest-${idx}" placeholder="extra1@ifrs.edu.br, extra2@ifrs.edu.br"
                style="${st};width:100%">
            </div>
          </div>
          <label style="font-size:11px;font-weight:600;color:var(--g5);display:block;margin-bottom:3px">Mensagem</label>
          <textarea id="crono-notif-msg-${idx}" rows="3"
            placeholder="Mensagem personalizada (deixe em branco para usar o padrão)..."
            style="width:100%;padding:8px 10px;border:1.5px solid var(--g3);border-radius:7px;font-family:'Inter',sans-serif;font-size:12px;color:var(--tx);box-sizing:border-box;resize:vertical"></textarea>
          <!-- Agendamento da etapa -->
          <div style="margin-top:8px;padding:8px 12px;background:#fff;border:1px solid #fde68a;border-radius:7px">
            <div style="font-size:11px;font-weight:600;color:var(--g5);margin-bottom:6px">⏰ Quando enviar?</div>
            <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
              <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px;user-select:none">
                <input type="radio" name="crono-modo-${idx}" value="agora" checked
                  onchange="document.getElementById('crono-sched-${idx}').style.display='none'">
                Enviar agora
              </label>
              <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px;user-select:none">
                <input type="radio" name="crono-modo-${idx}" value="agendar"
                  onchange="document.getElementById('crono-sched-${idx}').style.display='flex'">
                Agendar para:
              </label>
              <div id="crono-sched-${idx}" style="display:none;gap:6px;align-items:center">
                <input type="date" id="crono-sched-data-${idx}"
                  style="height:30px;padding:0 8px;border:1.5px solid var(--g3);border-radius:7px;font-family:'Inter',sans-serif;font-size:12px;color:var(--tx)">
                <input type="time" id="crono-sched-hora-${idx}" value="08:00"
                  style="height:30px;padding:0 8px;border:1.5px solid var(--g3);border-radius:7px;font-family:'Inter',sans-serif;font-size:12px;color:var(--tx)">
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
            <button onclick="AdminCadEdital._toggleNotifCrono(${idx})"
              style="height:30px;padding:0 14px;border-radius:6px;border:1px solid var(--g3);background:transparent;cursor:pointer;font-size:12px">Cancelar</button>
            <button onclick="AdminCadEdital._despacharNotifCrono(${idx})"
              style="height:30px;padding:0 14px;border-radius:6px;border:none;background:#f59e0b;color:#1c1917;cursor:pointer;font-size:12px;font-weight:600">✉ Enviar / Agendar</button>
          </div>
        </div>`;
      container.appendChild(div);
    });
  },

  _onCronoRespChange(idx, val2) {
    this._cronoEtapas[idx].resp = val2;
    const inp = document.getElementById(`crono-resp-outro-${idx}`);
    if (inp) inp.style.display = val2 === 'Outro' ? '' : 'none';
  },

  addCrono() {
    this._cronoEtapas.push({ etapa:'', dataIni:'', dataFim:'', resp:'Coordenador(a) do Projeto', respOutro:'' });
    this.renderCrono();
    const rows = document.querySelectorAll('#crono-rows > div');
    if (rows.length) rows[rows.length-1].querySelector('input[type=text]')?.focus();
  },

  delCrono(idx) {
    if (this._cronoEtapas.length <= 1) return;
    this._cronoEtapas.splice(idx, 1);
    this.renderCrono();
  },

  _toggleNotifCrono(idx) {
    const panel = document.getElementById(`crono-notif-${idx}`);
    if (!panel) return;
    panel.style.display = panel.style.display === 'none' ? '' : 'none';
  },

  async _enviarNotifCrono(idx) {
    const assunto = (document.getElementById(`crono-notif-assunto-${idx}`)?.value || '').trim();
    const msg     = (document.getElementById(`crono-notif-msg-${idx}`)?.value     || '').trim();
    const destStr = (document.getElementById(`crono-notif-dest-${idx}`)?.value    || '').trim();
    if (!assunto) { toast('⚠ Preencha o assunto da notificação.'); return; }

    const titulo  = val('f-titulo') || 'Edital';
    const etapa   = this._cronoEtapas[idx]?.etapa || '';
    const msgFinal = msg || `Prezado(a),\n\nInformamos que a etapa "${etapa}" está prevista no cronograma do edital:\n\n${titulo}\n\nAcesse o SOA para mais informações.\n\nAtenciosamente,\nSecretaria Acadêmica — IFRS Campus Rio Grande`;

    const extras = destStr ? destStr.split(',').map(s => s.trim()).filter(Boolean) : [];

    try {
      toast('⏳ Enviando notificação...');
      const res = await API.enviarNotificacao({
        editalId:      this._editId || '',
        assunto,
        mensagem:      msgFinal,
        destinatarios: extras.length > 0 ? extras : undefined
      });
      toast(`✉ Notificação enviada! (${res.enviados || 0} destinatário(s))`);
      this._toggleNotifCrono(idx);
    } catch(e) { toast('❌ ' + e.message); }
  },

  async _despacharNotifCrono(idx) {
    const modoEl = document.querySelector(`input[name="crono-modo-${idx}"]:checked`);
    const modo   = modoEl ? modoEl.value : 'agora';
    if (modo === 'agendar') {
      await AdminCadEdital._agendarNotifCrono(idx);
    } else {
      await AdminCadEdital._enviarNotifCrono(idx);
    }
  },

  async _agendarNotifCrono(idx) {
    const assunto  = (document.getElementById(`crono-notif-assunto-${idx}`)?.value || '').trim();
    const msg      = (document.getElementById(`crono-notif-msg-${idx}`)?.value     || '').trim();
    const destStr  = (document.getElementById(`crono-notif-dest-${idx}`)?.value    || '').trim();
    const dataRaw  = (document.getElementById(`crono-sched-data-${idx}`)?.value    || '').trim();
    const horaVal  = (document.getElementById(`crono-sched-hora-${idx}`)?.value    || '08:00').trim();

    if (!assunto)  { toast('⚠ Preencha o assunto da notificação.'); return; }
    if (!dataRaw)  { toast('⚠ Selecione a data para agendamento.'); return; }

    const m = dataRaw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const dataBR       = m ? `${m[3]}/${m[2]}/${m[1]}` : dataRaw;
    const agendadoPara = `${dataBR} ${horaVal}`;

    const titulo  = val('f-titulo') || 'Edital';
    const etapa   = this._cronoEtapas[idx]?.etapa || '';
    const msgFinal = msg || `Prezado(a),\n\nInformamos que a etapa "${etapa}" está prevista no cronograma do edital:\n\n${titulo}\n\nAcesse o SOA para mais informações.\n\nAtenciosamente,\nSecretaria Acadêmica — IFRS Campus Rio Grande`;
    const extras   = destStr ? destStr.split(',').map(s => s.trim()).filter(Boolean) : [];

    try {
      toast('⏳ Agendando notificação...');
      await API.agendarNotificacao({
        editalId:      this._editId || '',
        assunto,
        mensagem:      msgFinal,
        agendadoPara,
        destinatarios: extras.length > 0 ? extras : undefined
      });
      toast(`⏰ Notificação agendada para ${agendadoPara}!`);
      this._toggleNotifCrono(idx);
    } catch(e) { toast('❌ ' + e.message); }
  },

  // ── Salvar ────────────────────────────────────────
  async salvar(forcarStatus) {
    const numero = val('f-numero');
    const titulo = val('f-titulo');
    const status = forcarStatus || val('f-status');

    if (!numero || !titulo) { toast('⚠ Preencha Número e Título antes de salvar.'); return; }

    // Coletar recursos
    let recursos;
    try { recursos = this._coletarRecursos(); }
    catch(e) { toast('⚠ Recursos: ' + e.message); return; }

    // Coletar bolsas
    let bolsas;
    try { bolsas = this._coletarBolsas(); }
    catch(e) { toast('⚠ Bolsas: ' + e.message); return; }

    // Coletar vigências
    let vigencias;
    try { vigencias = this._coletarVigs(); }
    catch(e) { toast('⚠ Vigências: ' + e.message); return; }

    // Coletar documentos
    let docs = [], temPrincipal = false;
    try {
      const r = this._coletarDocs();
      docs         = r.docs;
      temPrincipal = r.temPrincipal;
    } catch(e) { toast('⚠ Documentos: ' + e.message); return; }

    // Validações adicionais para Publicar
    if (status === 'Publicado') {
      if (!val('f-segmento')) { toast('⚠ Para publicar, selecione o Segmento.'); return; }
      if (!val('f-tipo'))     { toast('⚠ Para publicar, selecione o Tipo de edital.'); return; }
      if (!val('f-ambito'))   { toast('⚠ Para publicar, selecione o Âmbito.'); return; }
      if (!temPrincipal)      { toast('⚠ Para publicar, marque ao menos um documento como "Edital principal".'); return; }
    }

    // Resolver tipo/âmbito "Outro"
    const tipoSel   = val('f-tipo');
    const ambitoSel = val('f-ambito');
    const tipoFinal   = tipoSel   === 'Outro' ? (val('f-tipo-outro')   || 'Outro') : tipoSel;
    const ambitoFinal = ambitoSel === 'Outro' ? (val('f-ambito-outro') || 'Outro') : ambitoSel;

    const dados = {
      id:         this._editId,
      updated_at: this._updatedAt,
      numero,
      titulo,
      segmento:   val('f-segmento'),
      tipo:       tipoFinal,
      ambito:     ambitoFinal,
      status,
      descricao:  val('f-descricao'),
      documentos: JSON.stringify(docs),
      recursos:   JSON.stringify(recursos),
      bolsas:     JSON.stringify(bolsas),
      vigencias:  JSON.stringify(vigencias),
      cronograma: JSON.stringify(this._cronoEtapas),
      // Backward compat: vigência geral = primeira vigência
      vigIni: vigencias[0]?.ini || '',
      vigFim: vigencias[0]?.fim || '',
      bolsaValor: bolsas[0]?.valorCampus || '',
      bolsaCH:    bolsas[0]?.chSem       || '',
      vagas:      ''
    };

    toast('⏳ Salvando...');
    try {
      const res = await API.salvarEdital(dados);

      // Enviar / agendar notificações para docs que precisam
      const docsNotif = docs.filter(d => d.notificar);
      for (const doc of docsNotif) {
        try {
          const edId    = res.id || this._editId;
          const payload = {
            editalId: edId,
            assunto:  `SOA/IFRS — ${doc.tipo} publicado(a): ${titulo}`,
            mensagem: `Prezado(a),\n\nUm(a) novo(a) ${doc.tipo} foi publicado(a) para o edital:\n\n${titulo}\n\nAcesse o SOA para visualizar.\n\nAtenciosamente,\nSecretaria Acadêmica — IFRS Campus Rio Grande`
          };
          if (doc.agendarEm) {
            await API.agendarNotificacao({ ...payload, agendadoPara: doc.agendarEm });
          } else {
            await API.enviarNotificacao(payload);
          }
        } catch(_) {}
      }

      toast(status === 'Rascunho' ? '💾 Edital salvo como rascunho!' : '🚀 Edital publicado com sucesso!');
      await AdminEditais._recarregar();
      AdminRouter.ir('editais');
    } catch(e) { toast('❌ ' + e.message); }
  },

  // ── Exportar PDF individual ───────────────────────
  exportarPdf(id) {
    const e = (SOA.editais || []).find(x => x.id === id);
    if (!e) { toast('⚠ Edital não encontrado.'); return; }
    const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const w   = window.open('','_blank');
    if (!w) { toast('⚠ Permita pop-ups para exportar PDF.'); return; }

    let vigsHtml = '—', bolsasHtml = '—', recursosHtml = '—', docsHtml = '—', cronoHtml = '';
    try {
      const vigs = JSON.parse(e.vigencias || '[]');
      if (vigs.length) vigsHtml = vigs.map(v=>`${esc(v.segmento)}: ${esc(v.ini)} → ${esc(v.fim)}`).join('<br>');
    } catch(_) {}
    try {
      const bolsas = JSON.parse(e.bolsas || '[]');
      if (bolsas.length) bolsasHtml = `<table style="width:100%;border-collapse:collapse;font-size:11px">
        <tr style="background:#00843D;color:#fff"><th>Tipo</th><th>Segmento</th><th>CH/sem</th><th>Valor Campus</th><th>Valor Órgão</th></tr>
        ${bolsas.map(b=>`<tr><td>${esc(b.tipo)}</td><td>${esc(b.segmento)}</td><td>${b.chSem}h</td><td>R$ ${b.valorCampus}</td><td>R$ ${b.valorOrgao}</td></tr>`).join('')}
      </table>`;
    } catch(_) {}
    try {
      const rec = JSON.parse(e.recursos || '[]');
      if (rec.length) recursosHtml = `<table style="width:100%;border-collapse:collapse;font-size:11px">
        <tr style="background:#00843D;color:#fff"><th>Programa</th><th>Segmento</th><th>Campus Custeio</th><th>Campus Capital</th><th>Órgão Custeio</th><th>Órgão Capital</th></tr>
        ${rec.map(r=>`<tr><td>${esc(r.tipo)}</td><td>${esc(r.segmento)}</td><td>R$ ${r.campusCusteio}</td><td>R$ ${r.campusCapital}</td><td>R$ ${r.orgaoCusteio}</td><td>R$ ${r.orgaoCapital}</td></tr>`).join('')}
      </table>`;
    } catch(_) {}
    try {
      const docs = JSON.parse(e.documentos || '[]');
      if (docs.length) docsHtml = docs.map(d=>
        `<div>📎 <strong>${esc(d.tipo)}</strong>${d.principal?' ⭐':''} — ${esc(d.descricao||'')} — <a href="${esc(d.url||'')}">${esc(d.nome||d.url||'')}</a></div>`
      ).join('');
    } catch(_) {}
    try {
      const crono = JSON.parse(e.cronograma || '[]');
      if (crono.length) cronoHtml = `<h3 style="color:#00843D">Cronograma</h3><table style="width:100%;border-collapse:collapse;font-size:11px">
        <tr style="background:#00843D;color:#fff"><th>Etapa</th><th>Início</th><th>Fim</th><th>Responsável</th></tr>
        ${crono.map(c=>`<tr><td>${esc(c.etapa)}</td><td>${esc(c.dataIni)}</td><td>${esc(c.dataFim)}</td><td>${esc(c.resp==='Outro'&&c.respOutro?c.respOutro:c.resp)}</td></tr>`).join('')}
      </table>`;
    } catch(_) {}

    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${esc(e.titulo)} — SOA IFRS</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;font-size:12px;color:#1a1a1a}
        h1{color:#00843D;font-size:18px;margin:0 0 4px}
        h2{color:#00843D;font-size:13px;border-bottom:2px solid #00843D;padding-bottom:4px;margin-top:20px}
        h3{color:#00843D;font-size:12px;margin-top:16px}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        th,td{padding:5px 8px;border:1px solid #ddd;text-align:left}
        th{background:#00843D;color:#fff}
        tr:nth-child(even)td{background:#f8f9fa}
        .meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:12px}
        .meta-item{background:#f0fdf4;padding:8px;border-radius:6px}
        .meta-label{font-size:10px;font-weight:700;text-transform:uppercase;color:#6b7280}
        .meta-value{font-size:13px;font-weight:600;margin-top:2px}
        .hdr-bar{background:#00843D;color:#fff;padding:6px 12px;margin:-24px -24px 16px;font-size:11px}
        @media print{body{padding:12px}}
      </style>
    </head><body>
      <div class="hdr-bar">SOA — IFRS Campus Rio Grande · ${new Date().toLocaleDateString('pt-BR')}</div>
      <h1>${esc(e.titulo)}</h1>
      <div style="font-size:11px;color:#6b7280;margin-bottom:12px">ID: ${esc(e.id)} · Criado por: ${esc(e.criadoPor)} · ${esc(e.criadoEm)}</div>
      <div class="meta">
        <div class="meta-item"><div class="meta-label">Número</div><div class="meta-value">${esc(e.numero)}</div></div>
        <div class="meta-item"><div class="meta-label">Tipo</div><div class="meta-value">${esc(e.tipo)}</div></div>
        <div class="meta-item"><div class="meta-label">Âmbito</div><div class="meta-value">${esc(e.ambito||'—')}</div></div>
        <div class="meta-item"><div class="meta-label">Segmento</div><div class="meta-value">${esc(e.segmento)}</div></div>
        <div class="meta-item"><div class="meta-label">Status</div><div class="meta-value">${esc(e.status)}</div></div>
        <div class="meta-item"><div class="meta-label">Vigência geral</div><div class="meta-value">${esc(e.vigIni)||'—'} → ${esc(e.vigFim)||'—'}</div></div>
      </div>
      ${e.descricao ? `<h2>Descrição</h2><p style="line-height:1.6">${esc(e.descricao)}</p>` : ''}
      <h2>Vigências das Ações</h2><div>${vigsHtml}</div>
      <h2>Recursos Financeiros</h2>${recursosHtml}
      <h2>Configuração de Bolsas</h2>${bolsasHtml}
      <h2>Documentos</h2>${docsHtml}
      ${cronoHtml}
    </body></html>`);
    w.document.close();
    w.print();
  }
};
