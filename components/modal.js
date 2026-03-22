// components/modal.js

const Modal = {
  open(titulo, sub, bodyHtml, footHtml) {
    document.getElementById('modal-titulo').textContent = titulo;
    document.getElementById('modal-sub').textContent    = sub || '';
    document.getElementById('modal-body').innerHTML     = bodyHtml || '';
    document.getElementById('modal-foot').innerHTML     = footHtml ||
      '<button class="btn bo" onclick="Modal.close()">Fechar</button>';
    document.getElementById('modal-bg').classList.add('open');
  },

  close() {
    document.getElementById('modal-bg').classList.remove('open');
  },

  confirm(titulo, msg, onConfirm) {
    Modal.open(titulo, '',
      `<p style="font-size:14px;color:var(--g5);line-height:1.6">${msg}</p>`,
      `<button class="btn bo" onclick="Modal.close()">Cancelar</button>
       <button class="btn" style="background:#dc2626;color:#fff"
         onclick="Modal.close();(${onConfirm})()">Confirmar</button>`
    );
  }
};

// Fecha ao clicar fora
document.getElementById('modal-bg').addEventListener('click', e => {
  if (e.target === e.currentTarget) Modal.close();
});
document.getElementById('modal-close').addEventListener('click', () => Modal.close());
