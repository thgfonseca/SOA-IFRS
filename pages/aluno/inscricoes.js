// pages/aluno/inscricoes.js

const AlunoInscricoes = {

  _esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
                        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  render(body) {
    window._inscMap = {};
    const lista = SOA.inscricoes;
    let html = `<div class="ph"><div><h1>Minhas Inscrições</h1></div></div>`;
    if (lista.length === 0) {
      html += `<div class="card">${emptyState('✍', 'Você ainda não se inscreveu em nenhum projeto.')}</div>`;
    } else {
      lista.forEach((insc, idx) => {
        window._inscMap[idx] = insc;
        html += this._renderCard(insc, idx);
      });
    }
    body.innerHTML = html;
  },

  _statusColor(insc) {
    const e = insc.etapa || '';
    const s = insc.status || '';
    if (s === 'Aprovado')               return 'bv';
    if (s === 'Aprovado suplente')      return 'bb';
    if (s === 'Reprovado')              return 'br';
    if (s === 'Homologada')             return 'bv';
    if (s === 'Homologada por recurso') return 'bv';
    if (s === 'Não homologada')         return 'br';
    if (s === 'Recurso indeferido')     return 'br';
    if (s === 'Pendente')               return 'ba';
    return 'bn';
  },

  _renderCard(insc, idx) {
    const podeRecorrer = insc.status === 'Não homologada'
      && insc.etapa !== 'recurso'
      && insc.etapa !== 'concluido';

    const recursoBtn = podeRecorrer
      ? `<button class="btn bo" style="margin-top:12px;font-size:13px"
           data-idx="${idx}" onclick="AlunoInscricoes.abrirRecurso(this.dataset.idx)">
           ⚖ Entrar com recurso
         </button>`
      : '';

    return `
    <div class="card" style="margin-bottom:16px">
      <div class="ch" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <div>
          <div class="tm">${this._esc(insc.projetoNome)}</div>
          <div style="font-size:12px;color:var(--g5);margin-top:2px">${this._esc(insc.editalNome)}</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
          <span class="b bn">${this._esc(insc.modalidade)}</span>
          <span class="b ${this._statusColor(insc)}">${this._esc(insc.status)}</span>
        </div>
      </div>
      <div style="padding:0 24px 16px">
        ${this._renderTimeline(insc)}
        ${recursoBtn}
      </div>
    </div>`;
  },

  _renderTimeline(insc) {
    const steps = [];

    // 1. Candidatura
    steps.push({
      icon: '📝',
      label: 'Candidatura enviada',
      date: insc.criadoEm,
      detail: '',
      done: true
    });

    // 2. Homologação
    if (insc.homologadoEm) {
      const isOk = insc.status === 'Homologada' || insc.status === 'Homologada por recurso';
      let detail = `Decisão: <strong>${this._esc(insc.status)}</strong> por ${this._esc(insc.homologadoPor)}`;
      if (insc.justificativaHomolog)
        detail += `<br><span style="color:var(--g5)">${this._esc(insc.justificativaHomolog)}</span>`;
      steps.push({ icon: '🔍', label: 'Homologação', date: insc.homologadoEm, detail, done: true, ok: isOk });
    } else if (insc.etapa !== 'candidatura') {
      steps.push({ icon: '🔍', label: 'Homologação', date: '', detail: 'Aguardando análise...', done: false });
    }

    // 3. Recurso
    if (insc.recursoEm) {
      let detail = `Motivo: ${this._esc(insc.recursoMotivo)}`;
      if (insc.recursoDecisao) {
        const deferido = insc.recursoDecisao === 'deferir';
        detail += `<br>Decisão: <strong>${deferido ? 'Deferido' : 'Indeferido'}</strong>`;
        if (insc.recursoDecisaoEm) detail += ` em ${this._esc(insc.recursoDecisaoEm)}`;
        if (insc.recursoDecisaoPor) detail += ` por ${this._esc(insc.recursoDecisaoPor)}`;
      } else {
        detail += '<br><em style="color:var(--g5)">Aguardando decisão do coordenador...</em>';
      }
      steps.push({ icon: '⚖', label: 'Recurso', date: insc.recursoEm, detail, done: true });
    }

    // 4. Avaliação
    if (insc.avaliadoEm) {
      let detail = `Resultado: <strong>${this._esc(insc.resultado || insc.status)}</strong>`;
      if (insc.notaFinal) detail += ` — Nota: <strong>${this._esc(insc.notaFinal)}</strong>`;
      steps.push({ icon: '📊', label: 'Avaliação', date: insc.avaliadoEm, detail, done: true });
    } else if (insc.etapa === 'avaliacao') {
      steps.push({ icon: '📊', label: 'Avaliação', date: '', detail: 'Aguardando avaliação do coordenador...', done: false });
    }

    return `<div style="margin-top:12px;border-left:3px solid var(--bd);padding-left:16px;display:flex;flex-direction:column;gap:14px">
      ${steps.map(s => `
      <div style="position:relative">
        <div style="position:absolute;left:-22px;top:2px;width:14px;height:14px;border-radius:50%;
          background:${s.done ? (s.ok === false ? '#dc2626' : '#16a34a') : 'var(--bd)'};
          border:2px solid #fff;box-shadow:0 0 0 2px ${s.done ? (s.ok === false ? '#dc2626' : '#16a34a') : 'var(--bd)'}">
        </div>
        <div style="font-size:13px">
          <span style="font-weight:600">${s.icon} ${s.label}</span>
          ${s.date ? `<span style="color:var(--g5);margin-left:8px;font-size:12px">${this._esc(s.date)}</span>` : ''}
          ${s.detail ? `<div style="margin-top:3px;color:#374151">${s.detail}</div>` : ''}
        </div>
      </div>`).join('')}
    </div>`;
  },

  abrirRecurso(idxStr) {
    const idx  = parseInt(idxStr);
    const insc = window._inscMap[idx];
    if (!insc) return;

    // Remove any existing modal
    const old = document.getElementById('modal-recurso');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-recurso';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px';
    modal.innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:28px;max-width:480px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.2)">
        <h3 style="margin:0 0 8px">⚖ Entrar com Recurso</h3>
        <p style="font-size:13px;color:var(--g5);margin:0 0 16px">${this._esc(insc.projetoNome)}</p>
        <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px">
          Motivo do recurso <span style="color:#dc2626">*</span>
        </label>
        <textarea class="inp" id="recurso-motivo" rows="5"
          placeholder="Descreva detalhadamente o motivo pelo qual você contesta a não homologação..."
          style="margin-bottom:16px"></textarea>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="btn bo" onclick="document.getElementById('modal-recurso').remove()">Cancelar</button>
          <button class="btn bp" data-idx="${idx}" onclick="AlunoInscricoes.enviarRecurso(this.dataset.idx)">Enviar recurso</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById('recurso-motivo').focus();
  },

  async enviarRecurso(idxStr) {
    const idx   = parseInt(idxStr);
    const insc  = window._inscMap[idx];
    const motivo = document.getElementById('recurso-motivo')?.value?.trim() || '';
    if (!motivo) { toast('⚠ Informe o motivo do recurso.'); return; }
    toast('⏳ Enviando...');
    try {
      const res = await API.recorrerInscricao({ id: insc.id, motivo });
      const obj = SOA.inscricoes.find(x => x.id === insc.id);
      if (obj) {
        obj.etapa        = 'recurso';
        obj.recursoEm    = res.recursoEm;
        obj.recursoMotivo = motivo;
      }
      document.getElementById('modal-recurso')?.remove();
      toast('✓ Recurso enviado!');
      this.render(document.getElementById('aluno-body'));
    } catch(e) { toast('❌ ' + e.message); }
  }
};
