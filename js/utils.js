// js/utils.js — Funções utilitárias compartilhadas

// ── Toast ────────────────────────────────────────
function toast(msg, dur = 2800) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), dur);
}

// ── Segmento — cores ─────────────────────────────
const SEG_COLOR = {
  Pesquisa:     'var(--pesq)',
  Ensino:       'var(--ensi)',
  'Extensão':   'var(--exte)',
  Indissociável:'var(--indi)'
};
const SEG_BG = {
  Pesquisa:     '#e8f4fc',
  Ensino:       '#f0f7dc',
  'Extensão':   '#fffbeb',
  Indissociável:'#f3e8ff'
};

function segBadge(seg) {
  const c = SEG_COLOR[seg] || '#888';
  const bg = SEG_BG[seg] || '#f1f5f5';
  return `<span class="b" style="background:${bg};color:${c}">${seg}</span>`;
}

// ── Status badge ─────────────────────────────────
const STATUS_CLASS = {
  Publicado: 'bv', Ativo: 'bv', Aprovado: 'bv', Presente: 'bv',
  Pendente:  'ba', Rascunho: 'bn',
  Reprovado: 'br', Suspenso: 'br', Falta: 'br',
  Encerrado: 'bn', Concluído: 'bb', admin: 'bv',
  coordenador: 'bb', aluno: 'bn'
};

function statusBadge(s) {
  return `<span class="b ${STATUS_CLASS[s] || 'bn'}">${s}</span>`;
}

// ── Avatar ───────────────────────────────────────
function initials(nome) {
  return nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

// ── Empty state ──────────────────────────────────
function emptyState(ico, msg) {
  return `<div class="empty-state"><div class="ico">${ico}</div><p>${msg}</p></div>`;
}

// ── Tabela genérica ──────────────────────────────
function buildTable(headers, rows) {
  if (rows.length === 0) return '';
  const thead = headers.map(h => `<th>${h}</th>`).join('');
  const tbody = rows.map(cells =>
    `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`
  ).join('');
  return `<div style="overflow-x:auto">
    <table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
  </div>`;
}

// ── Formulário helpers ───────────────────────────
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function selectOpts(lista, selecionado = '') {
  return lista.map(o =>
    `<option${o === selecionado ? ' selected' : ''}>${o}</option>`
  ).join('');
}

// ── Navegação genérica ───────────────────────────
function activateNav(navId, page) {
  document.querySelectorAll(`#${navId} button`).forEach(b => {
    b.classList.toggle('on', b.dataset.page === page);
  });
}
