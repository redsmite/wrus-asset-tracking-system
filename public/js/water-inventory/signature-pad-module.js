export function initSignaturePad({
  canvasId = "signatureCanvas",
  clearBtnId = "clearSignature",
  hiddenInputId = "modalSignature",
  formId = "modalForm"
} = {}) {
  if (typeof SignaturePad === 'undefined') {
    console.error("❌ SignaturePad library not loaded. Please include the CDN first.");
    return;
  }

  const canvas = document.getElementById(canvasId);
  const clearBtn = document.getElementById(clearBtnId);
  const hiddenInput = document.getElementById(hiddenInputId);
  const form = document.getElementById(formId);

  if (!canvas || !clearBtn || !hiddenInput || !form) {
    console.error("❌ Signature Pad: One or more required elements not found.");
    return;
  }

  const signaturePad = new SignaturePad(canvas, {
    backgroundColor: 'rgba(255, 255, 255, 0)',
    penColor: 'black'
  });

  function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
    signaturePad.clear();
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  clearBtn.addEventListener('click', () => {
    signaturePad.clear();
  });

  form.addEventListener('submit', () => {
    if (!signaturePad.isEmpty()) {
      hiddenInput.value = signaturePad.toDataURL();
    } else {
      hiddenInput.value = "";
    }
  });

  return signaturePad;
}
