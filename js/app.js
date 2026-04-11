// js/app.js — Login via Apps Script OAuth

const SOA = {
  perfil: null,
  editais: [], projetos: [], inscricoes: [], assiduidade: [], logs: []
};

window.addEventListener('DOMContentLoaded', () => {
  // Verifica se voltou do login com token na URL
  const params = new URLSearchParams(window.location.search);
  const token  = params.get('token');

  if (token) {
    // Salva token e limpa a URL
    sessionStorage.setItem('soa_token', token);
    history.replaceState(null, '', window.location.pathname);
    carregar(token);
    return;
  }

  // Verifica token salvo
  const saved = sessionStorage.getItem('soa_token');
  if (saved) {
    carregar(saved);
    return;
  }

  // Sem token — mostra login
  mostrarLogin();
});

// ── Tela de login ──────────────────────────────────
function mostrarLogin(msg) {
  const loginURL = CONFIG.LOGIN_URL + '?action=login';

  document.getElementById('loading').innerHTML = `
    <div style="text-align:center;padding:20px;max-width:400px">
      <div class="logo-big" style="margin:0 auto 20px">S</div>
      <div class="load-txt">SOA — IFRS Campus Rio Grande</div>
      <div class="load-sub" style="margin-bottom:24px">Sistema de Organização de Ações</div>
      ${msg ? `<div style="background:#fee2e2;color:#991b1b;padding:10px 16px;
        border-radius:8px;font-size:13px;margin-bottom:20px;line-height:1.6">${msg}</div>` : ''}
      <button onclick="window.top.location.href='${loginURL}'"
        style="display:inline-flex;align-items:center;gap:12px;
               background:#fff;color:#1a1a2e;padding:14px 28px;
               border-radius:8px;font-family:Inter,sans-serif;
               font-size:15px;font-weight:500;cursor:pointer;
               border:1.5px solid #e5e7eb;box-shadow:0 2px 8px rgba(0,0,0,.1)">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Entrar com Google Workspace
      </button>
      <div style="margin-top:16px;font-size:12px;color:#6b7280">
        Use sua conta @riogrande.ifrs.edu.br
      </div>
    </div>`;
}

// ── Carrega dados ─────────────────────────────────
async function carregar(token) {
  try {
    setLoadMsg('Carregando dados...');
    const data = await API.carregar(token);

    if (!data.ok) {
      sessionStorage.removeItem('soa_token');
      mostrarLogin(data.erro || 'Sessão expirada. Faça login novamente.');
      return;
    }

    SOA.perfil      = data.perfil;
    SOA.master      = data.master || false;
    SOA.token       = data.token || token;
    SOA.editais     = data.editais     || [];
    SOA.projetos    = data.projetos    || [];
    SOA.inscricoes  = data.inscricoes  || [];
    SOA.assiduidade = data.assiduidade || [];
    SOA.logs        = data.logs        || [];

    iniciarInterface();
    if (SOA.master) _renderMasterBar(SOA.perfil.perfil);
    hideLoading();
  } catch(e) {
    sessionStorage.removeItem('soa_token');
    mostrarLogin('❌ Erro ao carregar: ' + e.message);
  }
}

// ── Interface ─────────────────────────────────────
function iniciarInterface() {
  const { perfil, nome } = SOA.perfil;
  const av = initials(nome);

  if (perfil === 'admin') {
    document.getElementById('admin-av').textContent   = av;
    document.getElementById('admin-nome').textContent = nome;
    Sidebar.render();
    bindNav('admin-topnav', p => AdminRouter.ir(p));
    AdminRouter.ir('editais');
    showShell('admin');
  } else if (perfil === 'coordenador') {
    document.getElementById('coord-av').textContent   = av;
    document.getElementById('coord-nome').textContent = nome;
    bindNav('coord-topnav', p => CoordRouter.ir(p));
    CoordRouter.ir('home');
    showShell('coordenador');
  } else {
    document.getElementById('aluno-av').textContent   = av;
    document.getElementById('aluno-nome').textContent = nome;
    bindNav('aluno-topnav', p => AlunoRouter.ir(p));
    AlunoRouter.ir('editais');
    showShell('aluno');
  }
}

function logout() {
  sessionStorage.removeItem('soa_token');
  window.location.reload();
}

function showShell(p) {
  document.querySelectorAll('.shell').forEach(s => s.classList.remove('active'));
  document.getElementById('shell-' + p).classList.add('active');
}
function bindNav(navId, fn) {
  document.querySelectorAll(`#${navId} button`).forEach(b => {
    b.addEventListener('click', () => fn(b.dataset.page));
  });
}
function setLoadMsg(msg) {
  const e = document.getElementById('load-sub');
  if (e) e.textContent = msg;
}
function hideLoading() {
  const l = document.getElementById('loading');
  l.classList.add('hide');
  setTimeout(() => l.style.display = 'none', 400);
}

