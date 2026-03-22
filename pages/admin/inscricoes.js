// pages/admin/inscricoes.js

const AdminInscricoes = {
  render(app) {
    const lista = SOA.inscricoes;
    let html = `<div class="ph">
      <div><h1>Inscrições</h1><p>${lista.length} inscrição(ões)</p></div>
    </div>`;
    if (lista.length === 0) {
      html += `<div class="card">${emptyState('✍', 'Nenhuma inscrição ainda.')}</div>`;
    } else {
      const rows = lista.map(i => [
        `<div class="tm">${i.alunoNome}</div><div class="ts">${i.alunoEmail}</div>`,
        i.projetoNome,
        `<span style="font-size:12px">${i.editalNome}</span>`,
        `<span class="b bn">${i.modalidade}</span>`,
        `<span style="font-size:12px">${i.criadoEm}</span>`,
        statusBadge(i.status),
        i.status === 'Pendente' ? `<div class="acts">
          <button class="ab" onclick="AdminInscricoes.avaliar('${i.id}','Aprovado')">✓ Aprovar</button>
          <button class="ab dg" onclick="AdminInscricoes.avaliar('${i.id}','Reprovado')">✕ Reprovar</button>
        </div>` : ''
      ]);
      html += `<div class="card">${buildTable(
        ['Aluno','Projeto','Edital','Modalidade','Data','Status','Ações'], rows
      )}</div>`;
    }
    app.innerHTML = html;
  },

  async avaliar(id, resultado) {
    toast('⏳ Salvando...');
    try {
      await API.avaliarInscricao(id, resultado);
      const i = SOA.inscricoes.find(x => x.id === id);
      if (i) i.status = resultado;
      toast(`✓ ${resultado}!`);
      this.render(document.getElementById('app'));
    } catch(e) { toast('❌ ' + e.message); }
  }
};
