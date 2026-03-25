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

// Normaliza qualquer formato de data para dd/MM/yyyy (sem horário)
function normData(v) {
  if (!v) return '';
  var s = String(v).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;           // já dd/MM/yyyy
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);              // ISO: yyyy-MM-dd
  if (m) return m[3] + '/' + m[2] + '/' + m[1];
  return s;
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
    // Trunca detalhe para evitar células muito longas
    getSheet('logs').appendRow([ts(), u.email, u.perfil, acao, modulo, String(detalhe || '').substring(0, 1000)]);
  } catch(e) {}
}

// ── GET — roteador ─────────────────────────────────
function doGet(e) {
  try {
    var action = e.parameter.action || 'tudo';
    var u = getPerfil();

    if (action === 'perfil') return json(u);

    if (action === 'tudo') {
      var ss = SpreadsheetApp.openById(SHEET_ID);
      var editais    = sheetToObjects(ss.getSheetByName('editais'))     || [];
      var projetos   = sheetToObjects(ss.getSheetByName('projetos'))    || [];
      var inscricoes = sheetToObjects(ss.getSheetByName('inscricoes'))  || [];
      var assiduidade= sheetToObjects(ss.getSheetByName('assiduidade')) || [];
      var logs       = [];

      // Filtrar editais com soft delete — ocultar registros excluídos
      editais = editais.filter(function(ed) {
        return !ed.deleted_at || ed.deleted_at === '';
      });

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

  // Normalizar datas de vigência para dd/MM/yyyy
  if (b.vigIni) b.vigIni = normData(b.vigIni);
  if (b.vigFim) b.vigFim = normData(b.vigFim);

  var sheet = getSheet('editais');

  if (b.id) {
    // ── Atualização in-place ────────────────────────
    var data = sheet.getDataRange().getValues();
    var headers = data[0];

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) !== String(b.id)) continue;

      // Construir objeto da linha atual para diff e controle de concorrência
      var oldRow = {};
      headers.forEach(function(h, col) {
        oldRow[h] = String(data[i][col] !== undefined ? data[i][col] : '');
      });

      // Bloquear edição de registros já excluídos
      if (oldRow.deleted_at && oldRow.deleted_at !== '') {
        return err('Edital excluído não pode ser editado.');
      }

      // Controle de concorrência: rejeitar se updated_at divergiu
      if (b.updated_at && oldRow.updated_at && oldRow.updated_at !== '' &&
          b.updated_at !== oldRow.updated_at) {
        return err('Conflito: o edital foi modificado por outro usuário. ' +
                   'Recarregue a página e tente novamente.');
      }

      // Calcular diff para rastreabilidade no log
      var camposIgnorados = ['id','criadoPor','criadoEm','updated_at','deleted_at','action','token'];
      var diff = {};
      headers.forEach(function(h) {
        if (camposIgnorados.indexOf(h) >= 0) return;
        var oldVal = oldRow[h] || '';
        var newVal = b[h] !== undefined ? String(b[h]) : oldVal;
        if (oldVal !== newVal) diff[h] = [oldVal, newVal];
      });

      // Atualizar timestamp de modificação
      var now = ts();
      b.updated_at = now;

      // Atualizar campos — ID, criadoPor, criadoEm e deleted_at são imutáveis
      var imutaveis = ['id', 'criadoPor', 'criadoEm', 'deleted_at'];
      headers.forEach(function(h, col) {
        if (imutaveis.indexOf(h) >= 0) return;
        if (b[h] !== undefined) sheet.getRange(i + 1, col + 1).setValue(b[h]);
      });

      log(u, 'Editou edital', 'editais',
        'ID:' + b.id + ' | ' + (b.titulo || oldRow.titulo) +
        ' | DIFF:' + JSON.stringify(diff));
      return ok({ id: b.id, updated_at: now });
    }
    return err('Edital não encontrado para atualização.');
  }

  // ── Criação — ID via UUID completo ─────────────
  var id  = Utilities.getUuid();
  var now = ts();
  sheet.appendRow([
    id,
    String(b.numero     || ''),
    String(b.titulo     || ''),
    String(b.segmento   || ''),
    String(b.tipo       || ''),
    String(b.status     || 'Rascunho'),
    String(b.vigIni     || ''),
    String(b.vigFim     || ''),
    String(b.bolsaValor || ''),
    String(b.bolsaCH    || ''),
    String(b.vagas      || ''),
    String(b.descricao  || ''),
    String(b.documentos || '[]'),
    u.email,   // criadoPor
    now,       // criadoEm
    now,       // updated_at
    ''         // deleted_at (vazio = não excluído)
  ]);
  log(u, 'Criou edital', 'editais', 'ID:' + id + ' | ' + (b.titulo || ''));
  return ok({ id: id, updated_at: now });
}

