// pages/aluno/editais.js

const AlunoEditais = {

  _fmtData(v) {
    if (!v) return '';
    const s = String(v).trim();
    if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) return s.substring(0, 10);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return s;
  },

  _esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
  },

  _parseJSON(v) { try { return v ? JSON.parse(v) : null; } catch(e) { return null; } },

  // ── Renderiza requisitos/critérios para o aluno ──
  _renderRequisitosAluno(proj) {
    const req  = this._parseJSON(proj.requisitos);
    const crit = this._parseJSON(proj.criterios);
    if (!req && !crit) return '';

    let linhas = [];

    if (req) {
      if (req.modalidade && req.modalidade !== 'Não se aplica')
        linhas.push(`<b>Modalidade:</b> ${this._esc(req.modalidade)}`);
      if (req.cursos && req.cursos.length && !req.cursos.includes('Não se aplica'))
        linhas.push(`<b>Curso(s):</b> ${req.cursos.map(c => this._esc(c)).join(', ')}`);
      if (req.periodo && req.periodo !== 'Não se aplica')
        linhas.push(`<b>Período mínimo:</b> ${this._esc(req.periodo)}`);
      if (req.componentes && req.componentes !== 'Não se aplica')
        linhas.push(`<b>Componentes curriculares:</b> ${this._esc(req.componentes)}`);
      if (req.assistencia === 'Sim')
        linhas.push(`<b>Assistência estudantil:</b> Obrigatório ser beneficiário(a)`);
      if (req.outrosRequisitos)
        linhas.push(`<b>Outros:</b> ${this._esc(req.outrosRequisitos)}`);
    }

    let critLinhas = [];
    if (crit) {
      if (crit.entrevista && crit.entrevista !== 'Não se aplica')
        critLinhas.push(`Entrevista ${this._esc(crit.entrevista)} — peso ${crit.peso_entrevista}`);
      if (crit.analise && Array.isArray(crit.analise) && !crit.analise.includes('Não se aplica'))
        critLinhas.push(`Análise: ${crit.analise.map(v => this._esc(v)).join(', ')} — peso ${crit.peso_analise}`);
      if (crit.participacao && crit.participacao !== 'Não se aplica')
        critLinhas.push(`Participação: ${this._esc(crit.participacao)} — peso ${crit.peso_participacao}`);
      if (crit.cursos_crit && crit.cursos_crit !== 'Não se aplica')
        critLinhas.push(`Cursos: ${this._esc(crit.cursos_crit)} — peso ${crit.peso_cursos_crit}`);
      if (crit.habilidades && crit.habilidades !== 'Não se aplica')
        critLinhas.push(`Habilidades: ${this._esc(crit.habilidades)} — peso ${crit.peso_habilidades}`);
      if (crit.horario && crit.horario !== 'Não se aplica')
        critLinhas.push(`Horário: ${this._esc(crit.horario)} — peso ${crit.peso_horario}`);
      if (crit.outrosCriterios)
        critLinhas.push(this._esc(crit.outrosCriterios));
    }

    if (!linhas.length && !critLinhas.length) return '';

    return `
    <div style="border-top:1px solid var(--bd);margin-top:14px;padding-top:12px">
      ${linhas.length ? `
        <div style="font-size:12px;font-weight:700;color:var(--g4);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">
          📋 Requisitos para participação
        </div>
        ${linhas.map(l => `<div style="font-size:12px;color:var(--g5);margin-bottom:4px;line-height:1.5">• ${l}</div>`).join('')}
      ` : ''}
      ${critLinhas.length ? `
        <div style="font-size:12px;font-weight:700;color:var(--g4);margin:10px 0 6px;text-transform:uppercase;letter-spacing:.5px">
          🏆 Critérios de seleção
        </div>
        ${critLinhas.map(l => `<div style="font-size:12px;color:var(--g5);margin-bottom:4px;line-height:1.5">• ${l}</div>`).join('')}
      ` : ''}
    </div>`;
  },

  render(body) {
    const abertos = SOA.editais.filter(e =>
      e.status === 'Publicado' && (!e.deleted_at || e.deleted_at === '')
    );

    let html = `
      <div class="ph">
        <div>
          <h1>Editais Abertos</h1>
          <p>${abertos.length} edital(is) disponível(is)</p>
        </div>
      </div>`;

    if (abertos.length === 0) {
      html += `<div class="card">${emptyState('📋', 'Nenhum edital aberto no momento.')}</div>`;
    } else {
      abertos.forEach(e => {
        const vigIni    = AlunoEditais._fmtData(e.vigIni);
        const vigFim    = AlunoEditais._fmtData(e.vigFim);
        const titulo    = AlunoEditais._esc(e.titulo);
        const descricao = AlunoEditais._esc(e.descricao);
        const bolsaVal  = AlunoEditais._esc(e.bolsaValor || '—');
        const bolsaCH   = AlunoEditais._esc(e.bolsaCH   || '—');
        const vagas     = AlunoEditais._esc(e.vagas      || '—');
        const edId      = AlunoEditais._esc(e.id);

        html += `
          <div class="card" style="padding:20px;margin-bottom:12px">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
              <div style="flex:1">
                <div style="display:flex;gap:8px;margin-bottom:8px">
                  ${segBadge(e.segmento)} ${statusBadge(e.status)}
                </div>
                <div style="font-family:'Sora',sans-serif;font-size:16px;font-weight:700;margin-bottom:6px">${titulo}</div>
                <div style="font-size:12px;color:var(--g4);margin-bottom:8px">
                  ${vigIni} – ${vigFim} · R$ ${bolsaVal}/mês · ${bolsaCH}h/sem · ${vagas} vagas
                </div>
                <div style="font-size:13px;color:var(--g5);line-height:1.6">${descricao}</div>
              </div>
              <button class="btn bp" onclick="AlunoEditais.inscrever('${edId}', ${JSON.stringify(e.titulo)})">+ Inscrever-se</button>
            </div>
          </div>`;
      });
    }
    body.innerHTML = html;
  },

  inscrever(editalId, editalNome) {
    const projetos = SOA.projetos.filter(p => p.editalId === editalId);
    if (projetos.length === 0) {
      Modal.open('Inscrição indisponível', AlunoEditais._esc(editalNome),
        `<p style="color:var(--g5);font-size:14px;line-height:1.6">
          Nenhum projeto cadastrado para este edital ainda.<br>Aguarde o cadastro pelo administrador.
        </p>`);
      return;
    }

    window._projetosInsc = projetos;

    const optsProj = projetos.map(p =>
      `<option value="${AlunoEditais._esc(p.id)}" data-coord="${AlunoEditais._esc(p.coordEmail)}">${AlunoEditais._esc(p.titulo)}</option>`
    ).join('');

    // Requisitos do primeiro projeto
    const reqHtml = AlunoEditais._renderRequisitosAluno(projetos[0]);

    Modal.open(`Inscrição — ${AlunoEditais._esc(editalNome)}`, 'Preencha os dados abaixo',
      `<div style="display:flex;flex-direction:column;gap:14px">
        <div class="fl"><label>Projeto</label>
          <select class="sel" id="ins-projeto"
            onchange="AlunoEditais._onProjetoChange(this)">${optsProj}</select></div>
        <div id="ins-req-wrap">${reqHtml}</div>
        <div class="fl"><label>Modalidade</label>
          <select class="sel" id="ins-modalidade">
            <option>Bolsista</option><option>Voluntário</option>
          </select></div>
        <div class="fl"><label>Carta de motivação (opcional)</label>
          <textarea class="inp" id="ins-motivacao" placeholder="Descreva seu interesse..."></textarea></div>
        <div class="fl"><label>Link Lattes (opcional)</label>
          <input class="inp" id="ins-lattes" type="url" placeholder="https://lattes.cnpq.br/..."></div>
      </div>`,
      `<button class="btn bo" onclick="Modal.close()">Cancelar</button>
       <button class="btn bp" onclick="AlunoEditais.confirmar(${JSON.stringify(editalId)}, ${JSON.stringify(editalNome)})">✓ Enviar inscrição</button>`
    );
  },

  _onProjetoChange(sel) {
    const proj = (window._projetosInsc || []).find(p => p.id === sel.value);
    const wrap = document.getElementById('ins-req-wrap');
    if (wrap) wrap.innerHTML = proj ? AlunoEditais._renderRequisitosAluno(proj) : '';
  },

  async confirmar(editalId, editalNome) {
    const sel         = document.getElementById('ins-projeto');
    const projetoId   = sel.value;
    const projetoNome = sel.options[sel.selectedIndex].text;
    const proj        = (window._projetosInsc || []).find(p => p.id === projetoId);

    const lattes = val('ins-lattes');
    if (lattes && !/^https?:\/\/.+/.test(lattes)) {
      toast('⚠ Link Lattes inválido. Use uma URL completa.');
      return;
    }

    const dados = {
      editalId, editalNome, projetoId, projetoNome,
      coordEmail: proj ? proj.coordEmail : '',
      modalidade: val('ins-modalidade'),
      motivacao:  val('ins-motivacao'),
      lattes
    };
    Modal.close();
    toast('⏳ Enviando inscrição...');
    try {
      const res = await API.salvarInscricao(dados);
      SOA.inscricoes.push(res.nova);
      toast('✓ Inscrição enviada! Aguarde o resultado.');
      AlunoRouter.ir('inscricoes');
    } catch(e) { toast('❌ ' + e.message); }
  }
};
