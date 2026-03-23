// js/app.js

const SOA = {
  perfil: null,
  editais: [], projetos: [], inscricoes: [], assiduidade: [], logs: []
};

window.addEventListener('DOMContentLoaded', () => {
  // 1. Verifica se voltou do OAuth (token no hash da URL)
  const hash  = window.location.hash;
  const match = hash.match(/access_token=([^&]+)/);

  if (match) {
    const token = match[1];
    sessionStorage.setItem('soa_token', token);
    // Limpa o hash sem recarregar
    history.replaceState(null, '', window.location.pathname + window.location.search);
    iniciarComToken(token);
    return;
  }

  // 2. Verifica token salvo
  const saved = sessionStorage.getItem('soa_token');
  if (saved) {
    iniciarComToken(saved);
    return;
  }

  // 3. Sem token — mostra login
  mostrarLogin();
});

async function iniciarComToken(token) {
  setLoadMsg('Identificando usuário...');
  try {
    const res  = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + token);
    const info = await res.json();

    if (info.error) {
      sessionStorage.removeItem('soa_token');
      mostrarLogin('Sessão expirada. Faça login novamente.');
      return;
    }

    const email = (info.email || '').toLowerCase();

    if (!email) {
      sessionStorage.removeItem('soa_token');
      mostrarLogin('❌ Não foi possível obter o e-mail.');
      return;
    }

    if (!email.endsWith('@riogrande.ifrs.edu.br')) {
      sessionStorage.removeItem('soa_token');
      mostrarLogin('❌ Use seu e-mail @riogrande.ifrs.edu.br<br>Detectado: ' + email);
      return;
    }

    setLoadMsg('Carregando dados...');
    const data = await API.carregar(email);

    SOA.perfil      = data.perfil;
    SOA.editais     = data.editais     || [];
    SOA.projetos    = data.projetos    || [];
    SOA.inscricoes  = data.inscricoes  || [];
    SOA.assiduidade = data.assiduidade || [];
    SOA.logs        = data.logs        || [];

    iniciarInterface();
    hideLoading();

  } catch(e) {
    sessionStorage.removeItem('soa_token');
    mostrarLogin('❌ Erro: ' + e.message);
  }
}

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

function loginURL() {
  const redirect = window.location.href.split('#')[0].split('?')[0];
  const params   = new URLSearchParams({
    client_id:     CONFIG.GOOGLE_CLIENT_ID,
    redirect_uri:  redirect,
    response_type: 'token',
    scope:         'openid email profile',
    prompt:        'select_account'
  });
  return 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
}

function mostrarLogin(msg) {
  document.getElementById('loading').innerHTML = `
    <div style="text-align:center;padding:20px;max-width:400px">
      <div class="logo-big" style="margin:0 auto 20px">S</div>
      <div class="load-txt">SOA — IFRS Campus Rio Grande</div>
      <div class="load-sub" style="margin-bottom:24px">Sistema de Organização de Ações</div>
      ${msg ? `<div style="background:#fee2e2;color:#991b1b;padding:10px 16px;border-radius:8px;font-size:13px;margin-bottom:24px;line-height:1.6">${msg}</div>` : ''}
      <a href="${loginURL()}"
        style="display:inline-flex;align-items:center;gap:12px;
               background:#fff;color:#1a1a2e;padding:14px 28px;
               border-radius:8px;font-family:Inter,sans-serif;
               font-size:15px;font-weight:500;text-decoration:none;
               border:1.5px solid #e5e7eb;box-shadow:0 2px 8px rgba(0,0,0,.1)">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Entrar com Google
      </a>
      <div style="margin-top:16px;font-size:12px;color:#6b7280">
        Use seu e-mail @riogrande.ifrs.edu.br
      </div>
    </div>`;
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
      'cad-edital':  () => AdminEditais.form(app),
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
  ir(page) {
    activateNav('coord-topnav', page);
    const b = document.getElementById('coord-body');
    const p = {
      home:        () => CoordHome.render(b),
      projetos:    () => CoordHome.renderProjetos(b),
      inscricoes:  () => CoordInscricoes.render(b),
      assiduidade: () => CoordAssiduidade.render(b)
    };
    if (p[page]) p[page]();
  }
};
const AlunoRouter = {
  ir(page) {
    activateNav('aluno-topnav', page);
    const b = document.getElementById('aluno-body');
    const p = {
      editais:     () => AlunoEditais.render(b),
      inscricoes:  () => AlunoInscricoes.render(b),
      assiduidade: () => AlunoAssiduidade.render(b)
    };
    if (p[page]) p[page]();
  }
};
