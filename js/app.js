// js/app.js — Inicialização com Google Identity Services

const SOA = {
  perfil: null,
  editais: [], projetos: [], inscricoes: [], assiduidade: [], logs: []
};

window.addEventListener('DOMContentLoaded', () => {
  setLoadMsg('Verificando login...');
  carregarGoogleIdentity();
});

function carregarGoogleIdentity() {
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.onload = () => {
    google.accounts.id.initialize({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      callback: onToken,
      auto_select: true,
      cancel_on_tap_outside: false
    });
    google.accounts.id.prompt(n => {
      if (n.isNotDisplayed() || n.isSkippedMoment()) mostrarLogin();
    });
  };
  document.head.appendChild(s);
}

function onToken(response) {
  const payload = JSON.parse(atob(response.credential.split('.')[1]));
  const email   = payload.email;
  if (!email.endsWith('@riogrande.ifrs.edu.br')) {
    setLoadMsg('❌ Use seu e-mail @riogrande.ifrs.edu.br');
    mostrarLogin(); return;
  }
  setLoadMsg('Carregando dados...');
  carregar(email);
}

async function carregar(email) {
  try {
    const data      = await API.carregar(email);
    SOA.perfil      = data.perfil;
    SOA.editais     = data.editais     || [];
    SOA.projetos    = data.projetos    || [];
    SOA.inscricoes  = data.inscricoes  || [];
    SOA.assiduidade = data.assiduidade || [];
    SOA.logs        = data.logs        || [];
    iniciar();
    hideLoading();
  } catch(e) { setLoadMsg('❌ ' + e.message); }
}

function mostrarLogin() {
  document.getElementById('loading').innerHTML = `
    <div style="text-align:center;padding:20px">
      <div class="logo-big">S</div>
      <div class="load-txt">SOA — IFRS Campus Rio Grande</div>
      <div class="load-sub" style="margin-bottom:32px">Faça login com sua conta institucional</div>
      <div id="gsi-btn"></div>
    </div>`;
  if (window.google && google.accounts) {
    google.accounts.id.renderButton(
      document.getElementById('gsi-btn'),
      { theme:'filled_black', size:'large', text:'signin_with', width:300 }
    );
  }
}

function iniciar() {
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

function showShell(p) {
  document.querySelectorAll('.shell').forEach(s => s.classList.remove('active'));
  document.getElementById('shell-' + p).classList.add('active');
}
function bindNav(navId, fn) {
  document.querySelectorAll(`#${navId} button`).forEach(b => {
    b.addEventListener('click', () => fn(b.dataset.page));
  });
}
function setLoadMsg(msg) { const e = document.getElementById('load-sub'); if(e) e.textContent = msg; }
function hideLoading() {
  const l = document.getElementById('loading');
  l.classList.add('hide');
  setTimeout(() => l.style.display = 'none', 400);
}

const AdminRouter = {
  ir(page) {
    activateNav('admin-topnav', page); Sidebar.activate(page);
    const app = document.getElementById('app');
    const p = { editais:()=>AdminEditais.render(app), 'cad-edital':()=>AdminEditais.form(app),
      projetos:()=>AdminProjetos.render(app), 'cad-projeto':()=>AdminProjetos.form(app),
      inscricoes:()=>AdminInscricoes.render(app), assiduidade:()=>AdminAssiduidade.render(app),
      logs:()=>AdminLogs.render(app) };
    if (p[page]) p[page]();
  }
};
const CoordRouter = {
  ir(page) {
    activateNav('coord-topnav', page);
    const b = document.getElementById('coord-body');
    const p = { home:()=>CoordHome.render(b), projetos:()=>CoordHome.renderProjetos(b),
      inscricoes:()=>CoordInscricoes.render(b), assiduidade:()=>CoordAssiduidade.render(b) };
    if (p[page]) p[page]();
  }
};
const AlunoRouter = {
  ir(page) {
    activateNav('aluno-topnav', page);
    const b = document.getElementById('aluno-body');
    const p = { editais:()=>AlunoEditais.render(b), inscricoes:()=>AlunoInscricoes.render(b),
      assiduidade:()=>AlunoAssiduidade.render(b) };
    if (p[page]) p[page]();
  }
};
