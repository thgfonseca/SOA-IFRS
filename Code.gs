// ═══════════════════════════════════════════════════
// SOA — IFRS Campus Rio Grande
// Code.gs — API REST + OAuth via Apps Script
// ═══════════════════════════════════════════════════

var SHEET_ID   = '1eqbGciiCMT865okCwppCimsZIYgnvhBqInhOK-AEUwY'; // ← ID da planilha
var GITHUB_URL = 'https://thgfonseca.github.io/SOA-IFRS/';         // ← URL do GitHub Pages

var ADMINS = [
  'den@riogrande.ifrs.edu.br',
  'dppi@riogrande.ifrs.edu.br',
  'dex@riogrande.ifrs.edu.br',
  'admin@riogrande.ifrs.edu.br'
];

var COORDENADORES = [
  'thiago.fonseca@riogrande.ifrs.edu.br',
  'j.pereira@riogrande.ifrs.edu.br',
  'r.nunes@riogrande.ifrs.edu.br',
  'l.ramos@riogrande.ifrs.edu.br',
  'p.santos@riogrande.ifrs.edu.br',
  'c.dias@riogrande.ifrs.edu.br',
  'p.neves@riogrande.ifrs.edu.br'
];

// ── Helpers ────────────────────────────────────────
function jsonOut(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
function errOut(msg) { return jsonOut({ ok: false, erro: msg }); }
function okOut(data) { return jsonOut(Object.assign({ ok: true }, data || {})); }

function getSheet(nome) {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(nome);
}

function sheetToObjects(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var h = data[0];
  return data.slice(1).map(function(row) {
    var o = {}; h.forEach(function(k, i) { o[k] = String(row[i] || ''); }); return o;
  });
}

function ts() {
  return Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');
}

// Normaliza qualquer formato de data para dd/MM/yyyy (sem horário)
function normData(v) {
  if (!v) return '';
  var s = String(v).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;          // já dd/MM/yyyy
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);             // ISO: yyyy-MM-dd
  if (m) return m[3] + '/' + m[2] + '/' + m[1];
  return s;
}

function gerarId() { return Utilities.getUuid().substring(0, 8).toUpperCase(); }

// ── Token seguro ───────────────────────────────────
function gerarToken(email) {
  var payload    = email + '|' + Date.now();
  var assinatura = Utilities.computeHmacSha256Signature(
    payload,
    Session.getScriptProperties
      ? (PropertiesService.getScriptProperties().getProperty('SECRET') || 'soa-ifrs-secret')
      : 'soa-ifrs-secret'
  );
  var sig = Utilities.base64Encode(assinatura);
  return Utilities.base64Encode(payload) + '.' + sig;
}

function verificarToken(token) {
  try {
    var parts   = token.split('.');
    if (parts.length !== 2) return null;
    var payload = Utilities.newBlob(Utilities.base64Decode(parts[0])).getDataAsString();
    var dados   = payload.split('|');
    if (dados.length < 2) return null;
    var email   = dados[0];
    var tempo   = parseInt(dados[1]);
    if (Date.now() - tempo > 8 * 60 * 60 * 1000) return null; // expira em 8h
    return email;
  } catch(e) { return null; }
}

// ── CORS preflight ─────────────────────────────────
function doOptions(e) {
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
}