const AdminRouter = {
  ir(page) {
    activateNav('admin-topnav', page); Sidebar.activate(page);
    const app = document.getElementById('app');
    const p = {
      editais:       () => AdminEditais.render(app),
      'cad-edital':  () => AdminCadEdital.render(app),
      projetos:      () => AdminProjetos.render(app),
      'cad-projeto': () => AdminProjetos.form(app),
      inscricoes:    () => AdminInscricoes.render(app),
      assiduidade:   () => AdminAssiduidade.render(app),
      logs:          () => AdminLogs.render(app)
    };
    if (p[page]) p[page]();
  }
};
const CoordRouter = {
  ir(page, extra) {
    activateNav('coord-topnav', page);
    const b = document.getElementById('coord-body');
    const p = {
      home:        () => CoordHome.render(b),
      projetos:    () => CoordHome.renderProjetos(b),
      inscricoes:  () => CoordInscricoes.render(b),
      assiduidade: () => CoordAssiduidade.render(b),
      requisitos:  () => {
        const proj = SOA.projetos.find(x => x.id === extra);
        if (proj) CoordRequisitos.form(b, proj);
        else CoordHome.renderProjetos(b);
      }
    };
    if (p[page]) p[page]();
  }
};
const AlunoRouter = {
  ir(page, extra) {
    activateNav('aluno-topnav', page);
    const b = document.getElementById('aluno-body');
    const p = {
      editais:     () => AlunoEditais.render(b),
      inscricoes:  () => AlunoInscricoes.render(b),
      assiduidade: () => AlunoAssiduidade.render(b),
      projetos:    () => AlunoProjetosEdital.render(b, extra)
    };
    if (p[page]) p[page]();
  }
};

// ── Barra de troca de perfil (somente usuário master) ──
function _renderMasterBar(perfilAtual) {
  const old = document.getElementById('master-bar');
  if (old) old.remove();

  const bar = document.createElement('div');
  bar.id = 'master-bar';
  bar.style.cssText = [
    'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:9999',
    'background:#0f172a;border-radius:40px;padding:6px 8px',
    'display:flex;align-items:center;gap:4px',
    'box-shadow:0 4px 24px rgba(0,0,0,.45)',
    'font-family:Inter,sans-serif'
  ].join(';');

  const perfis = [
    { id:'admin',       label:'🔧 Admin',       cor:'#6366f1' },
    { id:'coordenador', label:'👨‍🏫 Coordenador', cor:'#10b981' },
    { id:'aluno',       label:'👨‍🎓 Aluno',        cor:'#3b82f6' }
  ];

  bar.innerHTML =
    `<span style="color:#64748b;font-size:11px;padding:0 8px;white-space:nowrap">Perfil:</span>` +
    perfis.map(({ id, label, cor }) => {
      const ativo = id === perfilAtual;
      return `<button onclick="_switchPerfil('${id}')"
        style="padding:6px 16px;border-radius:30px;border:none;cursor:pointer;
               font-size:12px;font-weight:600;transition:all .15s;
               background:${ativo ? cor : 'transparent'};
               color:${ativo ? '#fff' : '#94a3b8'}"
        onmouseover="if('${id}'!=='${perfilAtual}')this.style.color='#e2e8f0'"
        onmouseout="if('${id}'!=='${perfilAtual}')this.style.color='#94a3b8'">
        ${label}
      </button>`;
    }).join('');

  document.body.appendChild(bar);
}

function _switchPerfil(perfil) {
  const { nome } = SOA.perfil;
  const av = initials(nome);

  if (perfil === 'admin') {
    document.getElementById('admin-av').textContent   = av;
    document.getElementById('admin-nome').textContent = nome;
    showShell('admin');
    AdminRouter.ir('editais');

  } else if (perfil === 'coordenador') {
    document.getElementById('coord-av').textContent   = av;
    document.getElementById('coord-nome').textContent = nome;
    showShell('coordenador');
    CoordRouter.ir('home');

  } else {
    document.getElementById('aluno-av').textContent   = av;
    document.getElementById('aluno-nome').textContent = nome;
    showShell('aluno');
    AlunoRouter.ir('editais');
  }

  _renderMasterBar(perfil);
}
