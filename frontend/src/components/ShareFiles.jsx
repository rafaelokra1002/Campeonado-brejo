import { useEffect, useState } from "react";
import Modal from "./admin/Modal.jsx";

function canShareFiles(type, name) {
  try {
    return typeof navigator.canShare === "function" && navigator.canShare({ files: [new File([""], name, { type })] });
  } catch {
    return false;
  }
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Compartilha pela folha nativa do aparelho quando dá; senão baixa o arquivo.
async function deliver(blob, filename, type, title) {
  const file = new File([blob], filename, { type });
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (e) {
      if (e?.name === "AbortError") return; // usuário cancelou
    }
  }
  download(blob, filename);
}

// Botão que abre uma janela com a prévia de uma imagem gerada e opções de
// compartilhar como imagem, PDF ou (opcional) texto.
//  - getFiles: () => Promise<{ png: Blob, pdf: Blob }>, chamado ao abrir a janela
//  - onText: se informado, mostra o botão de enviar como texto no WhatsApp
export default function ShareFilesButton({
  getFiles,
  filenameBase,
  modalTitle,
  shareTitle,
  loadingLabel = "Gerando a imagem...",
  onText,
  className,
  children,
}) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setFiles(null);
    setError("");
    getFiles()
      .then((result) => {
        if (cancelled) return;
        setFiles(result);
        setPreviewUrl(URL.createObjectURL(result.png));
      })
      .catch(() => !cancelled && setError("Não foi possível gerar a imagem agora. Tente novamente."));
    return () => { cancelled = true; };
    // gera de novo só quando a janela abre (não a cada atualização automática dos dados)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const shareImg = canShareFiles("image/png", "a.png");
  const sharePdf = canShareFiles("application/pdf", "a.pdf");

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>{children}</button>

      <Modal open={open} onClose={() => setOpen(false)} title={modalTitle}>
        {error ? (
          <div className="bg-red-500/10 text-red-400 text-sm rounded-xl px-3 py-2">{error}</div>
        ) : !files ? (
          <div className="py-10 text-center text-sm text-gray-400">
            <div className="w-8 h-8 border-4 border-white/10 border-t-brand rounded-full animate-spin mx-auto mb-3" />
            {loadingLabel}
          </div>
        ) : (
          <div className="space-y-4">
            <img src={previewUrl} alt="Prévia" className="w-full rounded-xl border border-white/10" />
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => deliver(files.png, `${filenameBase}.png`, "image/png", shareTitle)}
                className="btn-primary text-sm"
              >
                {shareImg ? "📤 Imagem" : "⬇️ Baixar imagem"}
              </button>
              <button
                type="button"
                onClick={() => deliver(files.pdf, `${filenameBase}.pdf`, "application/pdf", shareTitle)}
                className="btn-primary text-sm"
              >
                {sharePdf ? "📄 PDF" : "⬇️ Baixar PDF"}
              </button>
            </div>
            {onText && (
              <button type="button" onClick={onText} className="btn-ghost text-sm w-full">
                💬 Enviar como texto no WhatsApp
              </button>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