// ── GET ────────────────────────────────────────────
function doGet(e) {
  var action = (e.parameter && e.parameter.action) || '';

  // ── Login: autentica via Google e redireciona para GitHub Pages ──
  if (action === 'login') {
    var email = Session.getActiveUser().getEmail().toLowerCase();
    if (!email) {
      return HtmlService.createHtmlOutput(
        '<p style="font-family:Arial;padding:40px">Não foi possível identificar o usuário. ' +
        'Certifique-se de estar logado no Google Workspace do IFRS.</p>'
      ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    if (!email.endsWith('@riogrande.ifrs.edu.br')) {
      return HtmlService.createHtmlOutput(
        '<p style="font-family:Arial;padding:40px;color:red">Use seu e-mail @riogrande.ifrs.edu.br<br>' +
        'Detectado: ' + email + '</p>'
      ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    var token       = gerarToken(email);
    var redirectUrl = GITHUB_URL + '?token=' + encodeURIComponent(token);
    return HtmlService.createHtmlOutput(
      '<!DOCTYPE html><html><head>' +
      '<meta http-equiv="refresh" content="0;url=' + redirectUrl + '">' +
      '</head><body>' +
      '<p style="font-family:Arial;padding:40px">Redirecionando...</p>' +
      '<script>window.location.replace("' + redirectUrl + '");</script>' +
      '</body></html>'
    ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // ── Dados: requer token válido ───────────────────
  var token = (e.parameter && e.parameter.token) || '';
  var email = verificarToken(token);
  if (!email) return errOut('Token inválido ou expirado. Faça login novamente.');

  if (action === 'perfil') return jsonOut(buildPerfil(email));

  if (action === 'tudo' || !action) {
    var u   = buildPerfil(email);
    var ss  = SpreadsheetApp.openById(SHEET_ID);
    var editais     = sheetToObjects(ss.getSheetByName('editais'))     || [];
    var projetos    = sheetToObjects(ss.getSheetByName('projetos'))    || [];
    var inscricoes  = sheetToObjects(ss.getSheetByName('inscricoes'))  || [];
    var assiduidade = sheetToObjects(ss.getSheetByName('assiduidade')) || [];
    var logs        = [];

    // Filtrar soft delete — rascunhos visíveis apenas para admin
    editais = editais.filter(function(ed) {
      if (ed.deleted_at && ed.deleted_at !== '') return false; // excluídos: nunca
      if (u.perfil !== 'admin' && ed.status === 'Rascunho') return false; // rascunho: só admin
      return true;
    });

    if (u.perfil === 'coordenador') {
      projetos    = projetos.filter(function(p) { return p.coordEmail === u.email; });
      inscricoes  = inscricoes.filter(function(i) { return i.coordEmail === u.email; });
      assiduidade = assiduidade.filter(function(a) { return a.coordEmail === u.email; });
    } else if (u.perfil === 'aluno') {
      inscricoes  = inscricoes.filter(function(i) { return i.alunoEmail === u.email; });
      var ids     = inscricoes.map(function(i) { return i.id; });
      assiduidade = assiduidade.filter(function(a) { return ids.indexOf(a.inscricaoId) >= 0; });
      projetos    = [];
    } else {
      logs = sheetToObjects(ss.getSheetByName('logs')) || [];
      logs = logs.reverse().slice(0, 300);
    }

    return jsonOut({
      ok: true, perfil: u, token: token,
      editais: editais, projetos: projetos,
      inscricoes: inscricoes, assiduidade: assiduidade, logs: logs
    });
  }

  return errOut('Ação desconhecida');
}

// ── POST ───────────────────────────────────────────
function doPost(e) {
  try {
    var body  = JSON.parse(e.postData.contents);
    var token = body.token || '';
    var email = verificarToken(token);
    if (!email) return errOut('Token inválido ou expirado.');
    var u      = buildPerfil(email);
    var action = body.action;

    if (action === 'salvarEdital')      return _salvarEdital(body, u);
    if (action === 'excluirEdital')     return _excluirEdital(body, u);
    if (action === 'uploadDocumento')   return _uploadDocumento(body, u);
    if (action === 'enviarNotificacao') return _enviarNotificacao(body, u);
    if (action === 'salvarProjeto')     return _salvarProjeto(body, u);
    if (action === 'excluirProjeto')    return _excluirProjeto(body, u);
    if (action === 'salvarInscricao')   return _salvarInscricao(body, u);
    if (action === 'avaliarInscricao')  return _avaliarInscricao(body, u);
    if (action === 'salvarAssiduidade') return _salvarAssiduidade(body, u);

    return errOut('Ação desconhecida: ' + action);
  } catch(ex) { return errOut(ex.message); }
}

// ── Perfil ─────────────────────────────────────────
function buildPerfil(email) {
  var perfil = 'aluno';
  if (ADMINS.indexOf(email) >= 0)       perfil = 'admin';
  else if (COORDENADORES.indexOf(email) >= 0) perfil = 'coordenador';
  var nome = email.split('@')[0].split('.').map(function(p) {
    return p.charAt(0).toUpperCase() + p.slice(1);
  }).join(' ');
  return { email: email, perfil: perfil, nome: nome };
}

function log(u, acao, modulo, detalhe) {
  try {
    getSheet('logs').appendRow([ts(), u.email, u.perfil, acao, modulo,
      String(detalhe || '').substring(0, 1000)]);
  } catch(e) {}
}

// ── EDITAIS ────────────────────────────────────────
function _salvarEdital(b, u) {
  if (u.perfil !== 'admin') return errOut('Sem permissão');

  // Normalizar datas de vigência para dd/MM/yyyy
  if (b.vigIni) b.vigIni = normData(b.vigIni);
  if (b.vigFim) b.vigFim = normData(b.vigFim);

  var sheet = getSheet('editais');

  if (b.id) {
    // ── Atualização in-place ─────────────────────
    var data = sheet.getDataRange().getValues(), h = data[0];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) !== String(b.id)) continue;

      // Linha atual para diff e controle de concorrência
      var oldRow = {};
      h.forEach(function(k, c) { oldRow[k] = String(data[i][c] !== undefined ? data[i][c] : ''); });

      // Bloquear edição de registros excluídos
      if (oldRow.deleted_at && oldRow.deleted_at !== '') {
        return errOut('Edital excluído não pode ser editado.');
      }

      // Controle de concorrência: rejeitar se updated_at divergiu
      if (b.updated_at && oldRow.updated_at && oldRow.updated_at !== '' &&
          b.updated_at !== oldRow.updated_at) {
        return errOut('Conflito: o edital foi modificado por outro usuário. ' +
                      'Recarregue a página e tente novamente.');
      }

      // Calcular diff para rastreabilidade
      var ignorar = ['id','criadoPor','criadoEm','updated_at','deleted_at','action','token'];
      var diff = {};
      h.forEach(function(k) {
        if (ignorar.indexOf(k) >= 0) return;
        var oldVal = oldRow[k] || '';
        var newVal = b[k] !== undefined ? String(b[k]) : oldVal;
        if (oldVal !== newVal) diff[k] = [oldVal, newVal];
      });

      // Atualizar timestamp
      var now = ts();
      b.updated_at = now;

      // Gravar campos — id, criadoPor, criadoEm e deleted_at são imutáveis
      var imutaveis = ['id', 'criadoPor', 'criadoEm', 'deleted_at'];
      h.forEach(function(k, c) {
        if (imutaveis.indexOf(k) >= 0) return;
        if (b[k] !== undefined) sheet.getRange(i + 1, c + 1).setValue(b[k]);
      });

      log(u, 'Editou edital', 'editais',
        'ID:' + b.id + ' | ' + (b.titulo || oldRow.titulo) + ' | DIFF:' + JSON.stringify(diff));
      return okOut({ id: b.id, updated_at: now });
    }
    return errOut('Edital não encontrado para atualização.');
  }

  // ── Criação — UUID completo ──────────────────────
  var id  = Utilities.getUuid();
  var now = ts();
  sheet.appendRow([
    id,
    String(b.numero     || ''),
    String(b.titulo     || ''),
    String(b.segmento   || ''),
    String(b.tipo       || ''),
    String(b.ambito     || ''),
    String(b.status     || 'Rascunho'),
    String(b.vigIni     || ''),
    String(b.vigFim     || ''),
    String(b.bolsaValor || ''),
    String(b.bolsaCH    || ''),
    String(b.vagas      || ''),
    String(b.descricao  || ''),
    String(b.documentos || '[]'),
    String(b.recursos   || '[]'),
    String(b.bolsas     || '[]'),
    String(b.vigencias  || '[]'),
    String(b.cronograma || '[]'),
    u.email,  // criadoPor
    now,      // criadoEm
    now,      // updated_at
    ''        // deleted_at
  ]);
  log(u, 'Criou edital', 'editais', 'ID:' + id + ' | ' + (b.titulo || ''));
  return okOut({ id: id, updated_at: now });
}

function _excluirEdital(b, u) {
  if (u.perfil !== 'admin') return errOut('Sem permissão');
  var sheet = getSheet('editais');
  var data  = sheet.getDataRange().getValues();
  var h     = data[0];

  var deletedAtCol = h.indexOf('deleted_at');
  var updatedAtCol = h.indexOf('updated_at');

  if (deletedAtCol < 0) {
    return errOut('Coluna deleted_at não encontrada. Execute setupPlanilha() para atualizar a estrutura.');
  }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) !== String(b.id)) continue;

    // Snapshot antes do soft delete
    var snapshot = {};
    h.forEach(function(k, c) { snapshot[k] = String(data[i][c] !== undefined ? data[i][c] : ''); });

    if (snapshot.deleted_at && snapshot.deleted_at !== '') {
      return errOut('Edital já foi excluído anteriormente.');
    }

    // Soft delete — nunca deletar fisicamente
    var now = ts();
    sheet.getRange(i + 1, deletedAtCol + 1).setValue(now);
    if (updatedAtCol >= 0) sheet.getRange(i + 1, updatedAtCol + 1).setValue(now);

    log(u, 'Excluiu edital (soft delete)', 'editais',
      'ID:' + b.id + ' | SNAPSHOT:' + JSON.stringify(snapshot).substring(0, 600));
    return okOut();
  }
  return errOut('Edital não encontrado.');
}

