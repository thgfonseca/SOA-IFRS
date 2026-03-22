// ═══════════════════════════════════════════════════
// SOA — IFRS Campus Rio Grande
// Code.gs — API REST para GitHub Pages
// ═══════════════════════════════════════════════════

var SHEET_ID = ''; // ← cole o ID da sua planilha aqui

var ADMINS = [
  'den@riogrande.ifrs.edu.br',
  'dppi@riogrande.ifrs.edu.br',
  'dex@riogrande.ifrs.edu.br',
  'admin@riogrande.ifrs.edu.br'
];

var COORDENADORES = [
  'a.lima@riogrande.ifrs.edu.br',
  'j.pereira@riogrande.ifrs.edu.br',
  'r.nunes@riogrande.ifrs.edu.br',
  'l.ramos@riogrande.ifrs.edu.br',
  'p.santos@riogrande.ifrs.edu.br',
  'c.dias@riogrande.ifrs.edu.br',
  'p.neves@riogrande.ifrs.edu.br'
];

// ── Helpers ────────────────────────────────────────
function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function err(msg) {
  return json({ ok: false, erro: msg });
}

function ok(data) {
  return json(Object.assign({ ok: true }, data || {}));
}

function getSheet(nome) {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(nome);
}

function sheetToObjects(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i] !== undefined ? String(row[i]) : ''; });
    return obj;
  });
}

function ts() {
  return Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');
}

function gerarId() {
  return Utilities.getUuid().substring(0, 8).toUpperCase();
}

// ── Autenticação ───────────────────────────────────
function getPerfil() {
  var email = Session.getActiveUser().getEmail().toLowerCase();
  var perfil = 'aluno';
  if (ADMINS.indexOf(email) >= 0) perfil = 'admin';
  else if (COORDENADORES.indexOf(email) >= 0) perfil = 'coordenador';
  var nome = email.split('@')[0].split('.').map(function(p) {
    return p.charAt(0).toUpperCase() + p.slice(1);
  }).join(' ');
  return { email: email, perfil: perfil, nome: nome };
}

function log(u, acao, modulo, detalhe) {
  try {
    getSheet('logs').appendRow([ts(), u.email, u.perfil, acao, modulo, detalhe]);
  } catch(e) {}
}

// ── GET — roteador ─────────────────────────────────
function doGet(e) {
  try {
    var action = e.parameter.action || 'tudo';
    var u = getPerfil();

    if (action === 'perfil') return json(u);

    if (action === 'tudo') {
      // Uma chamada só carrega tudo — elimina latência de múltiplas chamadas
      var ss = SpreadsheetApp.openById(SHEET_ID);
      var editais    = sheetToObjects(ss.getSheetByName('editais'))     || [];
      var projetos   = sheetToObjects(ss.getSheetByName('projetos'))    || [];
      var inscricoes = sheetToObjects(ss.getSheetByName('inscricoes'))  || [];
      var assiduidade= sheetToObjects(ss.getSheetByName('assiduidade')) || [];
      var logs       = [];

      // Filtrar por perfil
      if (u.perfil === 'coordenador') {
        projetos    = projetos.filter(function(p){ return p.coordEmail === u.email; });
        inscricoes  = inscricoes.filter(function(i){ return i.coordEmail === u.email; });
        assiduidade = assiduidade.filter(function(a){ return a.coordEmail === u.email; });
      } else if (u.perfil === 'aluno') {
        inscricoes  = inscricoes.filter(function(i){ return i.alunoEmail === u.email; });
        var ids     = inscricoes.map(function(i){ return i.id; });
        assiduidade = assiduidade.filter(function(a){ return ids.indexOf(a.inscricaoId) >= 0; });
        projetos    = [];
      } else {
        // admin vê logs
        logs = sheetToObjects(ss.getSheetByName('logs')) || [];
        logs = logs.reverse().slice(0, 300);
      }

      return json({
        ok: true,
        perfil: u,
        editais: editais,
        projetos: projetos,
        inscricoes: inscricoes,
        assiduidade: assiduidade,
        logs: logs
      });
    }

    return err('Ação desconhecida');
  } catch(e) {
    return err(e.message);
  }
}

// ── POST — roteador ────────────────────────────────
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var u = getPerfil();

    if (action === 'salvarEdital')      return _salvarEdital(body, u);
    if (action === 'excluirEdital')     return _excluirEdital(body, u);
    if (action === 'salvarProjeto')     return _salvarProjeto(body, u);
    if (action === 'excluirProjeto')    return _excluirProjeto(body, u);
    if (action === 'salvarInscricao')   return _salvarInscricao(body, u);
    if (action === 'avaliarInscricao')  return _avaliarInscricao(body, u);
    if (action === 'salvarAssiduidade') return _salvarAssiduidade(body, u);

    return err('Ação desconhecida: ' + action);
  } catch(e) {
    return err(e.message);
  }
}

// ── EDITAIS ────────────────────────────────────────
function _salvarEdital(b, u) {
  if (u.perfil !== 'admin') return err('Sem permissão');
  var sheet = getSheet('editais');
  if (b.id) {
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === b.id) {
        headers.forEach(function(h, col) {
          if (b[h] !== undefined) sheet.getRange(i+1, col+1).setValue(b[h]);
        });
        log(u, 'Editou edital', 'editais', b.titulo);
        return ok({ id: b.id });
      }
    }
  }
  var id = 'ED-' + gerarId();
  sheet.appendRow([
    id, b.numero, b.titulo, b.segmento, b.tipo,
    b.status || 'Rascunho', b.vigIni, b.vigFim,
    b.bolsaValor, b.bolsaCH, b.vagas, b.descricao,
    u.email, ts()
  ]);
  log(u, 'Criou edital', 'editais', b.titulo);
  return ok({ id: id });
}

