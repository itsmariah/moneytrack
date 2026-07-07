export function resizeImage(file, maxSize = 256, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > height) {
          if (width > maxSize) {
            height = Math.round(height * (maxSize / width))
            width = maxSize
          }
        } else if (height > maxSize) {
          width = Math.round(width * (maxSize / height))
          height = maxSize
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => reject(new Error('Não foi possível ler a imagem'))
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo'))
    reader.readAsDataURL(file)
  })
}
