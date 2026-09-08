const ANEXO_DATA_URL_REGEX = /^data:(image\/(png|jpe?g|webp|gif)|application\/pdf);base64,/;
const MAX_ANEXO_LENGTH = 3_000_000; // ~2.1MB decodificado

// anexo undefined -> não mexe no anexo existente; anexo null -> remove o anexo.
// Só valida formato/tamanho quando um novo anexo está sendo enviado.
function validateAnexoInput({ anexo, anexoNome }) {
  if (anexo === undefined || anexo === null) return null;
  if (!ANEXO_DATA_URL_REGEX.test(anexo)) {
    return 'Formato de anexo inválido. Envie uma imagem ou PDF.';
  }
  if (anexo.length > MAX_ANEXO_LENGTH) {
    return 'Anexo muito grande (máximo ~2MB)';
  }
  if (!anexoNome || !String(anexoNome).trim()) {
    return 'Nome do anexo é obrigatório';
  }
  return null;
}

module.exports = { validateAnexoInput, ANEXO_DATA_URL_REGEX, MAX_ANEXO_LENGTH };
