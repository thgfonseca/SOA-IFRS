// pages/aluno/editais.js

const AlunoEditais = {

  // Formata data para dd/MM/yyyy (sem horário)
  _fmtData(v) {
    if (!v) return '';
    const s = String(v).trim();
    if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) return s.substring(0, 10);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return s;
  },

  // Escapa caracteres HTML para prevenir XSS
  _esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },

  render(body) {
    // Exibir apenas editais publicados e não excluídos
    const abertos = SOA.editais.filter(e =>
      e.status === 'Publicado' && (!e.deleted_at || e.deleted_at === '')
    );

    let html = `
      <div class="ph">
        <div>
          <h1>Editais Abertos</h1>
          <p>${abertos.length} edital(is) disponível(is)</p>
        </div>
      </div>`;

    if (abertos.length === 0) {
      html += `<div class="card">${emptyState('📋', 'Nenhum edital aberto no momento.')}</div>`;
    } else {
      abertos.forEach(e => {
        const vigIni   = AlunoEditais._fmtData(e.vigIni);
        const vigFim   = AlunoEditais._fmtData(e.vigFim);
        const titulo   = AlunoEditais._esc(e.titulo);
        const descricao= AlunoEditais._esc(e.descricao);
        const bolsaVal = AlunoEditais._esc(e.bolsaValor || '—');
        const bolsaCH  = AlunoEditais._esc(e.bolsaCH   || '—');
        const vagas    = AlunoEditais._esc(e.vagas      || '—');
        const edId     = AlunoEditais._esc(e.id);

        html += `
          <div class="card" style="padding:20px;margin-bottom:12px">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
              <div style="flex:1">
                <div style="display:flex;gap:8px;margin-bottom:8px">
                  ${segBadge(e.segmento)} ${statusBadge(e.status)}
                </div>
                <div style="font-family:'Sora',sans-serif;font-size:16px;font-weight:700;margin-bottom:6px">${titulo}</div>
                <div style="font-size:12px;color:var(--g4);margin-bottom:8px">
                  ${vigIni} – ${vigFim} · R$ ${bolsaVal}/mês · ${bolsaCH}h/sem · ${vagas} vagas
                </div>
                <div style="font-size:13px;color:var(--g5);line-height:1.6">${descricao}</div>
              </div>
              <button class="btn bp" onclick="AlunoEditais.inscrever('${edId}', ${JSON.stringify(e.titulo)})">+ Inscrever-se</button>
            </div>
          </div>`;
      });
    }
    body.innerHTML = html;
  },

  inscrever(editalId, editalNome) {
    const projetos = SOA.projetos.filter(p => p.editalId === editalId);
    if (projetos.length === 0) {
      Modal.open('Inscrição indisponível', AlunoEditais._esc(editalNome),
        `<p style="color:var(--g5);font-size:14px;line-height:1.6">
          Nenhum projeto cadastrado para este edital ainda.<br>Aguarde o cadastro pelo administrador.
        </p>`);
      return;
    }
    const optsProj = projetos.map(p =>
      `<option value="${AlunoEditais._esc(p.id)}" data-coord="${AlunoEditais._esc(p.coordEmail)}">${AlunoEditais._esc(p.titulo)}</option>`
    ).join('');

    Modal.open(`Inscrição — ${AlunoEditais._esc(editalNome)}`, 'Preencha os dados abaixo',
      `<div style="display:flex;flex-direction:column;gap:14px">
        <div class="fl"><label>Projeto</label>
          <select class="sel" id="ins-projeto">${optsProj}</select></div>
        <div class="fl"><label>Modalidade</label>
          <select class="sel" id="ins-modalidade">
            <option>Bolsista</option><option>Voluntário</option>
          </select></div>
        <div class="fl"><label>Carta de motivação (opcional)</label>
          <textarea class="inp" id="ins-motivacao" placeholder="Descreva seu interesse..."></textarea></div>
        <div class="fl"><label>Link Lattes (opcional)</label>
          <input class="inp" id="ins-lattes" type="url" placeholder="https://lattes.cnpq.br/..."></div>
      </div>`,
      `<button class="btn bo" onclick="Modal.close()">Cancelar</button>
       <button class="btn bp" onclick="AlunoEditais.confirmar(${JSON.stringify(editalId)}, ${JSON.stringify(editalNome)})">✓ Enviar inscrição</button>`
    );
    window._projetosInsc = projetos;
  },

  async confirmar(editalId, editalNome) {
    const sel         = document.getElementById('ins-projeto');
    const projetoId   = sel.value;
    const projetoNome = sel.options[sel.selectedIndex].text;
    const proj        = (window._projetosInsc || []).find(p => p.id === projetoId);

    // Validar link Lattes se preenchido
    const lattes = val('ins-lattes');
    if (lattes && !/^https?:\/\/.+/.test(lattes)) {
      toast('⚠ Link Lattes inválido. Use uma URL completa.');
      return;
    }

    const dados = {
      editalId, editalNome, projetoId, projetoNome,
      coordEmail: proj ? proj.coordEmail : '',
      modalidade: val('ins-modalidade'),
      motivacao:  val('ins-motivacao'),
      lattes
    };
    Modal.close();
    toast('⏳ Enviando inscrição...');
    try {
      const res = await API.salvarInscricao(dados);
      SOA.inscricoes.push(res.nova);
      toast('✓ Inscrição enviada! Aguarde o resultado.');
      AlunoRouter.ir('inscricoes');
    } catch(e) { toast('❌ ' + e.message); }
  }
};
