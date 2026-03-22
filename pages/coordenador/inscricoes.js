// pages/coordenador/inscricoes.js

const CoordInscricoes = {
  render(body) {
    const lista = SOA.inscricoes;
    let html = `<div class="ph"><div><h1>Inscrições</h1><p>${lista.length} inscrição(ões) nos seus projetos</p></div></div>`;
    if (lista.length === 0) {
      html += `<div class="card">${emptyState('✍', 'Nenhuma inscrição recebida ainda.')}</div>`;
    } else {
      const rows = lista.map(i => [
        `<div class="tm">${i.alunoNome}</div><div class="ts">${i.alunoEmail}</div>`,
        i.projetoNome,
        `<span class="b bn">${i.modalidade}</span>`,
        statusBadge(i.status),
        i.status === 'Pendente' ? `<div class="acts">
          <button class="ab" onclick="CoordInscricoes.avaliar('${i.id}','Aprovado')">✓ Aprovar</button>
          <button class="ab dg" onclick="CoordInscricoes.avaliar('${i.id}','Reprovado')">✕ Reprovar</button>
        </div>` : ''
      ]);
      html += `<div class="card">${buildTable(['Aluno','Projeto','Modalidade','Status','Ações'], rows)}</div>`;
    }
    body.innerHTML = html;
  },

  async avaliar(id, resultado) {
    toast('⏳ Salvando...');
    try {
      await API.avaliarInscricao(id, resultado);
      const i = SOA.inscricoes.find(x => x.id === id);
      if (i) i.status = resultado;
      toast(`✓ ${resultado}!`);
      this.render(document.getElementById('coord-body'));
    } catch(e) { toast('❌ ' + e.message); }
  }
};