// ── UPLOAD DOCUMENTO → GOOGLE DRIVE ───────────────
function _uploadDocumento(b, u) {
  if (u.perfil !== 'admin') return errOut('Sem permissão');
  if (!b.conteudo || !b.nomeArquivo) return errOut('Dados de upload incompletos.');

  var numero = String(b.editalNumero || 'sem-numero').replace(/[^a-zA-Z0-9\-_]/g, '_');
  var ano    = String(b.editalAno || new Date().getFullYear());
  var nome   = String(b.nomeArquivo).replace(/[^a-zA-Z0-9.\-_ ]/g, '_');
  var mime   = String(b.mimeType || 'application/octet-stream');

  try {
    // Cria hierarquia de pastas dentro da pasta raiz configurada
    // Raiz: https://drive.google.com/drive/folders/1XrUshXlcnbbrp8l3SwTYI3wDB8zjLHZ8
    var DRIVE_ROOT_ID = '1XrUshXlcnbbrp8l3SwTYI3wDB8zjLHZ8';
    function getPastaOuCria(parent, nomePasta) {
      var it = parent.getFoldersByName(nomePasta);
      return it.hasNext() ? it.next() : parent.createFolder(nomePasta);
    }
    var pastaRaiz   = DriveApp.getFolderById(DRIVE_ROOT_ID);
    var pastaAno    = getPastaOuCria(pastaRaiz, 'Editais_' + ano);
    var pastaEdital = getPastaOuCria(pastaAno, 'Edital_' + numero + '_' + ano);

    // Decodificar base64 e criar arquivo
    var bytes   = Utilities.base64Decode(b.conteudo);
    var blob    = Utilities.newBlob(bytes, mime, nome);
    var arquivo = pastaEdital.createFile(blob);

    // Permitir acesso público somente leitura via link
    arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // URL de visualização pública (compatível com HTTPS, abre no browser)
    var link = 'https://drive.google.com/file/d/' + arquivo.getId() + '/view?usp=sharing';
    log(u, 'Upload documento', 'editais', nome + ' → ' + pastaEdital.getName());

    return okOut({
      url:        link,
      nome:       arquivo.getName(),
      mimeType:   mime,
      uploadedAt: ts()
    });
  } catch(ex) {
    return errOut('Erro no upload para o Drive: ' + ex.message);
  }
}