function _excluirEdital(b, u) {
  if (u.perfil !== 'admin') return err('Sem permissão');
  var sheet = getSheet('editais');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === b.id) {
      sheet.deleteRow(i + 1);
      log(u, 'Excluiu edital', 'editais', b.id);
      return ok();
    }
  }
  return err('Edital não encontrado');
}

// ── PROJETOS ───────────────────────────────────────
function _salvarProjeto(b, u) {
  if (u.perfil !== 'admin') return err('Sem permissão');
  var sheet = getSheet('projetos');
  if (b.id) {
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === b.id) {
        headers.forEach(function(h, col) {
          if (b[h] !== undefined) sheet.getRange(i+1, col+1).setValue(b[h]);
        });
        log(u, 'Editou projeto', 'projetos', b.titulo);
        return ok({ id: b.id });
      }
    }
  }
  var id = 'PR-' + gerarId();
  sheet.appendRow([
    id, b.editalId, b.titulo, b.segmento,
    b.status || 'Ativo', b.coordEmail, b.coordNome,
    b.recurso, b.tipoProjeto, u.email, ts()
  ]);
  log(u, 'Criou projeto', 'projetos', b.titulo);
  return ok({ id: id });
}

function _excluirProjeto(b, u) {
  if (u.perfil !== 'admin') return err('Sem permissão');
  var sheet = getSheet('projetos');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === b.id) {
      sheet.deleteRow(i + 1);
      log(u, 'Excluiu projeto', 'projetos', b.id);
      return ok();
    }
  }
  return err('Projeto não encontrado');
}

// ── INSCRIÇÕES ─────────────────────────────────────
function _salvarInscricao(b, u) {
  if (u.perfil !== 'aluno') return err('Apenas alunos podem se inscrever');
  var sheet = getSheet('inscricoes');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === u.email && data[i][5] === b.projetoId)
      return err('Você já está inscrito neste projeto');
  }
  var id = 'IN-' + gerarId();
  sheet.appendRow([
    id, u.email, u.nome, b.editalId, b.editalNome,
    b.projetoId, b.projetoNome, b.modalidade || 'Bolsista',
    'Pendente', b.coordEmail, b.motivacao || '', b.lattes || '',
    ts(), '', ''
  ]);
  log(u, 'Inscreveu-se', 'inscricoes', b.projetoNome);
  return ok({
    id: id,
    nova: {
      id: id, alunoEmail: u.email, alunoNome: u.nome,
      editalId: b.editalId, editalNome: b.editalNome,
      projetoId: b.projetoId, projetoNome: b.projetoNome,
      modalidade: b.modalidade || 'Bolsista', status: 'Pendente',
      coordEmail: b.coordEmail, motivacao: b.motivacao || '',
      lattes: b.lattes || '', criadoEm: ts(), avaliadoEm: '', observacao: ''
    }
  });
}

function _avaliarInscricao(b, u) {
  if (u.perfil !== 'coordenador' && u.perfil !== 'admin') return err('Sem permissão');
  var sheet = getSheet('inscricoes');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === b.id) {
      sheet.getRange(i+1, 9).setValue(b.resultado);
      sheet.getRange(i+1, 14).setValue(ts());
      sheet.getRange(i+1, 15).setValue(b.observacao || '');
      log(u, 'Avaliou inscrição', 'inscricoes', b.resultado + ' — ' + data[i][6]);
      return ok();
    }
  }
  return err('Inscrição não encontrada');
}

// ── ASSIDUIDADE ────────────────────────────────────
function _salvarAssiduidade(b, u) {
  if (u.perfil !== 'coordenador' && u.perfil !== 'admin') return err('Sem permissão');
  var id = 'AS-' + gerarId();
  getSheet('assiduidade').appendRow([
    id, b.inscricaoId, b.alunoNome, b.projetoNome,
    u.email, b.mes, b.presenca, b.observacao || '', ts()
  ]);
  log(u, 'Registrou assiduidade', 'assiduidade', b.alunoNome + ' — ' + b.mes);
  return ok({ id: id });
}

// ── SETUP DA PLANILHA ──────────────────────────────
// Execute uma vez após criar a planilha
function setupPlanilha() {
  var ss = SpreadsheetApp.openById(SHEET_ID);

  function aba(nome, headers, cor) {
    var s = ss.getSheetByName(nome) || ss.insertSheet(nome);
    if (s.getLastRow() === 0) {
      s.appendRow(headers);
      s.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground(cor).setFontColor('#fff');
      s.setFrozenRows(1);
    }
  }

  aba('editais',     ['id','numero','titulo','segmento','tipo','status','vigIni','vigFim','bolsaValor','bolsaCH','vagas','descricao','criadoPor','criadoEm'], '#00843D');
  aba('projetos',    ['id','editalId','titulo','segmento','status','coordEmail','coordNome','recurso','tipoProjeto','criadoPor','criadoEm'], '#54a4c3');
  aba('inscricoes',  ['id','alunoEmail','alunoNome','editalId','editalNome','projetoId','projetoNome','modalidade','status','coordEmail','motivacao','lattes','criadoEm','avaliadoEm','observacao'], '#f4b61d');
  aba('assiduidade', ['id','inscricaoId','alunoNome','projetoNome','coordEmail','mes','presenca','observacao','registradoEm'], '#9cbb31');
  aba('logs',        ['timestamp','email','perfil','acao','modulo','detalhe'], '#592b9b');

  var padrao = ss.getSheetByName('Página1') || ss.getSheetByName('Sheet1');
  if (padrao && ss.getSheets().length > 1) ss.deleteSheet(padrao);
  Logger.log('✓ Planilha configurada com sucesso!');
}
