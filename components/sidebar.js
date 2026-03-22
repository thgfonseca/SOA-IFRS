// components/sidebar.js

const Sidebar = {
  items: [
    { group: 'Editais' },
    { id: 'editais',    label: 'Lista de editais',  ico: '📋' },
    { id: 'cad-edital', label: 'Cadastrar edital',  ico: '＋' },
    { sep: true },
    { group: 'Ações' },
    { id: 'projetos',    label: 'Lista de ações',   ico: '📁' },
    { id: 'cad-projeto', label: 'Nova ação',        ico: '＋' },
    { sep: true },
    { group: 'Seleção' },
    { id: 'inscricoes',  label: 'Inscrições',       ico: '✍' },
    { sep: true },
    { group: 'Acompanhamento' },
    { id: 'assiduidade', label: 'Assiduidade',      ico: '✓' },
    { sep: true },
    { id: 'logs',        label: 'Auditoria',        ico: '📊' },
  ],

  render() {
    const sb = document.getElementById('admin-sidebar');
    sb.innerHTML = this.items.map(item => {
      if (item.group) return `<div class="sgrp">${item.group}</div>`;
      if (item.sep)   return `<div class="ssep"></div>`;
      return `<button class="si" id="si-${item.id}"
        onclick="AdminRouter.ir('${item.id}')">
        <span>${item.ico}</span>${item.label}
      </button>`;
    }).join('');
  },

  activate(page) {
    document.querySelectorAll('.si').forEach(s => s.classList.remove('on'));
    const el = document.getElementById('si-' + page);
    if (el) el.classList.add('on');
  }
};
