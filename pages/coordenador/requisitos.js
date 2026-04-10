// pages/coordenador/requisitos.js

const CoordRequisitos = {

  _projetoId: null,
  _esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
                          .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },
  _parseJSON(v) { try { return v ? JSON.parse(v) : null; } catch(e) { return null; } },

  CURSOS: [
    'Análise e Desenvolvimento de Sistemas',
    'Arquitetura e Urbanismo',
    'Engenharia Mecânica',
    'Técnico em Automação Industrial',
    'Técnico em Eletrotécnica',
    'Técnico em Geoprocessamento',
    'Técnico em Informática para Internet',
    'Técnico em Mecânica / Fabricação mecânica',
    'Técnico em Refrigeração e Climatização',
    'Técnico em Enfermagem'
  ],

  form(body, projeto) {
    this._projetoId = projeto.id;
    const req  = this._parseJSON(projeto.requisitos) || {};
    const crit = this._parseJSON(projeto.criterios)  || {};
    const rv   = k => req[k]  || '';
    const cv   = k => crit[k] || '';

    body.innerHTML = `
    <div class="ph">
      <div>
        <h1>Requisitos e Critérios de Seleção</h1>
        <p style="color:var(--g5);margin-top:2px">${this._esc(projeto.titulo)}</p>
      </div>
      <div class="phr">
        <button class="btn bo" onclick="CoordRouter.ir('projetos')">← Voltar</button>
      </div>
    </div>

    <!-- ─── Seção 6: Resumo ──────────────────────── -->
    <div class="card">
      <div class="ch"><h3>6. Resumo do Projeto</h3></div>
      <div style="padding:0 24px 24px">
        <label style="font-weight:600;display:block;margin-bottom:6px">
          Breve resumo <span style="font-weight:400;color:var(--g5)">(até 400 caracteres)</span>
        </label>
        <textarea class="inp" id="req-resumo" rows="4" maxlength="400"
          placeholder="Descreva brevemente o contexto e objetivo do projeto...">${this._esc(rv('resumo'))}</textarea>
        <div style="text-align:right;font-size:11px;color:var(--g5);margin-top:3px" id="req-resumo-cnt">
          ${rv('resumo').length}/400
        </div>
      </div>
    </div>

    <!-- ─── Seção 7: Requisitos ──────────────────── -->
    <div class="card">
      <div class="ch"><h3>7. Requisitos para Participação</h3></div>
      <div style="padding:0 24px 24px;display:flex;flex-direction:column;gap:20px">

        <!-- Modalidade -->
        <div>
          <div style="font-weight:600;margin-bottom:8px">Estar matriculado(a) na seguinte modalidade de ensino:</div>
          ${['Ensino Médio Integrado ou Técnico Subsequente','Superior','Não se aplica'].map(m => `
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:5px;cursor:pointer">
            <input type="radio" name="req-modalidade" value="${m}"
              ${(rv('modalidade') || 'Não se aplica') === m ? 'checked' : ''}>
            <span>${m}</span>
          </label>`).join('')}
        </div>

        <!-- Cursos -->
        <div>
          <div style="font-weight:600;margin-bottom:8px">Possuir matrícula no(s) seguinte(s) curso(s):</div>
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer">
            <input type="checkbox" id="req-curso-na"
              onchange="CoordRequisitos._toggleCursoNA(this)"
              ${!req.cursos || !req.cursos.length || req.cursos.includes('Não se aplica') ? 'checked' : ''}>
            <strong>Não se aplica</strong>
          </label>
          <div id="req-cursos-wrap" style="padding-left:4px;${!req.cursos || !req.cursos.length || req.cursos.includes('Não se aplica') ? 'opacity:.4;pointer-events:none' : ''}">
            ${this.CURSOS.map(c => `
            <label style="display:flex;align-items:center;gap:8px;margin-bottom:5px;cursor:pointer">
              <input type="checkbox" name="req-curso" value="${c}"
                ${req.cursos && req.cursos.includes(c) ? 'checked' : ''}>
              <span>${c}</span>
            </label>`).join('')}
          </div>
        </div>

        <!-- Período mínimo -->
        <div>
          <div style="font-weight:600;margin-bottom:8px">Estar cursando, no mínimo, o seguinte período:</div>
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:5px;cursor:pointer">
            <input type="radio" name="req-periodo" value="na"
              ${!rv('periodo') || rv('periodo') === 'Não se aplica' ? 'checked' : ''}
              onchange="document.getElementById('req-periodo-txt').style.display='none'">
            <span>Não se aplica</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="radio" name="req-periodo" value="outro"
              ${rv('periodo') && rv('periodo') !== 'Não se aplica' ? 'checked' : ''}
              onchange="document.getElementById('req-periodo-txt').style.display='block'">
            <span>Outro:</span>
          </label>
          <input class="inp" id="req-periodo-txt"
            style="margin-top:6px;display:${rv('periodo') && rv('periodo') !== 'Não se aplica' ? 'block' : 'none'}"
            placeholder="Ex: 2º período"
            value="${this._esc(rv('periodo') !== 'Não se aplica' ? rv('periodo') : '')}">
        </div>

        <!-- Componentes curriculares -->
        <div>
          <div style="font-weight:600;margin-bottom:8px">Ter sido aprovado(a) no(s) seguinte(s) componente(s) curricular(es):</div>
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:5px;cursor:pointer">
            <input type="radio" name="req-comp" value="na"
              ${!rv('componentes') || rv('componentes') === 'Não se aplica' ? 'checked' : ''}
              onchange="document.getElementById('req-comp-txt').style.display='none'">
            <span>Não se aplica</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="radio" name="req-comp" value="outro"
              ${rv('componentes') && rv('componentes') !== 'Não se aplica' ? 'checked' : ''}
              onchange="document.getElementById('req-comp-txt').style.display='block'">
            <span>Outro:</span>
          </label>
          <textarea class="inp" id="req-comp-txt" rows="2"
            style="margin-top:6px;display:${rv('componentes') && rv('componentes') !== 'Não se aplica' ? 'block' : 'none'}"
            placeholder="Liste os componentes curriculares exigidos">${this._esc(rv('componentes') !== 'Não se aplica' ? rv('componentes') : '')}</textarea>
        </div>

        <!-- Assistência estudantil -->
        <div>
          <div style="font-weight:600;margin-bottom:8px">Ser beneficiário(a) do Programa de Assistência Estudantil:</div>
          ${['Sim','Não se aplica'].map(v => `
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:5px;cursor:pointer">
            <input type="radio" name="req-assist" value="${v}"
              ${(rv('assistencia') || 'Não se aplica') === v ? 'checked' : ''}>
            <span>${v}</span>
          </label>`).join('')}
        </div>

        <!-- Outros requisitos -->
        <div>
          <div style="font-weight:600;margin-bottom:6px">
            Outros Requisitos <span style="font-weight:400;color:var(--g5)">(opcional)</span>
          </div>
          <textarea class="inp" id="req-outros" rows="3"
            placeholder="Apenas requisitos de vínculo acadêmico formal são permitidos. Não são permitidos requisitos de experiências anteriores (OFÍCIO CIRCULAR Nº 10/2025).">${this._esc(rv('outrosRequisitos'))}</textarea>
        </div>
      </div>
    </div>

    <!-- ─── Seção 8: Critérios ───────────────────── -->
    <div class="card">
      <div class="ch" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <h3 style="margin:0">8. Critérios de Seleção</h3>
        <span style="font-size:12px;font-weight:400;color:var(--g5)">A soma dos pesos dos critérios selecionados deve totalizar 10</span>
      </div>
      <div style="padding:0 24px 24px;display:flex;flex-direction:column;gap:14px">

        ${this._cardRadio('entrevista','Entrevista',['Não se aplica','Presencial','On-line'],crit)}
        ${this._cardCheck('analise','Análise de documentos',['Currículo Lattes','Currículo Vitae','Portfólio','Carta de intenções','Produção de texto','Produção de vídeo','Não se aplica'],crit)}
        ${this._cardOutro('participacao','Participação em',crit)}
        ${this._cardOutro('cursos_crit','Realização de curso(s) de',crit)}
        ${this._cardOutro('habilidades','Habilidade(s) e/ou Conhecimento(s) em',crit)}
        ${this._cardOutro('horario','Disponibilidade de horário compatível com as demandas do projeto',crit)}

        <!-- Outros critérios -->
        <div style="border:1px solid var(--bd);border-radius:10px;padding:16px">
          <div style="font-weight:600;margin-bottom:8px">
            Outros critérios <span style="font-weight:400;color:var(--g5)">(opcional — informe Critério + Peso)</span>
          </div>
          <textarea class="inp" id="crit-outros-txt" rows="2"
            placeholder="Ex: Desempenho em entrevista técnica — peso 3">${this._esc(cv('outrosCriterios'))}</textarea>
        </div>

        <!-- Soma dos pesos -->
        <div style="background:var(--bg2);border-radius:8px;padding:12px 18px;display:flex;align-items:center;gap:10px">
          <span style="font-weight:600">Soma dos pesos:</span>
          <span id="crit-soma" style="font-size:20px;font-weight:700;color:var(--g5)">0</span>
          <span style="color:var(--g5)">/10</span>
          <span id="crit-soma-msg" style="font-size:12px;margin-left:4px"></span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="display:flex;gap:10px;margin:24px 0">
      <button class="btn bo" onclick="CoordRouter.ir('projetos')">Cancelar</button>
      <div style="flex:1"></div>
      <button class="btn bp" onclick="CoordRequisitos.salvar()">Salvar requisitos</button>
    </div>`;

    // Contador caracteres resumo
    const ta  = document.getElementById('req-resumo');
    const cnt = document.getElementById('req-resumo-cnt');
    if (ta) ta.addEventListener('input', () => cnt.textContent = ta.value.length + '/400');

    // Watchers de peso para recalcular soma
    document.querySelectorAll('.cr-peso').forEach(s =>
      s.addEventListener('change', () => CoordRequisitos._recalcSoma())
    );
    this._recalcSoma();
  },

  // ── Helpers de cards ────────────────────────────

  _pesoSel(key, crit) {
    const v = crit['peso_' + key] || '';
    return `<select class="inp cr-peso" id="crit-peso-${key}"
      style="width:74px;padding:4px 8px" onchange="CoordRequisitos._recalcSoma()">
      <option value="">—</option>
      ${[1,2,3,4,5,6,7,8,9,10].map(n =>
        `<option value="${n}"${String(v) === String(n) ? ' selected' : ''}>${n}</option>`
      ).join('')}
    </select>`;
  },

  _cabecalhoCrit(key, label, crit) {
    return `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
      <span style="font-weight:600">${label}</span>
      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-size:13px;color:var(--g5)">Peso:</span>
        ${this._pesoSel(key, crit)}
      </div>
    </div>`;
  },

  _cardRadio(key, label, opts, crit) {
    const v = crit[key] || 'Não se aplica';
    return `<div style="border:1px solid var(--bd);border-radius:10px;padding:16px">
      ${this._cabecalhoCrit(key, label, crit)}
      ${opts.map(o => `
      <label style="display:flex;align-items:center;gap:8px;margin-bottom:5px;cursor:pointer">
        <input type="radio" name="crit-${key}" value="${o}" ${v === o ? 'checked' : ''}>
        <span>${o}</span>
      </label>`).join('')}
    </div>`;
  },

  _cardCheck(key, label, opts, crit) {
    const raw = crit[key];
    const v = Array.isArray(raw) ? raw : (raw ? [raw] : ['Não se aplica']);
    return `<div style="border:1px solid var(--bd);border-radius:10px;padding:16px">
      ${this._cabecalhoCrit(key, label, crit)}
      ${opts.map(o => `
      <label style="display:flex;align-items:center;gap:8px;margin-bottom:5px;cursor:pointer">
        <input type="checkbox" name="crit-${key}" value="${o}" ${v.includes(o) ? 'checked' : ''}>
        <span>${o}</span>
      </label>`).join('')}
    </div>`;
  },

  _cardOutro(key, label, crit) {
    const v = crit[key] || 'Não se aplica';
    const isOutro = v && v !== 'Não se aplica';
    return `<div style="border:1px solid var(--bd);border-radius:10px;padding:16px">
      ${this._cabecalhoCrit(key, label, crit)}
      <label style="display:flex;align-items:center;gap:8px;margin-bottom:5px;cursor:pointer">
        <input type="radio" name="crit-${key}" value="na" ${!isOutro ? 'checked' : ''}
          onchange="document.getElementById('crit-${key}-txt').style.display='none'">
        <span>Não se aplica</span>
      </label>
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
        <input type="radio" name="crit-${key}" value="outro" ${isOutro ? 'checked' : ''}
          onchange="document.getElementById('crit-${key}-txt').style.display='block'">
        <span>Outro:</span>
      </label>
      <input class="inp" id="crit-${key}-txt"
        style="margin-top:6px;display:${isOutro ? 'block' : 'none'}"
        placeholder="Descreva..."
        value="${this._esc(isOutro ? v : '')}">
    </div>`;
  },

  // ── Interações ───────────────────────────────────

  _toggleCursoNA(cb) {
    const wrap = document.getElementById('req-cursos-wrap');
    if (!wrap) return;
    if (cb.checked) {
      wrap.style.opacity = '.4';
      wrap.style.pointerEvents = 'none';
      wrap.querySelectorAll('input').forEach(c => c.checked = false);
    } else {
      wrap.style.opacity = '1';
      wrap.style.pointerEvents = '';
    }
  },

  _recalcSoma() {
    let soma = 0;
    document.querySelectorAll('.cr-peso').forEach(s => {
      const v = parseInt(s.value);
      if (!isNaN(v)) soma += v;
    });
    const el  = document.getElementById('crit-soma');
    const msg = document.getElementById('crit-soma-msg');
    if (el) {
      el.textContent = soma;
      el.style.color = soma === 10 ? '#16a34a' : soma > 10 ? '#dc2626' : 'var(--g5)';
    }
    if (msg) {
      if      (soma === 10) { msg.textContent = '✓ Correto';   msg.style.color = '#16a34a'; }
      else if (soma > 10)   { msg.textContent = '⚠ Excede 10'; msg.style.color = '#dc2626'; }
      else                  { msg.textContent = ''; }
    }
  },

  // ── Coleta de dados ──────────────────────────────

  _coletarRequisitos() {
    const rval = name => {
      const el = document.querySelector(`input[name="${name}"]:checked`);
      return el ? el.value : '';
    };
    const periodoR = rval('req-periodo');
    const periodo  = periodoR === 'na' ? 'Não se aplica'
      : (document.getElementById('req-periodo-txt')?.value?.trim() || 'Não se aplica');

    const compR     = rval('req-comp');
    const componentes = compR === 'na' ? 'Não se aplica'
      : (document.getElementById('req-comp-txt')?.value?.trim() || 'Não se aplica');

    const naChecked = document.getElementById('req-curso-na')?.checked;
    const cursos    = naChecked
      ? ['Não se aplica']
      : Array.from(document.querySelectorAll('input[name="req-curso"]:checked')).map(c => c.value);

    return {
      resumo:           document.getElementById('req-resumo')?.value?.trim() || '',
      modalidade:       rval('req-modalidade') || 'Não se aplica',
      cursos,
      periodo,
      componentes,
      assistencia:      rval('req-assist') || 'Não se aplica',
      outrosRequisitos: document.getElementById('req-outros')?.value?.trim() || ''
    };
  },

  _coletarCriterios() {
    const rval = name => {
      const el = document.querySelector(`input[name="${name}"]:checked`);
      return el ? el.value : '';
    };
    const peso = key => {
      const v = parseInt(document.getElementById('crit-peso-' + key)?.value);
      return isNaN(v) ? 0 : v;
    };
    const outroVal = key => {
      const r = rval('crit-' + key);
      return r === 'outro'
        ? (document.getElementById('crit-' + key + '-txt')?.value?.trim() || '')
        : 'Não se aplica';
    };
    const analise = Array.from(
      document.querySelectorAll('input[name="crit-analise"]:checked')
    ).map(c => c.value);

    return {
      entrevista:        rval('crit-entrevista') || 'Não se aplica',
      peso_entrevista:   peso('entrevista'),
      analise:           analise.length ? analise : ['Não se aplica'],
      peso_analise:      peso('analise'),
      participacao:      outroVal('participacao'),
      peso_participacao: peso('participacao'),
      cursos_crit:       outroVal('cursos_crit'),
      peso_cursos_crit:  peso('cursos_crit'),
      habilidades:       outroVal('habilidades'),
      peso_habilidades:  peso('habilidades'),
      horario:           outroVal('horario'),
      peso_horario:      peso('horario'),
      outrosCriterios:   document.getElementById('crit-outros-txt')?.value?.trim() || ''
    };
  },

  // ── Salvar ───────────────────────────────────────

  async salvar() {
    const requisitos = this._coletarRequisitos();
    const criterios  = this._coletarCriterios();
    toast('⏳ Salvando...');
    try {
      await API.salvarRequisitos({
        projetoId:  this._projetoId,
        requisitos: JSON.stringify(requisitos),
        criterios:  JSON.stringify(criterios)
      });
      const idx = SOA.projetos.findIndex(p => p.id === this._projetoId);
      if (idx >= 0) {
        SOA.projetos[idx].requisitos = JSON.stringify(requisitos);
        SOA.projetos[idx].criterios  = JSON.stringify(criterios);
      }
      toast('✓ Requisitos e critérios salvos!');
      CoordRouter.ir('projetos');
    } catch(e) { toast('❌ ' + e.message); }
  }
};
