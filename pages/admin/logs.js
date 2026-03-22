// pages/admin/logs.js

const AdminLogs = {
  render(app) {
    const lista = SOA.logs;
    let html = `<div class="ph"><div><h1>Auditoria</h1><p>Últimas ${lista.length} ações</p></div></div>`;
    if (lista.length === 0) {
      html += `<div class="card">${emptyState('📊', 'Nenhum log ainda.')}</div>`;
    } else {
      const rows = lista.map(l => [
        `<span style="font-size:11px;white-space:nowrap">${l.timestamp}</span>`,
        `<span style="font-size:12px">${l.email}</span>`,
        statusBadge(l.perfil),
        `<span style="font-size:12px">${l.acao}</span>`,
        `<span class="b bn">${l.modulo}</span>`,
        `<span style="font-size:12px;color:var(--g5)">${l.detalhe}</span>`
      ]);
      html += `<div class="card">${buildTable(
        ['Data/Hora','Usuário','Perfil','Ação','Módulo','Detalhe'], rows
      )}</div>`;
    }
    app.innerHTML = html;
  }
};
