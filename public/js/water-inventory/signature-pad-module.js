export function initSignaturePad({
  canvasId,
  clearBtnId,
  hiddenInputId,
  formId,
  modalIds = []
} = {}) {
  if (typeof SignaturePad === 'undefined') {
    console.error("SignaturePad library not loaded. Please include the CDN first.");
    return;
  }

  const canvas = document.getElementById(canvasId);
  const clearBtn = document.getElementById(clearBtnId);
  const hiddenInput = document.getElementById(hiddenInputId);
  const form = document.getElementById(formId);

  if (!canvas || !clearBtn || !hiddenInput || !form) {
    console.error(`Signature Pad: Missing elements for canvasId: ${canvasId}`);
    return;
  }

  const signaturePad = new SignaturePad(canvas, {
    backgroundColor: '#ffffff',
    penColor: 'black'
  });

  function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
    signaturePad.clear();
  }

  modalIds.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.warn(`Modal with ID "${modalId}" not found.`);
      return;
    }
    modal.addEventListener('shown.bs.modal', () => {
      resizeCanvas();
    });
  });

  window.addEventListener("resize", () => {
    const anyModalOpen = modalIds.some(id => {
      const modal = document.getElementById(id);
      return modal && modal.classList.contains('show');
    });

    if (anyModalOpen) {
      const data = signaturePad.toData();
      resizeCanvas();
      signaturePad.fromData(data);
    }
  });

  clearBtn.addEventListener('click', () => signaturePad.clear());

  form.addEventListener('submit', () => {
    hiddenInput.value = signaturePad.isEmpty() ? "" : signaturePad.toDataURL();
  });

  return signaturePad;
}