// ── ENVIAR NOTIFICAÇÃO ─────────────────────────────
function _enviarNotificacao(b, u) {
  if (u.perfil !== 'admin') return errOut('Sem permissão');
  if (!b.assunto || !b.mensagem) return errOut('Assunto e mensagem são obrigatórios.');

  try {
    var emails = [];

    // Se vieram destinatários explícitos (notificação de etapa do cronograma)
    if (b.destinatarios && Array.isArray(b.destinatarios) && b.destinatarios.length > 0) {
      emails = b.destinatarios.filter(function(em) { return em && em.indexOf('@') > 0; });
    } else if (b.editalId) {
      // Buscar destinatários do edital (inscritos + coordenadores)
      var ss2        = SpreadsheetApp.openById(SHEET_ID);
      var inscricoes = sheetToObjects(ss2.getSheetByName('inscricoes')) || [];
      var todos      = [];
      inscricoes
        .filter(function(i) { return i.editalId === b.editalId; })
        .forEach(function(i) {
          if (i.alunoEmail) todos.push(i.alunoEmail);
          if (i.coordEmail) todos.push(i.coordEmail);
        });
      emails = todos.filter(function(em, idx2, arr) {
        return em && em.indexOf('@') > 0 && arr.indexOf(em) === idx2;
      });
    }

    if (emails.length === 0) {
      // Registrar tentativa mesmo sem destinatários
      log(u, 'Notificação (sem destinatários)', 'editais', b.assunto);
      return okOut({ enviados: 0 });
    }

    // Enviar em lotes de 50 (limite do MailApp)
    var assuntoSafe  = String(b.assunto  || '').substring(0, 255);
    var mensagemSafe = String(b.mensagem || '').substring(0, 2000);
    var enviados = 0;

    emails.slice(0, 100).forEach(function(email) {
      try {
        MailApp.sendEmail({
          to:      email,
          subject: assuntoSafe,
          body:    mensagemSafe + '\n\n---\nSOA — IFRS Campus Rio Grande\nhttps://thgfonseca.github.io/SOA-IFRS/'
        });
        enviados++;
      } catch(ex) { Logger.log('Erro ao enviar para ' + email + ': ' + ex.message); }
    });

    log(u, 'Notificação enviada', 'editais', b.assunto + ' | ' + enviados + ' destinatário(s)');
    return okOut({ enviados: enviados });
  } catch(ex) {
    return errOut('Erro ao enviar notificação: ' + ex.message);
  }
}

