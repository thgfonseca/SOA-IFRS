// pages/coordenador/inscricoes.js

const CoordInscricoes = {

  _tab: 'homologacao',

  _parseJSON(v) { try { return v ? JSON.parse(v) : null; } catch(e) { return null; } },
  _esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
                        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  render(body) {
    window._inscMap = {};
    const lista = SOA.inscricoes;
    const pendentes  = lista.filter(i => (i.etapa === 'candidatura') || (!i.etapa && i.status === 'Pendente'));
    const recursos   = lista.filter(i => i.etapa === 'recurso');
    const avaliacao  = lista.filter(i => i.etapa === 'avaliacao');
    const concluidos = lista.filter(i => i.etapa === 'concluido');

    const tab = this._tab;
    const tabBtn = (id, label, count) => {
      const active = tab === id ? ' on' : '';
      const badge  = count > 0
        ? ` <span style="background:#e5e7eb;color:#374151;border-radius:10px;padding:1px 7px;font-size:11px;font-weight:700">${count}</span>`
        : '';
      return `<button class="btn bo${active}" style="font-size:13px" onclick="CoordInscricoes._mudarTab('${id}')">${label}${badge}</button>`;
    };

    let html = `<div class="ph"><div><h1>Inscrições</h1><p>${lista.length} inscrição(ões) nos seus projetos</p></div></div>`;
    html += `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
      ${tabBtn('homologacao','📋 Homologação', pendentes.length)}
      ${tabBtn('recursos','⚖ Recursos', recursos.length)}
      ${tabBtn('avaliacao','📊 Avaliação', avaliacao.length)}
      ${tabBtn('concluidos','✅ Concluídos', concluidos.length)}
    </div>`;

    if (tab === 'homologacao')   html += this._renderHomologacao(pendentes);
    else if (tab === 'recursos') html += this._renderRecursos(recursos);
    else if (tab === 'avaliacao') html += this._renderAvaliacao(avaliacao);
    else html += this._renderConcluidos(concluidos);

    body.innerHTML = html;

    // Bind avaliação events after DOM insert
    if (tab === 'avaliacao') {
      avaliacao.forEach((insc, idx) => {
        const crits = this._parseCriterios(this._getCrit(insc.projetoId));
        crits.forEach((c, ci) => {
          const el = document.getElementById(`ncrit-${idx}-${ci}`);
          if (el) el.addEventListener('input', () => this._recalcNota(idx, crits));
        });
        this._recalcNota(idx, crits);
      });
    }
  },

  _mudarTab(tab) {
    this._tab = tab;
    this.render(document.getElementById('coord-body'));
  },

  _getCrit(projetoId) {
    const p = SOA.projetos.find(p => p.id === projetoId);
    return p ? this._parseJSON(p.criterios) : null;
  },

  _getReq(projetoId) {
    const p = SOA.projetos.find(p => p.id === projetoId);
    return p ? this._parseJSON(p.requisitos) : null;
  },

  _renderReqChecklist(req) {
    if (!req) return '<p style="color:var(--g5);font-size:12px">Sem requisitos definidos para este projeto.</p>';
    const itens = [];
    if (req.modalidade && req.modalidade !== 'Não se aplica')
      itens.push(`Modalidade: ${req.modalidade}`);
    if (req.cursos && req.cursos.length && !req.cursos.includes('Não se aplica'))
      itens.push(`Curso(s): ${req.cursos.join(', ')}`);
    if (req.periodo && req.periodo !== 'Não se aplica')
      itens.push(`Período mínimo: ${req.periodo}`);
    if (req.componentes && req.componentes !== 'Não se aplica')
      itens.push(`Componentes curriculares: ${req.componentes}`);
    if (req.assistencia && req.assistencia !== 'Não se aplica')
      itens.push(`Assistência estudantil: ${req.assistencia}`);
    if (req.outrosRequisitos)
      itens.push(`Outros: ${req.outrosRequisitos}`);
    if (itens.length === 0)
      return '<p style="color:var(--g5);font-size:12px">Sem requisitos específicos definidos.</p>';
    return itens.map(it =>
      `<label style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;cursor:pointer">
        <input type="checkbox" style="margin-top:2px;flex-shrink:0">
        <span style="font-size:13px">${this._esc(it)}</span>
      </label>`
    ).join('');
  },

  _parseCriterios(crit) {
    if (!crit) return [];
    const result = [];
    const KEYS = [
      { k: 'entrevista',   pk: 'peso_entrevista'   },
      { k: 'analise',      pk: 'peso_analise'       },
      { k: 'participacao', pk: 'peso_participacao'  },
      { k: 'cursos_crit',  pk: 'peso_cursos_crit'  },
      { k: 'habilidades',  pk: 'peso_habilidades'   },
      { k: 'horario',      pk: 'peso_horario'       }
    ];
    KEYS.forEach(({ k, pk }) => {
      const val  = crit[k];
      const peso = parseFloat(crit[pk] || 0);
      if (!val || (Array.isArray(val) && val.includes('Não se aplica'))) return;
      if (val === 'Não se aplica') return;
      if (peso > 0) {
        const nome = Array.isArray(val) ? val.filter(v => v !== 'Não se aplica').join(', ') : String(val);
        if (nome) result.push({ nome, peso });
      }
    });
    if (crit.outrosCriterios) {
      const m = String(crit.outrosCriterios).match(/peso\s+(\d+(?:\.\d+)?)/i);
      if (m) result.push({ nome: crit.outrosCriterios, peso: parseFloat(m[1]) });
    }
    return result;
  },

  _recalcNota(idx, crits) {
    let soma = 0;
    let pesoTotal = 0;
    crits.forEach((c, ci) => {
      const el     = document.getElementById(`ncrit-${idx}-${ci}`);
      const contrib = document.getElementById(`ctrib-${idx}-${ci}`);
      if (!el) return;
      const nota = parseFloat(el.value);
      const val  = isNaN(nota) ? 0 : nota * c.peso;
      soma      += val;
      pesoTotal += c.peso;
      if (contrib) contrib.textContent = isNaN(nota) ? '—' : val.toFixed(1);
    });
    const total = document.getElementById(`ntotal-${idx}`);
    if (total) {
      const notaFinal = pesoTotal > 0 ? soma / 10 : NaN;
      total.textContent = isNaN(notaFinal) ? '—' : notaFinal.toFixed(2);
      total.style.color = isNaN(notaFinal) ? 'var(--g5)' : notaFinal >= 6 ? '#16a34a' : '#dc2626';
    }
  },

  _renderHomologacao(lista) {
    if (lista.length === 0)
      return `<div class="card">${emptyState('📋', 'Nenhuma inscrição aguardando homologação.')}</div>`;

    let html = '';
    lista.forEach((insc, idx) => {
      window._inscMap[idx] = insc;
      const req = this._getReq(insc.projetoId);
      html += `
      <div class="card" style="margin-bottom:16px">
        <div class="ch" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div>
            <div class="tm">${this._esc(insc.alunoNome)}</div>
            <div class="ts">${this._esc(insc.alunoEmail)}</div>
          </div>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            <span class="b bn">${this._esc(insc.modalidade)}</span>
            ${statusBadge(insc.status)}
            <span style="font-size:12px;color:var(--g5)">${this._esc(insc.criadoEm)}</span>
          </div>
        </div>
        <div style="padding:0 24px 16px">
          <div style="font-weight:600;margin-bottom:2px">${this._esc(insc.projetoNome)}</div>
          <div style="font-size:12px;color:var(--g5);margin-bottom:12px">${this._esc(insc.editalNome)}</div>
          ${insc.motivacao ? `<div style="margin-bottom:10px">
            <span style="font-weight:600;font-size:12px">Motivação:</span>
            <div style="font-size:13px;color:#374151;margin-top:3px;padding:8px 12px;background:var(--bg2);border-radius:6px">${this._esc(insc.motivacao)}</div>
          </div>` : ''}
          ${insc.lattes ? `<div style="margin-bottom:10px;font-size:13px">
            <span style="font-weight:600">Lattes:</span>
            <a href="${this._esc(insc.lattes)}" target="_blank" style="color:var(--azul)">${this._esc(insc.lattes)}</a>
          </div>` : ''}
          <div style="margin-bottom:14px">
            <div style="font-weight:600;font-size:13px;margin-bottom:8px">Checklist de Requisitos:</div>
            ${this._renderReqChecklist(req)}
          </div>
          <div style="margin-bottom:10px">
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">
              Justificativa <span style="font-weight:400;color:var(--g5)">(obrigatória para não homologar)</span>
            </label>
            <textarea class="inp" id="just-${idx}" rows="2" placeholder="Informe o motivo..."></textarea>
          </div>
          <div class="acts">
            <button class="ab" data-idx="${idx}" onclick="CoordInscricoes.homologar(this.dataset.idx,'homologar')">✓ Homologar</button>
            <button class="ab dg" data-idx="${idx}" onclick="CoordInscricoes.homologar(this.dataset.idx,'nao_homologar')">✗ Não homologar</button>
          </div>
        </div>
      </div>`;
    });
    return html;
  },

  _renderRecursos(lista) {
    if (lista.length === 0)
      return `<div class="card">${emptyState('⚖', 'Nenhum recurso pendente.')}</div>`;

    let html = '';
    lista.forEach((insc, idx) => {
      window._inscMap[idx] = insc;
      html += `
      <div class="card" style="margin-bottom:16px">
        <div class="ch" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div>
            <div class="tm">${this._esc(insc.alunoNome)}</div>
            <div class="ts">${this._esc(insc.alunoEmail)}</div>
          </div>
          ${statusBadge(insc.status)}
        </div>
        <div style="padding:0 24px 16px">
          <div style="font-weight:600;margin-bottom:4px">${this._esc(insc.projetoNome)}</div>
          <div style="font-size:12px;color:var(--g5);margin-bottom:12px">${this._esc(insc.editalNome)}</div>
          <div style="margin-bottom:10px;background:#fef2f2;border-radius:6px;padding:10px 12px">
            <div style="font-weight:600;font-size:12px;color:#dc2626;margin-bottom:4px">Motivo da não homologação:</div>
            <div style="font-size:13px">${this._esc(insc.justificativaHomolog || '—')}</div>
            <div style="font-size:11px;color:var(--g5);margin-top:4px">Por: ${this._esc(insc.homologadoPor)} em ${this._esc(insc.homologadoEm)}</div>
          </div>
          <div style="margin-bottom:14px;background:#eff6ff;border-radius:6px;padding:10px 12px">
            <div style="font-weight:600;font-size:12px;color:#1d4ed8;margin-bottom:4px">Recurso do aluno:</div>
            <div style="font-size:13px">${this._esc(insc.recursoMotivo || '—')}</div>
            <div style="font-size:11px;color:var(--g5);margin-top:4px">Enviado em: ${this._esc(insc.recursoEm)}</div>
          </div>
          <div class="acts">
            <button class="ab" data-idx="${idx}" onclick="CoordInscricoes.decidirRecurso(this.dataset.idx,'deferir')">✓ Deferir recurso</button>
            <button class="ab dg" data-idx="${idx}" onclick="CoordInscricoes.decidirRecurso(this.dataset.idx,'indeferir')">✗ Indeferir recurso</button>
          </div>
        </div>
      </div>`;
    });
    return html;
  },

  _renderAvaliacao(lista) {
    if (lista.length === 0)
      return `<div class="card">${emptyState('📊', 'Nenhuma inscrição aguardando avaliação.')}</div>`;

    let html = '';
    lista.forEach((insc, idx) => {
      window._inscMap[idx] = insc;
      const crits = this._parseCriterios(this._getCrit(insc.projetoId));
      const critsHtml = crits.length === 0
        ? '<p style="color:var(--g5);font-size:12px">Sem critérios definidos. Insira a nota diretamente.</p>'
        : crits.map((c, ci) =>
          `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border:1px solid var(--bd);border-radius:8px;flex-wrap:wrap;margin-bottom:6px">
            <div style="flex:1;min-width:120px;font-size:13px;font-weight:500">${this._esc(c.nome)}</div>
            <div style="font-size:12px;color:var(--g5)">Peso: ${c.peso}</div>
            <div style="display:flex;align-items:center;gap:6px">
              <label style="font-size:12px">Nota:</label>
              <input type="number" min="0" max="10" step="0.5" class="inp" id="ncrit-${idx}-${ci}"
                style="width:64px;padding:4px 8px">
            </div>
            <div style="font-size:12px;color:var(--g5)">= <span id="ctrib-${idx}-${ci}">—</span></div>
          </div>`
        ).join('');

      html += `
      <div class="card" style="margin-bottom:16px">
        <div class="ch" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div>
            <div class="tm">${this._esc(insc.alunoNome)}</div>
            <div class="ts">${this._esc(insc.alunoEmail)}</div>
          </div>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            <span class="b bn">${this._esc(insc.modalidade)}</span>
            ${statusBadge(insc.status)}
          </div>
        </div>
        <div style="padding:0 24px 16px">
          <div style="font-weight:600;margin-bottom:4px">${this._esc(insc.projetoNome)}</div>
          <div style="font-size:12px;color:var(--g5);margin-bottom:14px">${this._esc(insc.editalNome)}</div>
          <div style="font-weight:600;font-size:13px;margin-bottom:10px">Critérios de avaliação:</div>
          ${critsHtml}
          <div style="display:flex;align-items:center;gap:10px;margin:14px 0;padding:10px 14px;background:var(--bg2);border-radius:8px">
            <span style="font-weight:600">Nota final (0–10):</span>
            <span id="ntotal-${idx}" style="font-size:22px;font-weight:700;color:var(--g5)">—</span>
          </div>
          <div style="margin-bottom:10px">
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">Resultado:</label>
            <select class="inp" id="resultado-${idx}" style="max-width:260px">
              <option value="">Selecione...</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Aprovado suplente">Aprovado suplente</option>
              <option value="Reprovado">Reprovado</option>
            </select>
          </div>
          <div style="margin-bottom:10px">
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">Observação:</label>
            <textarea class="inp" id="obs-${idx}" rows="2" placeholder="Opcional..."></textarea>
          </div>
          <div class="acts">
            <button class="ab" data-idx="${idx}" onclick="CoordInscricoes.avaliar(this.dataset.idx)">💾 Salvar avaliação</button>
          </div>
        </div>
      </div>`;
    });
    return html;
  },

  _renderConcluidos(lista) {
    if (lista.length === 0)
      return `<div class="card">${emptyState('✅', 'Nenhuma inscrição concluída ainda.')}</div>`;

    const rows = lista.map(i => [
      `<div class="tm">${this._esc(i.alunoNome)}</div><div class="ts">${this._esc(i.alunoEmail)}</div>`,
      this._esc(i.projetoNome),
      `<span class="b bn">${this._esc(i.modalidade)}</span>`,
      statusBadge(i.status),
      i.notaFinal || '—',
      i.avaliadoEm || '—'
    ]);
    return `<div class="card">${buildTable(['Aluno','Projeto','Modalidade','Status','Nota','Data'],rows)}</div>`;
  },

  async homologar(idxStr, decisao) {
    const idx  = parseInt(idxStr);
    const insc = window._inscMap[idx];
    if (!insc) return;
    const just = document.getElementById(`just-${idx}`)?.value?.trim() || '';
    if (decisao === 'nao_homologar' && !just) {
      toast('⚠ Informe a justificativa para não homologar.');
      return;
    }
    toast('⏳ Salvando...');
    try {
      const res = await API.homologarInscricao({ id: insc.id, decisao, justificativa: just });
      const obj = SOA.inscricoes.find(x => x.id === insc.id);
      if (obj) {
        obj.status              = res.status;
        obj.etapa               = decisao === 'homologar' ? 'avaliacao' : 'homologacao';
        obj.homologadoEm        = res.homologadoEm;
        obj.justificativaHomolog = just;
      }
      toast(`✓ ${res.status}!`);
      this.render(document.getElementById('coord-body'));
    } catch(e) { toast('❌ ' + e.message); }
  },

  async decidirRecurso(idxStr, decisao) {
    const idx  = parseInt(idxStr);
    const insc = window._inscMap[idx];
    if (!insc) return;
    toast('⏳ Salvando...');
    try {
      const res = await API.decidirRecurso({ id: insc.id, decisao });
      const obj = SOA.inscricoes.find(x => x.id === insc.id);
      if (obj) {
        obj.status           = res.status;
        obj.etapa            = decisao === 'deferir' ? 'avaliacao' : 'concluido';
        obj.recursoDecisao   = decisao;
        obj.recursoDecisaoEm = res.recursoDecisaoEm;
      }
      toast(`✓ ${res.status}!`);
      this.render(document.getElementById('coord-body'));
    } catch(e) { toast('❌ ' + e.message); }
  },

  async avaliar(idxStr) {
    const idx  = parseInt(idxStr);
    const insc = window._inscMap[idx];
    if (!insc) return;
    const resultado = document.getElementById(`resultado-${idx}`)?.value || '';
    if (!resultado) { toast('⚠ Selecione o resultado.'); return; }
    const obs   = document.getElementById(`obs-${idx}`)?.value?.trim() || '';
    const crits = this._parseCriterios(this._getCrit(insc.projetoId));
    const notasObj = {};
    let soma = 0;
    crits.forEach((c, ci) => {
      const el   = document.getElementById(`ncrit-${idx}-${ci}`);
      const nota = el ? parseFloat(el.value) : NaN;
      notasObj[c.nome] = isNaN(nota) ? '' : nota;
      if (!isNaN(nota)) soma += nota * c.peso;
    });
    const notaFinal      = crits.length > 0 ? (soma / 10).toFixed(2) : '';
    const notasCriterios = crits.length > 0 ? JSON.stringify(notasObj) : '';
    toast('⏳ Salvando...');
    try {
      const res = await API.avaliarInscricao(insc.id, resultado, obs, notaFinal, notasCriterios);
      const obj = SOA.inscricoes.find(x => x.id === insc.id);
      if (obj) {
        obj.status         = resultado;
        obj.etapa          = 'concluido';
        obj.resultado      = resultado;
        obj.notaFinal      = notaFinal;
        obj.notasCriterios = notasCriterios;
        obj.avaliadoEm     = res.avaliadoEm;
        obj.observacao     = obs;
      }
      toast(`✓ ${resultado}!`);
      this._tab = 'concluidos';
      this.render(document.getElementById('coord-body'));
    } catch(e) { toast('❌ ' + e.message); }
  }
};
