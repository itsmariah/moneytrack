import { resizeImage } from './resizeImage'

export const MAX_ANEXO_LENGTH = 3_000_000 // precisa bater com backend/utils/validateAnexo.js
const MAX_IMAGE_RAW_BYTES = 8 * 1024 * 1024
const MAX_PDF_RAW_BYTES = 2 * 1024 * 1024

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo'))
    reader.readAsDataURL(file)
  })
}

// Imagem é redimensionada (como a foto de perfil, só que num tamanho maior — comprovante
// precisa ficar legível); PDF não pode ser redimensionado, então só valida o tamanho bruto.
export async function processAnexoFile(file) {
  const isImage = file.type.startsWith('image/')
  const isPdf = file.type === 'application/pdf'
  if (!isImage && !isPdf) {
    throw new Error('Formato não suportado. Envie uma imagem ou PDF.')
  }
  if (isImage && file.size > MAX_IMAGE_RAW_BYTES) {
    throw new Error('Imagem muito grande (máximo 8MB)')
  }
  if (isPdf && file.size > MAX_PDF_RAW_BYTES) {
    throw new Error('PDF muito grande (máximo 2MB)')
  }
  return isImage ? resizeImage(file, 1400, 0.75) : readFileAsDataUrl(file)
}
