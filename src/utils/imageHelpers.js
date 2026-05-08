const MAX_IMAGE_DIMENSION = 1024
const MAX_IMAGE_BYTES = 1200000
const MIN_QUALITY = 0.45
const QUALITY_STEP = 0.05

const createCanvasDataUrl = (image, width, height, type, quality) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(image, 0, 0, width, height)
  return canvas.toDataURL(type, quality)
}

const getResizeDimensions = (width, height, maxWidth, maxHeight) => {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}

export const compressImageFile = (file, options = {}) => {
  const {
    maxWidth = MAX_IMAGE_DIMENSION,
    maxHeight = MAX_IMAGE_DIMENSION,
    maxBytes = MAX_IMAGE_BYTES,
    initialQuality = 0.75,
    outputType = 'image/jpeg',
  } = options

  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('File is not a supported image.'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Unable to read the image file.'))
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        let { width, height } = getResizeDimensions(image.width, image.height, maxWidth, maxHeight)
        let quality = initialQuality
        let dataUrl = createCanvasDataUrl(image, width, height, outputType, quality)

        while (dataUrl.length > maxBytes && quality > MIN_QUALITY) {
          quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP)
          dataUrl = createCanvasDataUrl(image, width, height, outputType, quality)
        }

        if (dataUrl.length > maxBytes) {
          // Try reducing dimensions further if quality cannot shrink it enough.
          let shrinkFactor = 0.85
          while (dataUrl.length > maxBytes && width > 128 && height > 128) {
            width = Math.max(128, Math.round(width * shrinkFactor))
            height = Math.max(128, Math.round(height * shrinkFactor))
            dataUrl = createCanvasDataUrl(image, width, height, outputType, quality)
          }
        }

        if (dataUrl.length > maxBytes) {
          reject(new Error('Image is too large to store in browser settings. Use a smaller file.'))
          return
        }

        resolve(dataUrl)
      }
      image.onerror = () => reject(new Error('Unsupported image format or corrupt file.'))
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
