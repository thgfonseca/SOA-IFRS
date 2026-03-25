// pages/aluno/assiduidade.js

const AlunoAssiduidade = {
  render(body) {
    const lista = SOA.assiduidade;
    let html = `<div class="ph"><div><h1>Minha Assiduidade</h1></div></div>`;
    if (lista.length === 0) {
      html += `<div class="card">${emptyState('✓', 'Nenhum registro de assiduidade ainda.')}</div>`;
    } else {
      const rows = lista.map(a => [
        `<div class="tm">${a.projetoNome}</div>`,
        a.mes,
        statusBadge(a.presenca),
        `<span style="font-size:12px;color:var(--g5)">${a.observacao}</span>`
      ]);
      html += `<div class="card">${buildTable(['Projeto','Mês','Frequência','Observação'], rows)}</div>`;
    }
    body.innerHTML = html;
  }
};