function _excluirEdital(b, u) {
  if (u.perfil !== 'admin') return err('Sem permissão');
  var sheet = getSheet('editais');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var deletedAtCol = headers.indexOf('deleted_at');
  var updatedAtCol = headers.indexOf('updated_at');

  if (deletedAtCol < 0) {
    return err('Coluna deleted_at não encontrada. Execute setupPlanilha() para atualizar a estrutura.');
  }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) !== String(b.id)) continue;

    // Capturar snapshot completo antes de marcar como excluído
    var snapshot = {};
    headers.forEach(function(h, col) {
      snapshot[h] = String(data[i][col] !== undefined ? data[i][col] : '');
    });

    if (snapshot.deleted_at && snapshot.deleted_at !== '') {
      return err('Edital já foi excluído anteriormente.');
    }

    // Soft delete: marcar deleted_at, nunca deletar fisicamente
    var now = ts();
    sheet.getRange(i + 1, deletedAtCol + 1).setValue(now);
    if (updatedAtCol >= 0) sheet.getRange(i + 1, updatedAtCol + 1).setValue(now);

    log(u, 'Excluiu edital (soft delete)', 'editais',
      'ID:' + b.id + ' | SNAPSHOT:' + JSON.stringify(snapshot).substring(0, 600));
    return ok();
  }
  return err('Edital não encontrado.');
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
  var id = 'PR-' + Utilities.getUuid().substring(0, 8).toUpperCase();
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
  var id = 'IN-' + Utilities.getUuid().substring(0, 8).toUpperCase();
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
  var id = 'AS-' + Utilities.getUuid().substring(0, 8).toUpperCase();
  getSheet('assiduidade').appendRow([
    id, b.inscricaoId, b.alunoNome, b.projetoNome,
    u.email, b.mes, b.presenca, b.observacao || '', ts()
  ]);
  log(u, 'Registrou assiduidade', 'assiduidade', b.alunoNome + ' — ' + b.mes);
  return ok({ id: id });
}

// ── SETUP DA PLANILHA ──────────────────────────────
// Execute uma vez após criar a planilha (ou ao atualizar estrutura)
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

  // Estrutura atualizada: documentos, updated_at e deleted_at adicionados
  aba('editais', [
    'id', 'numero', 'titulo', 'segmento', 'tipo', 'status',
    'vigIni', 'vigFim', 'bolsaValor', 'bolsaCH', 'vagas', 'descricao',
    'documentos', 'criadoPor', 'criadoEm', 'updated_at', 'deleted_at'
  ], '#00843D');
  aba('projetos',    ['id','editalId','titulo','segmento','status','coordEmail','coordNome','recurso','tipoProjeto','criadoPor','criadoEm'], '#54a4c3');
  aba('inscricoes',  ['id','alunoEmail','alunoNome','editalId','editalNome','projetoId','projetoNome','modalidade','status','coordEmail','motivacao','lattes','criadoEm','avaliadoEm','observacao'], '#f4b61d');
  aba('assiduidade', ['id','inscricaoId','alunoNome','projetoNome','coordEmail','mes','presenca','observacao','registradoEm'], '#9cbb31');
  aba('logs',        ['timestamp','email','perfil','acao','modulo','detalhe'], '#592b9b');

  var padrao = ss.getSheetByName('Página1') || ss.getSheetByName('Sheet1');
  if (padrao && ss.getSheets().length > 1) ss.deleteSheet(padrao);
  Logger.log('✓ Planilha configurada com sucesso!');
}
