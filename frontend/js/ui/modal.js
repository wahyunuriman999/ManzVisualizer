export function openModal(title, contentHtml, onSave, onCancel = null) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  
  content.innerHTML = `
    <div class="modal-header">
      <h3 class="text-lg font-bold">${title}</h3>
      <button id="modal-close-icon" class="text-gray-500 hover:text-white">&times;</button>
    </div>
    <div class="modal-body">${contentHtml}</div>
    <div class="modal-footer">
      <button id="modal-cancel" class="btn btn-secondary">Cancel</button>
      <button id="modal-save" class="btn btn-primary">Save</button>
    </div>
  `;
  
  overlay.classList.remove('hidden');

  const closeFn = () => {
    overlay.classList.add('hidden');
    if (onCancel) onCancel();
  };

  document.getElementById('modal-close-icon').onclick = closeFn;
  document.getElementById('modal-cancel').onclick = closeFn;
  
  document.getElementById('modal-save').onclick = () => {
    if (onSave) onSave();
    overlay.classList.add('hidden');
  };
}

export function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

export function openConfirmModal(message, onConfirm) {
  openModal('Confirm', `<p>${message}</p>`, onConfirm);
}
