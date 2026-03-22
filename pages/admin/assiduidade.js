// pages/admin/assiduidade.js

const AdminAssiduidade = {
  render(app) {
    const lista = SOA.assiduidade;
    let html = `<div class="ph"><div><h1>Assiduidade</h1><p>${lista.length} registro(s)</p></div></div>`;
    if (lista.length === 0) {
      html += `<div class="card">${emptyState('✓', 'Nenhum registro de assiduidade ainda.')}</div>`;
    } else {
      const rows = lista.map(a => [
        `<div class="tm">${a.alunoNome}</div>`,
        a.projetoNome,
        a.mes,
        statusBadge(a.presenca),
        `<span style="font-size:12px;color:var(--g5)">${a.observacao}</span>`,
        `<span style="font-size:11px;color:var(--g4)">${a.registradoEm}</span>`
      ]);
      html += `<div class="card">${buildTable(
        ['Aluno','Projeto','Mês','Frequência','Observação','Registrado em'], rows
      )}</div>`;
    }
    app.innerHTML = html;
  }
};
