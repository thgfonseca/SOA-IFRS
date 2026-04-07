// pages/admin/projetos.js

// ══════════════════════════════════════════════════════════════════
// AdminProjetos — Listagem e cadastro de Ações / Projetos
// ══════════════════════════════════════════════════════════════════
const AdminProjetos = {

  // ── Dados de referência ───────────────────────────
  CAPES_AREAS: {
    'Ciências Exatas e da Terra':     ['Matemática','Probabilidade e Estatística','Ciência da Computação','Astronomia','Física','Química','Geociências','Oceanografia'],
    'Ciências Biológicas':            ['Biologia Geral','Genética','Botânica','Zoologia','Ecologia','Morfologia','Fisiologia','Bioquímica','Biofísica','Farmacologia','Imunologia','Microbiologia','Parasitologia'],
    'Engenharias':                    ['Engenharia Civil','Engenharia Sanitária','Engenharia Elétrica','Engenharia Mecânica','Engenharia Química','Engenharia de Materiais e Metalúrgica','Engenharia Naval e Oceânica','Engenharia Aeroespacial','Engenharia Nuclear','Engenharia de Transportes','Engenharia de Produção','Engenharia Biomédica'],
    'Ciências da Saúde':              ['Medicina','Odontologia','Farmácia','Enfermagem','Nutrição','Saúde Coletiva','Fonoaudiologia','Fisioterapia e Terapia Ocupacional','Educação Física'],
    'Ciências Agrárias':              ['Agronomia','Recursos Florestais e Engenharia Florestal','Engenharia Agrícola','Zootecnia','Medicina Veterinária','Recursos Pesqueiros e Engenharia de Pesca','Ciência e Tecnologia de Alimentos'],
    'Ciências Sociais Aplicadas':     ['Direito','Administração','Economia','Arquitetura e Urbanismo','Planejamento Urbano e Regional','Serviço Social','Ciência da Informação','Museologia','Comunicação','Ciências Contábeis','Turismo','Demografia'],
    'Ciências Humanas':               ['Filosofia','Sociologia','Ciência Política','História','Geografia','Psicologia','Educação','Ciência da Religião e Teologia','Arqueologia','Antropologia'],
    'Linguística, Letras e Artes':    ['Linguística','Letras','Artes'],
    'Multidisciplinar':               ['Interdisciplinar','Ensino','Biotecnologia','Ciências Ambientais','Materiais']
  },

  ODS_LIST: [
    '1 — Erradicação da Pobreza',
    '2 — Fome Zero e Agricultura Sustentável',
    '3 — Saúde e Bem-Estar',
    '4 — Educação de Qualidade',
    '5 — Igualdade de Gênero',
    '6 — Água Potável e Saneamento',
    '7 — Energia Limpa e Acessível',
    '8 — Trabalho Decente e Crescimento Econômico',
    '9 — Indústria, Inovação e Infraestrutura',
    '10 — Redução das Desigualdades',
    '11 — Cidades e Comunidades Sustentáveis',
    '12 — Consumo e Produção Responsáveis',
    '13 — Ação Contra a Mudança Global do Clima',
    '14 — Vida na Água',
    '15 — Vida Terrestre',
    '16 — Paz, Justiça e Instituições Eficazes',
    '17 — Parcerias e Meios de Implementação'
  ],

  TIPOS_ACAO: ['Projeto','Programa','Evento','Curso','Oficina','Serviço'],
  STATS:      ['Ativo','Pendente','Encerrado'],

  // Contadores de linhas dinâmicas
  _recursoItemCusteio: 0,
  _recursoItemCapital: 0,
  _bolsaRows:          0,
  _docsMeta:           {},

  // ── Listagem ─────────────────────────────────────
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
        `<div class="tm">${AdminProjetos._esc(p.titulo)}</div>`,
        `<span style="font-size:12px">${AdminProjetos._esc(p.editalId||'—')}</span>`,
        segBadge(p.segmento),
        `<div class="tm">${AdminProjetos._esc(p.coordNome||'—')}</div><div class="ts">${AdminProjetos._esc(p.coordEmail||'')}</div>`,
        statusBadge(p.status),
        `<div class="acts">
          <button class="ab" onclick="AdminProjetos.editar('${p.id}')">Editar</button>
          <button class="ab dg" onclick="AdminProjetos.excluir('${p.id}','${AdminProjetos._esc(p.titulo)}')">Excluir</button>
        </div>`
      ]);
      html += `<div class="card">${buildTable(
        ['Título','Edital','Segmento','Coordenador','Status','Ações'], rows
      )}</div>`;
    }
    app.innerHTML = html;
  },

  // ── Formulário ────────────────────────────────────
  form(app, dados = {}) {
    const esc = s => String(s || '').replace(/"/g, '&quot;');
    this._recursoItemCusteio = 0;
    this._recursoItemCapital = 0;
    this._bolsaRows          = 0;
    this._docsMeta           = {};

    const optsEditais = SOA.editais
      .filter(e => !e.deleted_at || e.deleted_at === '')
      .map(e => `<option value="${esc(e.id)}"${dados.editalId === e.id ? ' selected' : ''}>${esc(e.numero)} — ${esc(e.titulo)}</option>`)
      .join('');

    // Grande área e sub-área CAPES
    const grandeAreaAtual = dados.areaCapes || '';
    const subAreaAtual    = dados.subAreaCapes || '';

    const optsGrandeArea = Object.keys(this.CAPES_AREAS)
      .map(a => `<option${a === grandeAreaAtual ? ' selected' : ''}>${esc(a)}</option>`).join('');

    // ODS selecionadas
    let odsAtivas = [];
    if (dados.ods) { try { odsAtivas = JSON.parse(dados.ods); } catch(_) {} }

    const st = 'height:36px;padding:0 10px;border:1.5px solid var(--g3);border-radius:7px;font-family:"Inter",sans-serif;font-size:13px;color:var(--tx);background:var(--wh);outline:none;box-sizing:border-box';

    app.innerHTML = `
    <div class="ph">
      <div>
        <h1>${dados.id ? 'Editar' : 'Nova'} Ação</h1>
        <p>${dados.id ? `Editando: <strong>${esc(dados.titulo || '')}</strong>` : 'Preencha os dados da nova ação/projeto'}</p>
      </div>
      <div class="phr"><button class="btn bo" onclick="AdminRouter.ir('projetos')">← Cancelar</button></div>
    </div>

    <!-- ─── 1. Dados gerais ─────────────────────── -->
    <div class="card">
      <div class="ch"><h3>1. Dados gerais</h3></div>
      <div class="fg">
        <div class="fl s2">
          <label>Edital vinculado <span style="color:#ef4444">*</span></label>
          <select class="inp" id="p-edital" onchange="AdminProjetos._onEditalChange(this.value)">
            <option value="">Selecione o edital...</option>${optsEditais}
          </select>
        </div>
        <div class="fl s2">
          <label>Título da ação <span style="color:#ef4444">*</span></label>
          <input class="inp" id="p-titulo" value="${esc(dados.titulo || '')}" placeholder="Título completo do projeto/ação">
        </div>
        <div class="fl">
          <label>Tipo de ação <span style="color:#ef4444">*</span></label>
          <select class="inp" id="p-tipo">${selectOpts(this.TIPOS_ACAO, dados.tipoProjeto || 'Projeto')}</select>
        </div>
        <div class="fl">
          <label>Segmento <span style="color:#ef4444">*</span></label>
          <select class="inp" id="p-segmento">${selectOpts(['Pesquisa','Ensino','Extensão','Indissociável'], dados.segmento || '')}</select>
        </div>
        <div class="fl">
          <label>E-mail do coordenador <span style="color:#ef4444">*</span></label>
          <input class="inp" id="p-coordEmail" value="${esc(dados.coordEmail || '')}" placeholder="coord@riogrande.ifrs.edu.br">
        </div>
        <div class="fl">
          <label>Nome do coordenador <span style="color:#ef4444">*</span></label>
          <input class="inp" id="p-coordNome" value="${esc(dados.coordNome || '')}" placeholder="Nome completo">
        </div>
        <div class="fl">
          <label>Status</label>
          <select class="inp" id="p-status">${selectOpts(this.STATS, dados.status || 'Ativo')}</select>
        </div>
      </div>
    </div>

    <!-- ─── 2. Área CAPES ───────────────────────── -->
    <div class="card">
      <div class="ch"><h3>2. Área do Conhecimento (CAPES/CNPq)</h3></div>
      <div class="fg">
        <div class="fl s2">
          <label>Grande área</label>
          <select class="inp" id="p-grande-area" onchange="AdminProjetos._onGrandeAreaChange(this.value)">
            <option value="">Selecione a grande área...</option>${optsGrandeArea}
          </select>
        </div>
        <div class="fl s2">
          <label>Sub-área</label>
          <select class="inp" id="p-sub-area">
            <option value="">Selecione a grande área primeiro...</option>
          </select>
        </div>
      </div>
    </div>

    <!-- ─── 3. ODS ──────────────────────────────── -->
    <div class="card">
      <div class="ch">
        <div>
          <h3>3. Objetivos de Desenvolvimento Sustentável (ODS)</h3>
          <p style="font-size:12px;color:var(--g4);margin-top:2px">Selecione as ODS relacionadas a esta ação</p>
        </div>
      </div>
      <div style="padding:16px 24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px" id="ods-grid">
        ${this.ODS_LIST.map((ods, i) => `
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:6px 10px;border:1.5px solid var(--g3);border-radius:8px;font-size:12px;user-select:none;${odsAtivas.includes(ods) ? 'background:#f0fdf4;border-color:#86efac;' : ''}">
            <input type="checkbox" name="ods" value="${esc(ods)}" ${odsAtivas.includes(ods) ? 'checked' : ''}
              onchange="this.closest('label').style.background=this.checked?'#f0fdf4':'';this.closest('label').style.borderColor=this.checked?'#86efac':'var(--g3)'">
            <span style="font-weight:600;color:var(--green);min-width:20px">${i + 1}</span>
            <span>${esc(ods.replace(/^\d+ — /, ''))}</span>
          </label>`).join('')}
      </div>
    </div>

    <!-- ─── 4. Recurso financeiro ────────────────── -->
    <div class="card">
      <div class="ch">
        <div>
          <h3>4. Recurso financeiro</h3>
          <p style="font-size:12px;color:var(--g4);margin-top:2px">Selecione o programa e detalhe os itens de custeio e capital</p>
        </div>
      </div>
      <div style="padding:16px 24px">
        <div class="fg" style="margin-bottom:16px">
          <div class="fl">
            <label>Programa / Fonte</label>
            <select class="inp" id="p-recurso-tipo" style="width:100%">
              <option value="">Selecione...</option>
            </select>
          </div>
          <div class="fl">
            <label>Total custeio (R$)</label>
            <input type="number" class="inp" id="p-custeio-total" min="0" step="0.01" placeholder="0,00"
              value="${esc(dados.custeioTotal || '')}"
              style="text-align:right"
              oninput="AdminProjetos._recalcTotais()">
          </div>
          <div class="fl">
            <label>Total capital (R$)</label>
            <input type="number" class="inp" id="p-capital-total" min="0" step="0.01" placeholder="0,00"
              value="${esc(dados.capitalTotal || '')}"
              style="text-align:right"
              oninput="AdminProjetos._recalcTotais()">
          </div>
          <div class="fl">
            <label>Total geral (auto)</label>
            <input type="number" class="inp" id="p-total-geral" readonly placeholder="0,00"
              style="text-align:right;font-weight:700;color:var(--green);background:var(--g1)">
          </div>
        </div>

        <!-- Itens de Custeio -->
        <div style="margin-bottom:16px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <div style="font-size:12px;font-weight:600;color:#166534;text-transform:uppercase;letter-spacing:.04em">Itens de custeio</div>
            <button class="btn bo" style="font-size:11px;height:28px" onclick="AdminProjetos.addItemCusteio()">+ Item</button>
          </div>
          <div style="display:grid;grid-template-columns:1fr 140px 32px;gap:6px;padding:6px 0;border-bottom:1px solid var(--g3);margin-bottom:6px">
            <div style="font-size:10px;font-weight:600;color:var(--g4);text-transform:uppercase">Descrição do item</div>
            <div style="font-size:10px;font-weight:600;color:var(--g4);text-transform:uppercase;text-align:right">Valor (R$)</div>
            <div></div>
          </div>
          <div id="custeio-rows"></div>
        </div>

        <!-- Itens de Capital -->
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <div style="font-size:12px;font-weight:600;color:#0e4d6b;text-transform:uppercase;letter-spacing:.04em">Itens de capital</div>
            <button class="btn bo" style="font-size:11px;height:28px" onclick="AdminProjetos.addItemCapital()">+ Item</button>
          </div>
          <div style="display:grid;grid-template-columns:1fr 140px 32px;gap:6px;padding:6px 0;border-bottom:1px solid var(--g3);margin-bottom:6px">
            <div style="font-size:10px;font-weight:600;color:var(--g4);text-transform:uppercase">Descrição do item</div>
            <div style="font-size:10px;font-weight:600;color:var(--g4);text-transform:uppercase;text-align:right">Valor (R$)</div>
            <div></div>
          </div>
          <div id="capital-rows"></div>
        </div>
      </div>
    </div>

    <!-- ─── 5. Bolsas ───────────────────────────── -->
    <div class="card">
      <div class="ch" style="justify-content:space-between">
        <div>
          <h3>5. Bolsas solicitadas</h3>
          <p style="font-size:12px;color:var(--g4);margin-top:2px">Conforme tipos disponíveis no edital selecionado</p>
        </div>
        <button class="btn bo" style="font-size:12px" onclick="AdminProjetos.addBolsa()">+ Adicionar bolsa</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 130px 120px 36px;gap:8px;padding:8px 20px;border-bottom:1px solid var(--g3);background:var(--g1)">
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase">Tipo de bolsa</div>
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;text-align:center">Quantidade</div>
        <div style="font-size:11px;font-weight:600;color:var(--g4);text-transform:uppercase;text-align:center">CH/semana (h)</div>
        <div></div>
      </div>
      <div id="bolsa-proj-rows" style="padding:8px 20px;display:flex;flex-direction:column;gap:6px"></div>
    </div>

    <!-- ─── 6. Documento do projeto ─────────────── -->
    <div class="card">
      <div class="ch">
        <div>
          <h3>6. Documento do projeto</h3>
          <p style="font-size:12px;color:var(--g4);margin-top:2px">Envie o projeto completo em PDF (máx. 20 MB)</p>
        </div>
      </div>
      <div style="padding:16px 24px">
        <div id="proj-doc-status" style="margin-bottom:12px;font-size:13px;color:var(--g5)">
          ${dados.documentoUrl
            ? `✓ <a href="${esc(dados.documentoUrl)}" target="_blank" rel="noopener noreferrer" style="color:#0e7490">${esc(dados.documentoNome || 'Arquivo enviado')}</a>
               <button onclick="AdminProjetos._trocarDocumento()" style="margin-left:8px;font-size:11px;color:var(--g4);background:none;border:none;cursor:pointer;text-decoration:underline">Trocar</button>`
            : '<span style="color:var(--g4)">Nenhum arquivo enviado</span>'}
        </div>
        <div id="proj-doc-input" style="${dados.documentoUrl ? 'display:none' : ''}display:flex;gap:8px;align-items:center">
          <input type="file" id="p-pdf" accept=".pdf" style="font-size:12px;flex:1">
          <button id="p-pdf-btn" onclick="AdminProjetos._uploadDocumento()"
            style="height:36px;padding:0 16px;border-radius:8px;border:none;background:#0e7490;color:#fff;cursor:pointer;font-size:12px;white-space:nowrap">
            ⬆ Enviar PDF
          </button>
        </div>
      </div>
    </div>

    <!-- ─── 7. Resumo e objetivos ────────────────── -->
    <div class="card">
      <div class="ch"><h3>7. Resumo e objetivos</h3></div>
      <div style="padding:0 24px 24px">
        <div class="fg">
          <div class="fl s2">
            <label>Resumo</label>
            <textarea class="inp" id="p-resumo" rows="4"
              placeholder="Descreva o contexto, justificativa e objetivos do projeto...">${esc(dados.resumo || '')}</textarea>
          </div>
          <div class="fl s2">
            <label>Metodologia</label>
            <textarea class="inp" id="p-metodologia" rows="4"
              placeholder="Descreva a metodologia e etapas previstas...">${esc(dados.metodologia || '')}</textarea>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Footer ──────────────────────────────── -->
    <div class="fa" style="display:flex;gap:10px;align-items:center">
      <button class="btn bo" onclick="AdminRouter.ir('projetos')">Cancelar</button>
      <div style="flex:1"></div>
      <button class="btn bp" onclick="AdminProjetos.salvar('${esc(dados.id || '')}')">💾 Salvar ação</button>
    </div>`;

    // Inicializar seções dinâmicas
    this._onGrandeAreaChange(grandeAreaAtual, subAreaAtual);
    if (dados.editalId) this._onEditalChange(dados.editalId, dados);
    this._initItens(dados);
    this._initBolsas(dados.bolsas);
    this._recalcTotais();
    if (dados.documentoUrl) {
      this._docsMeta = { url: dados.documentoUrl, nome: dados.documentoNome || '', mimeType: 'application/pdf', uploadedAt: '' };
    }
  },

  // ── Área CAPES ────────────────────────────────────
  _onGrandeAreaChange(grandeArea, subAreaPresel = '') {
    const sel = document.getElementById('p-sub-area');
    if (!sel) return;
    const subareas = this.CAPES_AREAS[grandeArea] || [];
    if (subareas.length === 0) {
      sel.innerHTML = '<option value="">Selecione a grande área primeiro...</option>';
    } else {
      sel.innerHTML = '<option value="">Selecione a sub-área...</option>' +
        subareas.map(s => `<option${s === subAreaPresel ? ' selected' : ''}>${s}</option>`).join('');
    }
  },

  // ── Edital selecionado → popula recursos e bolsas ─
  _onEditalChange(editalId, dadosPresel = {}) {
    const edital = (SOA.editais || []).find(e => e.id === editalId);

    // Recursos do edital
    const selRecurso = document.getElementById('p-recurso-tipo');
    if (selRecurso) {
      let tiposRec = [];
      if (edital && edital.recursos) {
        try { tiposRec = JSON.parse(edital.recursos).map(r => r.tipo).filter(Boolean); } catch(_) {}
      }
      if (tiposRec.length === 0) tiposRec = ['PAIEX','AIPTCI','PAIEN','Outro'];
      const recAtual = dadosPresel.recurso || '';
      selRecurso.innerHTML = '<option value="">Selecione...</option>' +
        tiposRec.map(t => `<option${t === recAtual ? ' selected' : ''}>${t}</option>`).join('');
    }

    // Salva tipos de bolsa disponíveis para usar no addBolsa
    this._bolsasTipos = [];
    if (edital && edital.bolsas) {
      try { this._bolsasTipos = JSON.parse(edital.bolsas).map(b => b.tipo).filter(Boolean); } catch(_) {}
    }
    if (this._bolsasTipos.length === 0) {
      this._bolsasTipos = ['PIBEX','BICT — Iniciação Científica','BIDTI — Iniciação ao DTI e Inovação','BAT — Apoio Técnico','BET — Ensino Técnico','BES — Educação Superior','Outro'];
    }
  },

  _bolsasTipos: [],

  // ── Itens de custeio / capital ────────────────────
  _initItens(dados) {
    this._recursoItemCusteio = 0;
    this._recursoItemCapital = 0;
    document.getElementById('custeio-rows').innerHTML = '';
    document.getElementById('capital-rows').innerHTML = '';

    let itensCusteio = [], itensCapital = [];
    if (dados.itensCusteio) { try { itensCusteio = JSON.parse(dados.itensCusteio); } catch(_) {} }
    if (dados.itensCapital) { try { itensCapital = JSON.parse(dados.itensCapital); } catch(_) {} }

    if (itensCusteio.length > 0) itensCusteio.forEach(it => this.addItemCusteio(it));
    else this.addItemCusteio();

    if (itensCapital.length > 0) itensCapital.forEach(it => this.addItemCapital(it));
    else this.addItemCapital();
  },

  addItemCusteio(prefill = {}) {
    const idx = this._recursoItemCusteio++;
    const st  = 'height:34px;padding:0 10px;border:1.5px solid var(--g3);border-radius:7px;font-family:"Inter",sans-serif;font-size:13px;color:var(--tx);background:#f0fdf4;outline:none;box-sizing:border-box';
    const row = document.createElement('div');
    row.id = `custeio-${idx}`;
    row.style.cssText = 'display:grid;grid-template-columns:1fr 140px 32px;gap:6px;margin-bottom:6px;align-items:center';
    row.innerHTML = `
      <input type="text" id="custeio-desc-${idx}" placeholder="Ex: Material de consumo para laboratório"
        value="${String(prefill.descricao || '').replace(/"/g, '&quot;')}"
        style="${st};width:100%;background:var(--wh)">
      <input type="number" id="custeio-val-${idx}" min="0" step="0.01" placeholder="0,00"
        value="${prefill.valor || ''}"
        style="${st};text-align:right"
        oninput="AdminProjetos._somarItensCusteio()">
      <button onclick="AdminProjetos._delItem('custeio-${idx}')"
        style="width:30px;height:30px;border-radius:6px;border:1px solid #fca5a5;background:transparent;color:#ef4444;cursor:pointer;font-size:12px">✕</button>`;
    document.getElementById('custeio-rows').appendChild(row);
  },

  addItemCapital(prefill = {}) {
    const idx = this._recursoItemCapital++;
    const st  = 'height:34px;padding:0 10px;border:1.5px solid var(--g3);border-radius:7px;font-family:"Inter",sans-serif;font-size:13px;color:var(--tx);outline:none;box-sizing:border-box';
    const row = document.createElement('div');
    row.id = `capital-${idx}`;
    row.style.cssText = 'display:grid;grid-template-columns:1fr 140px 32px;gap:6px;margin-bottom:6px;align-items:center';
    row.innerHTML = `
      <input type="text" id="capital-desc-${idx}" placeholder="Ex: Equipamento de medição"
        value="${String(prefill.descricao || '').replace(/"/g, '&quot;')}"
        style="${st};width:100%">
      <input type="number" id="capital-val-${idx}" min="0" step="0.01" placeholder="0,00"
        value="${prefill.valor || ''}"
        style="${st};text-align:right"
        oninput="AdminProjetos._somarItensCapital()">
      <button onclick="AdminProjetos._delItem('capital-${idx}')"
        style="width:30px;height:30px;border-radius:6px;border:1px solid #fca5a5;background:transparent;color:#ef4444;cursor:pointer;font-size:12px">✕</button>`;
    document.getElementById('capital-rows').appendChild(row);
  },

  _delItem(id) { document.getElementById(id)?.remove(); this._recalcTotais(); },

  _somarItensCusteio() {
    let soma = 0;
    document.querySelectorAll('[id^="custeio-val-"]').forEach(inp => soma += parseFloat(inp.value || '0') || 0);
    const tot = document.getElementById('p-custeio-total');
    if (tot) tot.value = soma.toFixed(2);
    this._recalcTotais();
  },

  _somarItensCapital() {
    let soma = 0;
    document.querySelectorAll('[id^="capital-val-"]').forEach(inp => soma += parseFloat(inp.value || '0') || 0);
    const tot = document.getElementById('p-capital-total');
    if (tot) tot.value = soma.toFixed(2);
    this._recalcTotais();
  },

  _recalcTotais() {
    const c = parseFloat(document.getElementById('p-custeio-total')?.value || '0') || 0;
    const k = parseFloat(document.getElementById('p-capital-total')?.value || '0') || 0;
    const t = document.getElementById('p-total-geral');
    if (t) t.value = (c + k).toFixed(2);
  },

  // ── Bolsas ────────────────────────────────────────
  _initBolsas(bolsasJson) {
    this._bolsaRows = 0;
    document.getElementById('bolsa-proj-rows').innerHTML = '';
    let rows = [];
    if (bolsasJson) { try { rows = JSON.parse(bolsasJson); } catch(_) {} }
    if (rows.length > 0) rows.forEach(b => this.addBolsa(b));
    else this.addBolsa();
  },

  addBolsa(prefill = {}) {
    const idx   = this._bolsaRows++;
    const tipos = this._bolsasTipos.length > 0 ? this._bolsasTipos
      : ['PIBEX','BICT — Iniciação Científica','BIDTI — Iniciação ao DTI e Inovação','BAT — Apoio Técnico','BET — Ensino Técnico','BES — Educação Superior','Outro'];
    const st = 'height:36px;padding:0 10px;border:1.5px solid var(--g3);border-radius:7px;font-family:"Inter",sans-serif;font-size:13px;color:var(--tx);background:var(--wh);outline:none;box-sizing:border-box';
    const container = document.getElementById('bolsa-proj-rows');
    if (!container) return;
    const div = document.createElement('div');
    div.id = `bolsa-proj-${idx}`;
    div.style.cssText = 'display:grid;grid-template-columns:1fr 130px 120px 36px;gap:8px;align-items:center';
    div.innerHTML = `
      <select id="bproj-tipo-${idx}" style="${st};width:100%">
        ${tipos.map(t => `<option${t === (prefill.tipo || tipos[0]) ? ' selected' : ''}>${t}</option>`).join('')}
      </select>
      <input type="number" id="bproj-qtd-${idx}" min="1" step="1" placeholder="1" value="${prefill.quantidade || 1}"
        style="${st};text-align:center;width:100%">
      <input type="number" id="bproj-ch-${idx}" min="1" step="1" placeholder="20" value="${prefill.chSem || 20}"
        style="${st};text-align:center;width:100%">
      <button onclick="AdminProjetos._delBolsa(${idx})"
        style="width:32px;height:32px;border-radius:6px;border:1px solid #fca5a5;background:transparent;color:#ef4444;cursor:pointer;font-size:13px">✕</button>`;
    container.appendChild(div);
  },

  _delBolsa(idx) { document.getElementById(`bolsa-proj-${idx}`)?.remove(); },

  // ── Upload documento ──────────────────────────────
  _docsMeta: {},

  async _uploadDocumento() {
    const fileInput = document.getElementById('p-pdf');
    if (!fileInput || !fileInput.files[0]) { toast('⚠ Selecione um arquivo PDF.'); return; }
    const file = fileInput.files[0];
    if (file.size > 20 * 1024 * 1024) { toast('⚠ Arquivo muito grande. Máx: 20 MB.'); return; }

    const editalId = val('p-edital');
    const edital   = (SOA.editais || []).find(e => e.id === editalId);
    const numero   = edital ? edital.numero : 'projeto';
    const ano      = edital ? (edital.criadoEm || '').substring(6, 10) || String(new Date().getFullYear()) : String(new Date().getFullYear());

    const btn    = document.getElementById('p-pdf-btn');
    const status = document.getElementById('proj-doc-status');
    if (btn)    { btn.disabled = true; btn.textContent = '⏳ Enviando...'; }
    if (status) status.innerHTML = '<span style="color:var(--g4)">Enviando arquivo...</span>';

    const reader = new FileReader();
    reader.onload = async ev => {
      const base64 = ev.target.result.split(',')[1];
      try {
        const res = await API.uploadDocumento({
          conteudo:     base64,
          nomeArquivo:  file.name,
          mimeType:     file.type || 'application/pdf',
          editalNumero: numero,
          editalAno:    ano
        });
        this._docsMeta = { url: res.url, nome: res.nome, mimeType: res.mimeType, uploadedAt: res.uploadedAt };
        if (status) status.innerHTML = `✓ <a href="${res.url}" target="_blank" rel="noopener noreferrer" style="color:#0e7490">${res.nome}</a>
          <button onclick="AdminProjetos._trocarDocumento()" style="margin-left:8px;font-size:11px;color:var(--g4);background:none;border:none;cursor:pointer;text-decoration:underline">Trocar</button>`;
        const inp = document.getElementById('proj-doc-input');
        if (inp) inp.style.display = 'none';
        toast('✓ Arquivo enviado!');
      } catch(err) {
        if (btn)    { btn.disabled = false; btn.textContent = '⬆ Enviar PDF'; }
        if (status) status.innerHTML = `<span style="color:#ef4444">❌ Erro: ${err.message}</span>`;
        toast('❌ ' + err.message);
      }
    };
    reader.onerror = () => toast('❌ Erro ao ler o arquivo.');
    reader.readAsDataURL(file);
  },

  _trocarDocumento() {
    this._docsMeta = {};
    const inp    = document.getElementById('proj-doc-input');
    const status = document.getElementById('proj-doc-status');
    const btn    = document.getElementById('p-pdf-btn');
    const fi     = document.getElementById('p-pdf');
    if (inp)    inp.style.display = '';
    if (status) status.innerHTML = '<span style="color:var(--g4)">Nenhum arquivo enviado</span>';
    if (fi)     fi.value = '';
    if (btn)    { btn.disabled = false; btn.textContent = '⬆ Enviar PDF'; }
  },

  // ── Coletar dados do form ─────────────────────────
  _coletarForm(id) {
    // ODS
    const odsChecked = Array.from(document.querySelectorAll('input[name="ods"]:checked')).map(cb => cb.value);

    // Itens custeio
    const itensCusteio = [];
    document.querySelectorAll('[id^="custeio-"][id$="-0"],[id^="custeio-"]').forEach(() => {});
    document.querySelectorAll('[id^="custeio-val-"]').forEach(inp => {
      const idx  = inp.id.replace('custeio-val-', '');
      const desc = (document.getElementById(`custeio-desc-${idx}`)?.value || '').trim();
      const val_ = parseFloat(inp.value || '0') || 0;
      if (desc || val_) itensCusteio.push({ descricao: desc, valor: val_ });
    });

    // Itens capital
    const itensCapital = [];
    document.querySelectorAll('[id^="capital-val-"]').forEach(inp => {
      const idx  = inp.id.replace('capital-val-', '');
      const desc = (document.getElementById(`capital-desc-${idx}`)?.value || '').trim();
      const val_ = parseFloat(inp.value || '0') || 0;
      if (desc || val_) itensCapital.push({ descricao: desc, valor: val_ });
    });

    // Bolsas
    const bolsas = [];
    document.querySelectorAll('[id^="bolsa-proj-"]').forEach(div => {
      const idx = div.id.replace('bolsa-proj-', '');
      const tipo = document.getElementById(`bproj-tipo-${idx}`)?.value || '';
      const qtd  = parseInt(document.getElementById(`bproj-qtd-${idx}`)?.value || '1') || 1;
      const ch   = parseInt(document.getElementById(`bproj-ch-${idx}`)?.value  || '20') || 20;
      if (tipo) bolsas.push({ tipo, quantidade: qtd, chSem: ch });
    });

    return {
      id:            id || null,
      editalId:      val('p-edital'),
      titulo:        val('p-titulo'),
      tipoProjeto:   val('p-tipo'),
      segmento:      val('p-segmento'),
      coordEmail:    val('p-coordEmail'),
      coordNome:     val('p-coordNome'),
      status:        val('p-status'),
      areaCapes:     (document.getElementById('p-grande-area')?.value || '').trim(),
      subAreaCapes:  (document.getElementById('p-sub-area')?.value    || '').trim(),
      ods:           JSON.stringify(odsChecked),
      recurso:       (document.getElementById('p-recurso-tipo')?.value || '').trim(),
      custeioTotal:  parseFloat(document.getElementById('p-custeio-total')?.value || '0') || 0,
      capitalTotal:  parseFloat(document.getElementById('p-capital-total')?.value || '0') || 0,
      itensCusteio:  JSON.stringify(itensCusteio),
      itensCapital:  JSON.stringify(itensCapital),
      bolsas:        JSON.stringify(bolsas),
      documentoUrl:  this._docsMeta.url  || '',
      documentoNome: this._docsMeta.nome || '',
      resumo:        val('p-resumo'),
      metodologia:   val('p-metodologia')
    };
  },

  // ── Salvar ────────────────────────────────────────
  async salvar(id) {
    const dados = this._coletarForm(id);
    if (!dados.titulo || !dados.editalId) { toast('⚠ Preencha edital e título.'); return; }
    if (!dados.coordEmail)                { toast('⚠ Informe o e-mail do coordenador.'); return; }
    toast('⏳ Salvando...');
    try {
      const res = await API.salvarProjeto(dados);
      if (id) {
        const idx = SOA.projetos.findIndex(p => p.id === id);
        if (idx >= 0) SOA.projetos[idx] = { ...SOA.projetos[idx], ...dados };
      } else {
        SOA.projetos.push({ ...dados, id: res.id });
      }
      toast('✓ Ação salva!');
      AdminRouter.ir('projetos');
    } catch(e) { toast('❌ ' + e.message); }
  },

  editar(id) {
    const p = SOA.projetos.find(x => x.id === id);
    if (p) this.form(document.getElementById('app'), p);
  },

  excluir(id, titulo) {
    Modal.confirm(
      'Excluir ação', `Deseja excluir <strong>${titulo}</strong>?`,
      async () => {
        try {
          await API.excluirProjeto(id);
          SOA.projetos = SOA.projetos.filter(p => p.id !== id);
          toast('✓ Ação excluída.');
          AdminRouter.ir('projetos');
        } catch(e) { toast('❌ ' + e.message); }
      }
    );
  },

  _esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
};
