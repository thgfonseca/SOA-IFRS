// pages/aluno/projetos.js — Lista de projetos de um edital (visão aluno)

const AlunoProjetosEdital = {

  _edital:   null,
  _projetos: [],

  _esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
                          .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },
  _parseJSON(v) { try { return v ? JSON.parse(v) : null; } catch(e) { return null; } },

  // ── Entrada principal ────────────────────────────
  render(body, editalId) {
    const edital = SOA.editais.find(e => e.id === editalId);
    if (!edital) {
      body.innerHTML = `<div class="ph"><div><h1>Edital não encontrado</h1></div></div>`;
      return;
    }
    this._edital   = edital;
    this._projetos = SOA.projetos.filter(p =>
      p.editalId === editalId && p.status !== 'Encerrado'
    );

    const total = this._projetos.length;
    const fmtData = v => {
      if (!v) return '';
      const s = String(v).trim();
      if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) return s.substring(0,10);
      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
    };

    body.innerHTML = `
    <!-- Cabeçalho do edital -->
    <div class="ph">
      <div>
        <h1>Projetos disponíveis</h1>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:4px">
          ${segBadge(edital.segmento)}
          <span style="font-size:14px;color:var(--g5)">${this._esc(edital.titulo)}</span>
        </div>
      </div>
      <div class="phr">
        <button class="btn bo" onclick="AlunoRouter.ir('editais')">← Voltar aos editais</button>
      </div>
    </div>

    <!-- Resumo do edital -->
    <div class="card" style="padding:16px 20px;margin-bottom:4px">
      <div style="display:flex;flex-wrap:wrap;gap:20px;font-size:13px;color:var(--g5)">
        <span>📅 Inscrições: <b>${fmtData(edital.vigIni)} – ${fmtData(edital.vigFim)}</b></span>
        ${edital.bolsaValor ? `<span>💰 Bolsa: <b>R$ ${this._esc(edital.bolsaValor)}/mês</b></span>` : ''}
        ${edital.bolsaCH    ? `<span>⏱ Carga horária: <b>${this._esc(edital.bolsaCH)}h/sem</b></span>` : ''}
        ${edital.vagas      ? `<span>🎓 Vagas: <b>${this._esc(edital.vagas)}</b></span>` : ''}
        <span>📁 <b>${total}</b> projeto(s) disponível(is)</span>
      </div>
    </div>

    <!-- Busca (visível a partir de 5 projetos) -->
    ${total >= 5 ? `
    <div style="margin:12px 0">
      <input class="inp" id="proj-busca"
        placeholder="🔍 Buscar por título ou coordenador..."
        oninput="AlunoProjetosEdital._filtrar(this.value)"
        style="max-width:480px">
    </div>` : ''}

    <!-- Lista de projetos -->
    <div id="proj-lista">
      ${this._renderLista(this._projetos)}
    </div>`;
  },

  // ── Renderiza lista ──────────────────────────────
  _renderLista(lista) {
    if (!lista.length)
      return `<div class="card">${emptyState('📁', 'Nenhum projeto encontrado.')}</div>`;
    return lista.map((p, i) => this._cardProjeto(p, i)).join('');
  },

  _cardProjeto(p, idx) {
    const req  = this._parseJSON(p.requisitos) || {};
    const crit = this._parseJSON(p.criterios)  || {};
    const bolsas = this._parseJSON(p.bolsas)   || [];
    const ods    = this._parseJSON(p.ods)       || [];

    // ── Bolsas do projeto
    const bolsaLinhas = bolsas.map(b =>
      `${this._esc(b.tipo || '—')} · ${b.quantidade || 1} vaga(s) · ${b.chSem || '—'}h/sem`
    );

    // ── Requisitos relevantes
    const reqLinhas = [];
    if (req.modalidade && req.modalidade !== 'Não se aplica')
      reqLinhas.push(`<b>Modalidade:</b> ${this._esc(req.modalidade)}`);
    if (req.cursos?.length && !req.cursos.includes('Não se aplica'))
      reqLinhas.push(`<b>Curso(s):</b> ${req.cursos.map(c => this._esc(c)).join(', ')}`);
    if (req.periodo && req.periodo !== 'Não se aplica')
      reqLinhas.push(`<b>Período mínimo:</b> ${this._esc(req.periodo)}`);
    if (req.componentes && req.componentes !== 'Não se aplica')
      reqLinhas.push(`<b>Componentes curriculares:</b> ${this._esc(req.componentes)}`);
    if (req.assistencia === 'Sim')
      reqLinhas.push(`<b>Assistência estudantil:</b> Obrigatório ser beneficiário(a)`);
    if (req.outrosRequisitos)
      reqLinhas.push(`<b>Outros:</b> ${this._esc(req.outrosRequisitos)}`);

    // ── Critérios de seleção
    const critLinhas = [];
    if (crit.entrevista && crit.entrevista !== 'Não se aplica')
      critLinhas.push(`Entrevista ${this._esc(crit.entrevista)} — peso ${crit.peso_entrevista || 0}`);
    if (Array.isArray(crit.analise) && !crit.analise.includes('Não se aplica'))
      critLinhas.push(`Análise: ${crit.analise.map(v => this._esc(v)).join(', ')} — peso ${crit.peso_analise || 0}`);
    if (crit.participacao && crit.participacao !== 'Não se aplica')
      critLinhas.push(`Participação: ${this._esc(crit.participacao)} — peso ${crit.peso_participacao || 0}`);
    if (crit.cursos_crit && crit.cursos_crit !== 'Não se aplica')
      critLinhas.push(`Realização de cursos: ${this._esc(crit.cursos_crit)} — peso ${crit.peso_cursos_crit || 0}`);
    if (crit.habilidades && crit.habilidades !== 'Não se aplica')
      critLinhas.push(`Habilidades/Conhecimentos: ${this._esc(crit.habilidades)} — peso ${crit.peso_habilidades || 0}`);
    if (crit.horario && crit.horario !== 'Não se aplica')
      critLinhas.push(`Disponibilidade de horário: ${this._esc(crit.horario)} — peso ${crit.peso_horario || 0}`);
    if (crit.outrosCriterios)
      critLinhas.push(this._esc(crit.outrosCriterios));

    const temDetalhes = req.resumo || reqLinhas.length || critLinhas.length ||
                        p.areaCapes || ods.length || bolsaLinhas.length;

    return `
    <div class="card" style="margin-bottom:10px">
      <div style="padding:20px">

        <!-- Cabeçalho do card -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap">
          <div style="flex:1;min-width:0">

            <!-- Badges -->
            <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
              ${segBadge(p.segmento)}
              ${p.tipoProjeto ? `<span class="b bn">${this._esc(p.tipoProjeto)}</span>` : ''}
              ${p.recurso     ? `<span class="b bn" style="background:#f1f5f9">${this._esc(p.recurso)}</span>` : ''}
            </div>

            <!-- Título -->
            <div style="font-family:'Sora',sans-serif;font-size:16px;font-weight:700;
                        line-height:1.35;margin-bottom:8px">
              ${this._esc(p.titulo)}
            </div>

            <!-- Coordenador -->
            <div style="font-size:13px;color:var(--g5);margin-bottom:8px">
              👤 <b>Coordenador:</b> ${this._esc(p.coordNome || p.coordEmail || '—')}
            </div>

            <!-- Infos rápidas -->
            <div style="display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:var(--g5)">
              ${bolsaLinhas.map(l => `<span>🎓 ${l}</span>`).join('')}
              ${p.areaCapes ? `<span>🔬 ${this._esc(p.areaCapes)}${p.subAreaCapes ? ' — ' + this._esc(p.subAreaCapes) : ''}</span>` : ''}
            </div>

            <!-- Resumo sempre visível (se existir) -->
            ${req.resumo ? `
            <div style="font-size:13px;color:var(--g5);line-height:1.7;
                        margin-top:12px;padding-top:12px;border-top:1px solid var(--bd)">
              ${this._esc(req.resumo)}
            </div>` : ''}
          </div>

          <!-- Ações -->
          <div style="display:flex;flex-direction:column;gap:8px;align-items:stretch;min-width:160px">
            <button class="btn bp" onclick="AlunoProjetosEdital._abrirCandidatura(${idx})">
              ✓ Candidatar-se
            </button>
            ${temDetalhes && !req.resumo ? `
            <button class="btn bo" style="font-size:12px"
              onclick="AlunoProjetosEdital._toggleDetalhes(${idx})">
              <span id="det-lbl-${idx}">▼ Ver detalhes</span>
            </button>` : ''}
            ${temDetalhes && req.resumo ? `
            <button class="btn bo" style="font-size:12px"
              onclick="AlunoProjetosEdital._toggleDetalhes(${idx})">
              <span id="det-lbl-${idx}">▼ Mais detalhes</span>
            </button>` : ''}
          </div>
        </div>

        <!-- Seção expansível de detalhes -->
        ${temDetalhes ? `
        <div id="det-${idx}" style="display:none;
              border-top:1px solid var(--bd);margin-top:16px;padding-top:16px;
              display:none;flex-direction:column;gap:14px">

          ${ods.length ? `
          <div>
            <div class="det-titulo">🌍 ODS relacionadas</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
              ${ods.map(o => `<span class="b bn" style="font-size:11px">${this._esc(o)}</span>`).join('')}
            </div>
          </div>` : ''}

          ${bolsaLinhas.length ? `
          <div>
            <div class="det-titulo">🎓 Bolsas do projeto</div>
            ${bolsaLinhas.map(l => `<div class="det-item">${l}</div>`).join('')}
          </div>` : ''}

          ${reqLinhas.length ? `
          <div>
            <div class="det-titulo">📋 Requisitos para participação</div>
            ${reqLinhas.map(l => `<div class="det-item">• ${l}</div>`).join('')}
          </div>` : `
          <div>
            <div class="det-titulo">📋 Requisitos para participação</div>
            <div class="det-item" style="color:var(--g4)">Sem requisitos específicos definidos.</div>
          </div>`}

          ${critLinhas.length ? `
          <div>
            <div class="det-titulo">🏆 Critérios de seleção</div>
            ${critLinhas.map(l => `<div class="det-item">• ${l}</div>`).join('')}
          </div>` : ''}

        </div>` : ''}
      </div>
    </div>`;
  },

  // ── Expandir / recolher detalhes ─────────────────
  _toggleDetalhes(idx) {
    const det = document.getElementById(`det-${idx}`);
    const lbl = document.getElementById(`det-lbl-${idx}`);
    if (!det) return;
    const aberto = det.style.display === 'flex';
    det.style.display = aberto ? 'none' : 'flex';
    if (lbl) lbl.textContent = aberto ? '▼ Mais detalhes' : '▲ Ocultar detalhes';
  },

  // ── Filtro de busca ──────────────────────────────
  _filtrar(q) {
    const t = q.toLowerCase().trim();
    const lista = t
      ? this._projetos.filter(p =>
          (p.titulo     || '').toLowerCase().includes(t) ||
          (p.coordNome  || '').toLowerCase().includes(t) ||
          (p.coordEmail || '').toLowerCase().includes(t) ||
          (p.segmento   || '').toLowerCase().includes(t))
      : this._projetos;
    document.getElementById('proj-lista').innerHTML = this._renderLista(lista);
  },

  // ── Abrir modal de candidatura ───────────────────
  _abrirCandidatura(idx) {
    const p = this._projetos[idx];
    if (!p) return;
    window._candProjeto = p;
    window._candEdital  = this._edital;

    Modal.open(
      `Candidatura`,
      `${this._esc(p.titulo)}`,
      `<div style="display:flex;flex-direction:column;gap:14px">
        <div style="background:var(--bg2);border-radius:8px;padding:10px 14px;font-size:13px;color:var(--g5)">
          👤 ${this._esc(p.coordNome || p.coordEmail || '—')}
        </div>
        <div class="fl">
          <label>Modalidade</label>
          <select class="sel" id="cand-modalidade">
            <option>Bolsista</option>
            <option>Voluntário</option>
          </select>
        </div>
        <div class="fl">
          <label>Carta de motivação <span style="font-weight:400;color:var(--g5)">(opcional)</span></label>
          <textarea class="inp" id="cand-motivacao" rows="3"
            placeholder="Descreva seu interesse e experiência relevante para este projeto..."></textarea>
        </div>
        <div class="fl">
          <label>Link Lattes <span style="font-weight:400;color:var(--g5)">(opcional)</span></label>
          <input class="inp" id="cand-lattes" type="url" placeholder="https://lattes.cnpq.br/...">
        </div>
      </div>`,
      `<button class="btn bo" onclick="Modal.close()">Cancelar</button>
       <button class="btn bp" id="btn-cand-ok">✓ Enviar candidatura</button>`
    );

    setTimeout(() => {
      const btn = document.getElementById('btn-cand-ok');
      if (btn) btn.onclick = () => AlunoProjetosEdital._confirmar();
    }, 0);
  },

  // ── Confirmar candidatura ────────────────────────
  async _confirmar() {
    const p = window._candProjeto;
    const e = window._candEdital;
    if (!p || !e) return;

    const lattes = val('cand-lattes');
    if (lattes && !/^https?:\/\/.+/.test(lattes)) {
      toast('⚠ Link Lattes inválido. Use uma URL completa.');
      return;
    }

    const dados = {
      editalId:    e.id,
      editalNome:  e.titulo,
      projetoId:   p.id,
      projetoNome: p.titulo,
      coordEmail:  p.coordEmail,
      modalidade:  val('cand-modalidade'),
      motivacao:   val('cand-motivacao'),
      lattes
    };

    Modal.close();
    toast('⏳ Enviando candidatura...');
    try {
      const res = await API.salvarInscricao(dados);
      SOA.inscricoes.push(res.nova);
      toast('✓ Candidatura enviada com sucesso! Aguarde o resultado.');
      AlunoRouter.ir('inscricoes');
    } catch(err) { toast('❌ ' + err.message); }
  }
};
