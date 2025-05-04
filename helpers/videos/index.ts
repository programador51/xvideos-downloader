import mime from "mime-types"

async function retrieveChunks(url) {
  const res = await fetch(url)

  const chunksTextData = await res.text()

  const chunkData = chunksTextData.split("\n")
  const tsFiles = chunkData
    .filter((item) => item[0] !== "#")
    .filter((item) => item !== "")

  if (tsFiles === undefined || tsFiles === null) return []

  return tsFiles
}

async function downloadChunk(url) {
  console.log(url)

  try {
    const res = await fetch(url, {
      mode: "no-cors"
    })

    const fileChunk = await res.blob()

    return new File([fileChunk], `${url}`, {
      type: fileChunk.type
    })
  } catch (error) {
    console.log(error)
    return null
  }
}

/**
 *
 * @param url - Url where the overview of the video is
 */
export async function retrieveVideoQualitys(url: string) {
  const res = await fetch(url)
  const overviewFile = await res.text()
  const linesOfText = overviewFile.split("\n")

  const qualitys = linesOfText
    .filter((line) => line[0] !== "#")
    .filter((item) => item !== "")

  const overview = qualitys.map((filename) => {
    const info = filename.split("-")

    return {
      quality: info[1],
      chunksOverviewFilename: filename
    }
  })

  return overview
}

export function downloadBlob(blob: Blob,filename=`${window.crypto.randomUUID()}`): void {
  const extension = mime.extension(blob.type)

  // Create a link element
  const link = document.createElement("a")

  // Create a Blob URL
  const url = URL.createObjectURL(blob)

  // Set the download attribute with the desired file name
  link.href = url
  link.download = `${filename}.${extension}`

  // Programmatically trigger the download by clicking the link
  link.click()

  // Clean up the URL object
  URL.revokeObjectURL(url)
}

export async function mergeTsFiles(filesArray: File[]): Promise<Blob> {
  // Read all files as ArrayBuffers
  const buffers: ArrayBuffer[] = await Promise.all(
    filesArray.map((file) => file.arrayBuffer())
  )

  // Calculate total size
  const totalLength: number = buffers.reduce(
    (sum, buffer) => sum + buffer.byteLength,
    0
  )

  // Create a new Uint8Array to hold all merged data
  const mergedArray = new Uint8Array(totalLength)

  let offset = 0
  for (const buffer of buffers) {
    mergedArray.set(new Uint8Array(buffer), offset)
    offset += buffer.byteLength
  }

  // Create a single Blob
  const mergedBlob = new Blob([mergedArray], { type: "video/mp2t" })

  return mergedBlob
}

/**
 * 1. THIS JUST WORKS ON THE BACKGROUND SCRIPT SINCE THE CDN BLOCK THE CORS
 * 2. THIS JUST DOWNLOADS THE VIDEO BUT DOESN'T SAVE ON THE USER DEVICE
 *
 * Download an item from XVideos
 * @param {string} quality - Quality of the video to download
 */
export async function downloadVideo(
  url: string,
  quality = 1080
): Promise<string[]> {
  const overviews = await retrieveVideoQualitys(url)

  const item = overviews.find((item) => item.quality === `${quality}p`)

  const urlChunks = url.replace("hls.m3u8", item.chunksOverviewFilename)

  const chunkNames = await retrieveChunks(urlChunks)

  const chunks = await Promise.all(
    chunkNames.map((chunk) =>
      downloadChunk(`${url.replace("hls.m3u8", chunk)}`)
        .then((file) => blobToBase64(file))
        .then((serialized) => serialized)
        .catch(() => null)
    )
  )

  return chunks.filter((item) => item !== null)
}

export async function downloadVideoV2(
  url: string,
  quality = 1080,
  onProgress?: (progress: {
    current: number
    total: number
    chunk: string | null
  }) => void
): Promise<string[]> {
  const overviews = await retrieveVideoQualitys(url)
  const qualityToSearch = `${quality}p`; 

  const parsedOverviews = overviews.map(item=>({
    ...item,
    quality:item.quality.replace(".m3u8","")
  }))
  
  const item = parsedOverviews.find((item) => item.quality === `${quality}p`.replace('.m38u',""))

  if (!item) throw new Error("Requested quality not found")

  const urlChunks = url.replace("hls.m3u8", item.chunksOverviewFilename)
  const chunkNames = await retrieveChunks(urlChunks)

  const results: (string | null)[] = []

  let current = 0
  for (const chunk of chunkNames) {
    try {
      const file = await downloadChunk(`${url.replace("hls.m3u8", chunk)}`)
      const serialized = await blobToBase64(file)
      results.push(serialized)
      current++
      onProgress?.({ current, total: chunkNames.length, chunk: serialized })
    } catch (err) {
      results.push(null)
      current++
      onProgress?.({ current, total: chunkNames.length, chunk: null })
    }
  }

  return results.filter((item) => item !== null)
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      resolve(reader.result as string)
    }

    reader.onerror = (error) => reject(error)

    // Read the Blob as a Data URL (Base64)
    reader.readAsDataURL(blob)
  })
}

export function base64ToFile(dataUrl, fileName) {
  // Remove the prefix (e.g., "data:video/mp2t;base64,")
  const base64String = dataUrl.split(",")[1]

  // Decode the base64 string
  const byteCharacters = atob(base64String)
  const byteArrays = []

  for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
    const slice = byteCharacters.slice(offset, offset + 1024)
    const byteNumbers = new Array(slice.length)

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }

    byteArrays.push(new Uint8Array(byteNumbers))
  }

  // Create a Blob and then a File object
  const blob = new Blob(byteArrays, { type: "video/mp2t" })
  const file = new File([blob], fileName, { type: "video/mp2t" })
  return file
}
