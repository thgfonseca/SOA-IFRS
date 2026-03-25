// pages/aluno/inscricoes.js

const AlunoInscricoes = {
  render(body) {
    const lista = SOA.inscricoes;
    let html = `<div class="ph"><div><h1>Minhas Inscrições</h1></div></div>`;
    if (lista.length === 0) {
      html += `<div class="card">${emptyState('✍', 'Você ainda não se inscreveu em nenhum projeto.')}</div>`;
    } else {
      const rows = lista.map(i => [
        `<span style="font-size:12px">${i.editalNome}</span>`,
        `<div class="tm">${i.projetoNome}</div>`,
        `<span class="b bn">${i.modalidade}</span>`,
        `<span style="font-size:12px">${i.criadoEm}</span>`,
        statusBadge(i.status)
      ]);
      html += `<div class="card">${buildTable(['Edital','Projeto','Modalidade','Data','Status'], rows)}</div>`;
    }
    body.innerHTML = html;
  }
};
