// js/app.js — Inicialização e roteamento principal

// ── Estado global ─────────────────────────────────
const SOA = {
  perfil: null,
  editais: [],
  projetos: [],
  inscricoes: [],
  assiduidade: [],
  logs: []
};

// ── Boot ──────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  try {
    setLoadMsg('Conectando ao servidor...');
    const data = await API.carregar();

    // Salva tudo em memória
    SOA.perfil      = data.perfil;
    SOA.editais     = data.editais     || [];
    SOA.projetos    = data.projetos    || [];
    SOA.inscricoes  = data.inscricoes  || [];
    SOA.assiduidade = data.assiduidade || [];
    SOA.logs        = data.logs        || [];

    setLoadMsg('Iniciando interface...');
    iniciar();
    hideLoading();

  } catch (e) {
    setLoadMsg('❌ Erro ao carregar: ' + e.message);
  }
});

function setLoadMsg(msg) {
  document.getElementById('load-sub').textContent = msg;
}

function hideLoading() {
  const l = document.getElementById('loading');
  l.classList.add('hide');
  setTimeout(() => l.style.display = 'none', 400);
}

// ── Iniciar por perfil ────────────────────────────
function iniciar() {
  const { perfil, nome } = SOA.perfil;
  const av = initials(nome);

  if (perfil === 'admin') {
    document.getElementById('admin-av').textContent   = av;
    document.getElementById('admin-nome').textContent = nome;
    Sidebar.render();
    bindNav('admin-topnav', AdminRouter.ir);
    AdminRouter.ir('editais');
    showShell('admin');

  } else if (perfil === 'coordenador') {
    document.getElementById('coord-av').textContent   = av;
    document.getElementById('coord-nome').textContent = nome;
    bindNav('coord-topnav', CoordRouter.ir);
    CoordRouter.ir('home');
    showShell('coordenador');

  } else {
    document.getElementById('aluno-av').textContent   = av;
    document.getElementById('aluno-nome').textContent = nome;
    bindNav('aluno-topnav', AlunoRouter.ir);
    AlunoRouter.ir('editais');
    showShell('aluno');
  }
}

function showShell(perfil) {
  document.querySelectorAll('.shell').forEach(s => s.classList.remove('active'));
  document.getElementById('shell-' + perfil).classList.add('active');
}

function bindNav(navId, routerFn) {
  document.querySelectorAll(`#${navId} button`).forEach(btn => {
    btn.addEventListener('click', () => routerFn(btn.dataset.page));
  });
}

// ── Routers ───────────────────────────────────────
const AdminRouter = {
  ir(page) {
    activateNav('admin-topnav', page);
    Sidebar.activate(page);
    const app = document.getElementById('app');
    const pages = {
      'editais':     () => AdminEditais.render(app),
      'cad-edital':  () => AdminEditais.form(app),
      'projetos':    () => AdminProjetos.render(app),
      'cad-projeto': () => AdminProjetos.form(app),
      'inscricoes':  () => AdminInscricoes.render(app),
      'assiduidade': () => AdminAssiduidade.render(app),
      'logs':        () => AdminLogs.render(app)
    };
    if (pages[page]) pages[page]();
  }
};

const CoordRouter = {
  ir(page) {
    activateNav('coord-topnav', page);
    const body = document.getElementById('coord-body');
    const pages = {
      'home':        () => CoordHome.render(body),
      'projetos':    () => CoordHome.renderProjetos(body),
      'inscricoes':  () => CoordInscricoes.render(body),
      'assiduidade': () => CoordAssiduidade.render(body)
    };
    if (pages[page]) pages[page]();
  }
};

const AlunoRouter = {
  ir(page) {
    activateNav('aluno-topnav', page);
    const body = document.getElementById('aluno-body');
    const pages = {
      'editais':     () => AlunoEditais.render(body),
      'inscricoes':  () => AlunoInscricoes.render(body),
      'assiduidade': () => AlunoAssiduidade.render(body)
    };
    if (pages[page]) pages[page]();
  }
};
