// pages/coordenador/assiduidade.js

const CoordAssiduidade = {
  _buffer: {},

  render(body) {
    const aprovados = SOA.inscricoes.filter(i => i.status === 'Aprovado');
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                   'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const mesAtual = meses[new Date().getMonth()] + ' ' + new Date().getFullYear();
    this._buffer = {};

    let rows = '';
    if (aprovados.length === 0) {
      rows = `<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--g4)">
        Nenhum bolsista aprovado vinculado ainda.</td></tr>`;
    } else {
      rows = aprovados.map((i, idx) => `
        <tr>
          <td><div class="tm">${i.alunoNome}</div></td>
          <td>${i.projetoNome}</td>
          <td>
            <div style="display:flex;gap:6px">
              ${['P','F','J'].map(v => `
                <button class="ab" id="ass-${idx}-${v}"
                  onclick="CoordAssiduidade.set(${idx},'${v}','${i.id}','${i.alunoNome}','${i.projetoNome}')"
                  style="min-width:34px">${v === 'P' ? '✓ P' : v === 'F' ? '✗ F' : 'J'}</button>
              `).join('')}
            </div>
          </td>
          <td><input class="inp" id="obs-${idx}" style="height:32px" placeholder="Observação..."></td>
        </tr>`
      ).join('');
    }

    body.innerHTML = `
    <div class="ph"><div><h1>Registrar Assiduidade</h1></div></div>
    <div class="card">
      <div class="ch"><h3>Mês de referência</h3></div>
      <div style="padding:16px 20px;display:flex;align-items:center;gap:12px">
        <select class="sel" id="mes-ref" style="max-width:200px">
          ${meses.map(m => {
            const v = m + ' ' + new Date().getFullYear();
            return `<option${v === mesAtual ? ' selected' : ''}>${v}</option>`;
          }).join('')}
        </select>
        <button class="btn bp" onclick="CoordAssiduidade.salvar()">💾 Salvar registros</button>
      </div>
      <table>
        <thead><tr><th>Aluno</th><th>Projeto</th><th>Frequência</th><th>Observação</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="font-size:12px;color:var(--g4);margin-top:8px">P = Presente · F = Falta · J = Justificado</div>`;
  },

  set(idx, val, inscId, nome, projeto) {
    ['P','F','J'].forEach(v => {
      const btn = document.getElementById(`ass-${idx}-${v}`);
      if (btn) { btn.style.background = ''; btn.style.borderColor = ''; btn.style.color = ''; }
    });
    const btn = document.getElementById(`ass-${idx}-${val}`);
    if (btn) {
      const cores = { P:['#dcfce7','#22c55e','#166534'], F:['#fee2e2','#ef4444','#991b1b'], J:['#fef9c3','#f4b61d','#854d0e'] };
      const [bg, border, color] = cores[val];
      btn.style.background = bg; btn.style.borderColor = border; btn.style.color = color;
    }
    this._buffer[idx] = { inscricaoId: inscId, alunoNome: nome, projetoNome: projeto, presenca: val };
  },

  async salvar() {
    const mes = document.getElementById('mes-ref').value;
    const keys = Object.keys(this._buffer);
    if (keys.length === 0) { toast('⚠ Selecione P, F ou J para pelo menos um bolsista.'); return; }
    toast('⏳ Salvando...');
    try {
      await Promise.all(keys.map(idx => {
        const d = { ...this._buffer[idx], mes,
          observacao: (document.getElementById('obs-' + idx) || {}).value || '' };
        return API.salvarAssiduidade(d).then(res => {
          SOA.assiduidade.push({ ...d, id: res.id, coordEmail: SOA.perfil.email });
        });
      }));
      toast(`✓ Assiduidade de ${mes} salva!`);
    } catch(e) { toast('❌ ' + e.message); }
  }
};