// ── PROJETOS ───────────────────────────────────────
function _salvarProjeto(b, u) {
  if (u.perfil !== 'admin') return errOut('Sem permissão');
  var sheet = getSheet('projetos');
  if (b.id) {
    var data = sheet.getDataRange().getValues(), h = data[0];
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === b.id) {
        h.forEach(function(k, c) { if (b[k] !== undefined) sheet.getRange(i+1, c+1).setValue(b[k]); });
        log(u, 'Editou projeto', 'projetos', b.titulo);
        return okOut({ id: b.id });
      }
    }
  }
  var id = 'PR-' + gerarId();
  sheet.appendRow([id, b.editalId, b.titulo, b.segmento, b.status || 'Ativo',
    b.coordEmail, b.coordNome, b.recurso, b.tipoProjeto, u.email, ts()]);
  log(u, 'Criou projeto', 'projetos', b.titulo);
  return okOut({ id: id });
}

function _excluirProjeto(b, u) {
  if (u.perfil !== 'admin') return errOut('Sem permissão');
  var sheet = getSheet('projetos'), data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === b.id) {
      sheet.deleteRow(i + 1);
      log(u, 'Excluiu projeto', 'projetos', b.id);
      return okOut();
    }
  }
  return errOut('Não encontrado');
}

