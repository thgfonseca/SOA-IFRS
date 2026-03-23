// js/app.js — Login via Google Identity (popup)

const SOA = {
  perfil: null,
  editais: [], projetos: [], inscricoes: [], assiduidade: [], logs: []
};

window.addEventListener('DOMContentLoaded', () => {
  // Verifica se já tem sessão salva
  const email = sessionStorage.getItem('soa_email');
  if (email) {
    carregar(email);
  } else {
    mostrarLogin();
  }
});

// ── Tela de login ──────────────────────────────────
function mostrarLogin(msg) {
  document.getElementById('loading').innerHTML = `
    <div style="text-align:center;padding:20px;max-width:400px">
      <div class="logo-big" style="margin:0 auto 20px">S</div>
      <div class="load-txt">SOA — IFRS Campus Rio Grande</div>
      <div class="load-sub" style="margin-bottom:24px">Sistema de Organização de Ações</div>
      ${msg ? `<div style="background:#fee2e2;color:#991b1b;padding:10px 16px;border-radius:8px;font-size:13px;margin-bottom:24px;line-height:1.6">${msg}</div>` : ''}
      <div id="gsi-btn" style="display:flex;justify-content:center"></div>
      <div style="margin-top:16px;font-size:12px;color:#6b7280">
        Use seu e-mail @riogrande.ifrs.edu.br
      </div>
    </div>`;

  // Carrega Google Identity Services
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.onload = () => {
    google.accounts.id.initialize({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      callback: onCredential,
      auto_select: false,
      ux_mode: 'popup'
    });
    google.accounts.id.renderButton(
      document.getElementById('gsi-btn'),
      { theme: 'filled_black', size: 'large', text: 'signin_with', width: 300 }
    );
  };
  document.head.appendChild(script);
}

// ── Recebe o credential JWT do Google ─────────────
function onCredential(response) {
  try {
    // Decodifica o JWT (não precisa verificar assinatura aqui — só leitura)
    const parts   = response.credential.split('.');
    const payload = JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
    const email   = (payload.email || '').toLowerCase();

    if (!email) { mostrarLogin('❌ Não foi possível obter o e-mail.'); return; }
    if (!email.endsWith('@riogrande.ifrs.edu.br')) {
      mostrarLogin('❌ Use seu e-mail @riogrande.ifrs.edu.br<br><small>Detectado: ' + email + '</small>');
      return;
    }

    sessionStorage.setItem('soa_email', email);
    setLoadMsg('Carregando dados...');
    document.getElementById('loading').innerHTML = `
      <div style="text-align:center">
        <div class="logo-big" style="margin:0 auto 20px">S</div>
        <div class="load-txt">SOA — IFRS Campus Rio Grande</div>
        <div class="load-sub" id="load-sub">Carregando dados...</div>
        <div class="spinner" style="margin:24px auto 0"></div>
      </div>`;
    carregar(email);

  } catch(e) {
    mostrarLogin('❌ Erro ao processar login: ' + e.message);
  }
}

// ── Carrega dados do servidor ──────────────────────
async function carregar(email) {
  try {
    const data      = await API.carregar(email);
    SOA.perfil      = data.perfil;
    SOA.editais     = data.editais     || [];
    SOA.projetos    = data.projetos    || [];
    SOA.inscricoes  = data.inscricoes  || [];
    SOA.assiduidade = data.assiduidade || [];
    SOA.logs        = data.logs        || [];
    iniciarInterface();
    hideLoading();
  } catch(e) {
    sessionStorage.removeItem('soa_email');
    mostrarLogin('❌ Erro ao carregar dados: ' + e.message);
  }
}

// ── Iniciar interface por perfil ──────────────────
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
  sessionStorage.removeItem('soa_email');
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
