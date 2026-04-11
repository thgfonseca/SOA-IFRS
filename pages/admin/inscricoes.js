// pages/admin/inscricoes.js

const AdminInscricoes = {

  _filtro: 'Todos',
  _expanded: {},

  _esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
                        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  render(app) {
    window._inscMap = {};
    this._expanded = {};
    const lista = SOA.inscricoes;

    // ── Summary stats ─────────────────────────────
    const total      = lista.length;
    const nPendente  = lista.filter(i => i.etapa === 'candidatura' || (!i.etapa && i.status === 'Pendente')).length;
    const nRecurso   = lista.filter(i => i.etapa === 'recurso').length;
    const nAvaliacao = lista.filter(i => i.etapa === 'avaliacao').length;
    const nConcluido = lista.filter(i => i.etapa === 'concluido').length;

    const stat = (label, val, cor) =>
      `<div style="background:#fff;border:1px solid var(--bd);border-radius:10px;padding:14px 20px;text-align:center;min-width:110px">
        <div style="font-size:24px;font-weight:700;color:${cor}">${val}</div>
        <div style="font-size:12px;color:var(--g5);margin-top:2px">${label}</div>
      </div>`;

    // ── Filtros ───────────────────────────────────
    const FILTROS = ['Todos','Pendente','Homologada','Não homologada','Em recurso','Aprovado','Reprovado'];
    const filtrosBtns = FILTROS.map(f => {
      const active = this._filtro === f ? ' on' : '';
      return `<button class="btn bo${active}" style="font-size:12px;padding:4px 12px"
        data-f="${f}" onclick="AdminInscricoes._setFiltro(this.dataset.f)">${f}</button>`;
    }).join('');

    // ── Filtragem ─────────────────────────────────
    let filtrada = lista;
    if (this._filtro !== 'Todos') {
      if (this._filtro === 'Em recurso') filtrada = lista.filter(i => i.etapa === 'recurso');
      else filtrada = lista.filter(i => i.status === this._filtro);
    }

    // ── Linhas da tabela ──────────────────────────
    filtrada.forEach((insc, idx) => { window._inscMap[idx] = insc; });

    const rows = filtrada.map((insc, idx) => {
      const exp = this._expanded[insc.id];
      const timeline = exp ? this._renderTimeline(insc) : '';
      return `
      <tr style="cursor:pointer;${exp ? 'background:#f8fafc' : ''}"
          data-idx="${idx}" onclick="AdminInscricoes._toggleRow(this.dataset.idx, '${this._esc(insc.id)}')">
        <td>
          <div class="tm">${this._esc(insc.alunoNome)}</div>
          <div class="ts">${this._esc(insc.alunoEmail)}</div>
        </td>
        <td>${this._esc(insc.projetoNome)}</td>
        <td style="font-size:12px;color:var(--g5)">${this._esc(insc.editalNome)}</td>
        <td><span class="b bn">${this._esc(insc.modalidade)}</span></td>
        <td>${statusBadge(insc.status)}</td>
        <td><span class="b bn" style="font-size:11px">${this._esc(insc.etapa || '—')}</span></td>
        <td style="font-weight:600">${insc.notaFinal || '—'}</td>
        <td style="font-size:12px;color:var(--g5)">${insc.criadoEm || '—'}</td>
        <td style="font-size:18px;color:var(--g5);text-align:center">${exp ? '▲' : '▼'}</td>
      </tr>
      ${exp ? `<tr><td colspan="9" style="padding:0 16px 16px;background:#f8fafc">${timeline}</td></tr>` : ''}`;
    }).join('');

    const tableHtml = filtrada.length === 0
      ? emptyState('🔍', 'Nenhuma inscrição encontrada para o filtro selecionado.')
      : `<div style="overflow-x:auto"><table>
          <thead><tr>
            <th>Aluno</th><th>Projeto</th><th>Edital</th><th>Modalidade</th>
            <th>Status</th><th>Etapa</th><th>Nota</th><th>Data</th><th></th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table></div>`;

    app.innerHTML = `
      <div class="ph"><div><h1>Inscrições</h1><p>${total} inscrição(ões) no sistema</p></div></div>

      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px">
        ${stat('Total', total, '#374151')}
        ${stat('Pendentes', nPendente, '#d97706')}
        ${stat('Em recurso', nRecurso, '#1d4ed8')}
        ${stat('Em avaliação', nAvaliacao, '#7c3aed')}
        ${stat('Concluídos', nConcluido, '#16a34a')}
      </div>

      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">
        ${filtrosBtns}
      </div>

      <div class="card">${tableHtml}</div>`;
  },

  _setFiltro(f) {
    this._filtro = f;
    this._expanded = {};
    this.render(document.getElementById('app'));
  },

  _toggleRow(idxStr, id) {
    this._expanded[id] = !this._expanded[id];
    this.render(document.getElementById('app'));
  },

  _renderTimeline(insc) {
    const steps = [];

    // 1. Candidatura
    steps.push({
      icon: '📝', label: 'Candidatura enviada', date: insc.criadoEm,
      detail: `Aluno: ${insc.alunoEmail} | Modalidade: ${insc.modalidade}`,
      color: '#16a34a'
    });

    // 2. Homologação
    if (insc.homologadoEm) {
      const isOk = insc.status === 'Homologada' || insc.status === 'Homologada por recurso';
      let detail = `Decisão: <strong>${this._esc(insc.status)}</strong> por ${this._esc(insc.homologadoPor)}`;
      if (insc.justificativaHomolog)
        detail += ` | Justificativa: ${this._esc(insc.justificativaHomolog)}`;
      steps.push({ icon: '🔍', label: 'Homologação', date: insc.homologadoEm, detail, color: isOk ? '#16a34a' : '#dc2626' });
    }

    // 3. Recurso
    if (insc.recursoEm) {
      let detail = `Motivo: ${this._esc(insc.recursoMotivo)}`;
      steps.push({ icon: '⚖', label: 'Recurso enviado pelo aluno', date: insc.recursoEm, detail, color: '#1d4ed8' });
    }

    // 4. Decisão do recurso
    if (insc.recursoDecisaoEm) {
      const deferido = insc.recursoDecisao === 'deferir';
      const detail = `Decisão: <strong>${deferido ? 'Deferido' : 'Indeferido'}</strong> por ${this._esc(insc.recursoDecisaoPor)}`;
      steps.push({ icon: deferido ? '✅' : '❌', label: 'Decisão do recurso', date: insc.recursoDecisaoEm, detail, color: deferido ? '#16a34a' : '#dc2626' });
    }

    // 5. Avaliação
    if (insc.avaliadoEm) {
      let detail = `Resultado: <strong>${this._esc(insc.resultado || insc.status)}</strong>`;
      if (insc.notaFinal) detail += ` | Nota final: <strong>${this._esc(insc.notaFinal)}</strong>`;
      if (insc.observacao) detail += ` | Obs: ${this._esc(insc.observacao)}`;
      steps.push({ icon: '📊', label: 'Avaliação concluída', date: insc.avaliadoEm, detail, color: '#7c3aed' });
    }

    return `<div style="border-left:3px solid var(--bd);padding-left:16px;display:flex;flex-direction:column;gap:12px;margin-top:4px">
      ${steps.map(s => `
      <div style="position:relative">
        <div style="position:absolute;left:-22px;top:2px;width:14px;height:14px;border-radius:50%;
          background:${s.color};border:2px solid #fff;box-shadow:0 0 0 2px ${s.color}"></div>
        <div style="font-size:13px">
          <span style="font-weight:600">${s.icon} ${s.label}</span>
          ${s.date ? `<span style="color:var(--g5);margin-left:8px;font-size:12px">${this._esc(s.date)}</span>` : ''}
          ${s.detail ? `<div style="margin-top:2px;color:#374151;font-size:12px">${s.detail}</div>` : ''}
        </div>
      </div>`).join('')}
    </div>`;
  }
};