// ── INSCRIÇÕES ─────────────────────────────────────
function _salvarInscricao(b, u) {
  if (u.perfil !== 'aluno') return errOut('Apenas alunos podem se inscrever');
  var sheet = getSheet('inscricoes'), data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === u.email && data[i][5] === b.projetoId)
      return errOut('Já inscrito neste projeto');
  }
  var id = 'IN-' + gerarId();
  sheet.appendRow([id, u.email, u.nome, b.editalId, b.editalNome,
    b.projetoId, b.projetoNome, b.modalidade || 'Bolsista', 'Pendente',
    b.coordEmail, b.motivacao || '', b.lattes || '', ts(), '', '']);
  log(u, 'Inscreveu-se', 'inscricoes', b.projetoNome);
  return okOut({ id: id, nova: {
    id: id, alunoEmail: u.email, alunoNome: u.nome,
    editalId: b.editalId, editalNome: b.editalNome,
    projetoId: b.projetoId, projetoNome: b.projetoNome,
    modalidade: b.modalidade || 'Bolsista', status: 'Pendente',
    coordEmail: b.coordEmail, motivacao: b.motivacao || '',
    lattes: b.lattes || '', criadoEm: ts(), avaliadoEm: '', observacao: ''
  }});
}

function _avaliarInscricao(b, u) {
  if (u.perfil !== 'coordenador' && u.perfil !== 'admin') return errOut('Sem permissão');
  var sheet = getSheet('inscricoes'), data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === b.id) {
      sheet.getRange(i+1, 9).setValue(b.resultado);
      sheet.getRange(i+1, 14).setValue(ts());
      sheet.getRange(i+1, 15).setValue(b.observacao || '');
      log(u, 'Avaliou inscrição', 'inscricoes', b.resultado + ' — ' + data[i][6]);
      return okOut();
    }
  }
  return errOut('Não encontrada');
}

// ── ASSIDUIDADE ────────────────────────────────────
function _salvarAssiduidade(b, u) {
  if (u.perfil !== 'coordenador' && u.perfil !== 'admin') return errOut('Sem permissão');
  var id = 'AS-' + gerarId();
  getSheet('assiduidade').appendRow([id, b.inscricaoId, b.alunoNome,
    b.projetoNome, u.email, b.mes, b.presenca, b.observacao || '', ts()]);
  log(u, 'Registrou assiduidade', 'assiduidade', b.alunoNome + ' — ' + b.mes);
  return okOut({ id: id });
}

// ── SETUP DA PLANILHA ──────────────────────────────
// Execute uma vez para criar/atualizar a estrutura das abas
function setupPlanilha() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  function aba(n, h, c) {
    var s = ss.getSheetByName(n) || ss.insertSheet(n);
    if (s.getLastRow() === 0) {
      s.appendRow(h);
      s.getRange(1,1,1,h.length).setFontWeight('bold').setBackground(c).setFontColor('#fff');
      s.setFrozenRows(1);
    }
  }
  // Estrutura completa: novos campos ambito, recursos, bolsas, vigencias, cronograma
  aba('editais', [
    'id','numero','titulo','segmento','tipo','ambito','status',
    'vigIni','vigFim','bolsaValor','bolsaCH','vagas','descricao',
    'documentos','recursos','bolsas','vigencias','cronograma',
    'criadoPor','criadoEm','updated_at','deleted_at'
  ], '#00843D');
  aba('projetos',    ['id','editalId','titulo','segmento','status','coordEmail','coordNome','recurso','tipoProjeto','criadoPor','criadoEm'], '#54a4c3');
  aba('inscricoes',  ['id','alunoEmail','alunoNome','editalId','editalNome','projetoId','projetoNome','modalidade','status','coordEmail','motivacao','lattes','criadoEm','avaliadoEm','observacao'], '#f4b61d');
  aba('assiduidade', ['id','inscricaoId','alunoNome','projetoNome','coordEmail','mes','presenca','observacao','registradoEm'], '#9cbb31');
  aba('logs',        ['timestamp','email','perfil','acao','modulo','detalhe'], '#592b9b');
  var p = ss.getSheetByName('Página1') || ss.getSheetByName('Sheet1');
  if (p && ss.getSheets().length > 1) ss.deleteSheet(p);
  Logger.log('✓ Pronto!');
}
