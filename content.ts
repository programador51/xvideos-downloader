import ad from "data-base64:~assets/ad.png"
import styleText from "data-text:~/style.scss"
import Swal from "sweetalert2"
import { Storage } from "@plasmohq/storage"
import { wait } from "~helpers/dom"
import { base64ToFile, downloadBlob, mergeTsFiles } from "~helpers/videos"
import type { Action, ChunkDownloaded } from "~types"

const ID_CONTAINER = `${window.crypto.randomUUID()}`
const ID_PROGESS_DOWNLOAD = `progressBar`

let hasPremium = false

;(async function () {
  const storage = new Storage()
  const data = (await storage.get("hasPremium")) as boolean
  hasPremium = data
})()

let QUALITYS: ChunkDownloaded[] = []

injectCustomScss()
appendContainerButtonsDownload()
requestAvailableQualitys()
appendDownloadProgress()
removeDefaultDownload()
// removeDefaultAds();

window.onload = function () {
  removeDefaultAds()
}

chrome.runtime.onMessage.addListener((msg: Action) => {
  switch (msg.type) {
    // Message received when extension gives the information of which qualitys can be requested
    case "qualitysVideo":
      const qualitys = msg.payload
        .map((item) => {
          const [dimention] = item.quality.split("p")
          return +dimention
        })
        .sort((a, b) => a - b)

      qualitys.forEach((quality) => addDownloadButton(quality))
      return

    // Message received when extension gives a chunk item for the requested video
    case "saveVideo":
      saveChunk(msg.payload)
  }
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function redirectToPurchase() {
  window.open(
    "https://telegram-downloader-shop-jade.vercel.app?xvideos=1",
    "_blank"
  )
}

function toggleBlockDownloads(disable = true) {
  const container = document.getElementById(ID_CONTAINER) as HTMLDivElement
  const buttons = container.querySelectorAll("button") // selecciona todos los botones dentro

  buttons.forEach((btn) => (btn.disabled = disable))
}

function appendMyOwnAds() {
  // const ads = document.getElementById("video-right").nextElementSibling

  // const FANSLY_LINK = "https://fans.ly/packsmexico"

  // const adImage = document.createElement("img")
  // adImage.src = aleja
  // adImage.classList.add("fanslyAd")
  // adImage.addEventListener("click", () => window.open(FANSLY_LINK, "_blank"))
  // ads.appendChild(adImage)

  // const fanslyLink = document.createElement("a")
  // fanslyLink.textContent = "SEXCAM NOW!"
  // fanslyLink.href = FANSLY_LINK
  // fanslyLink.classList.add("fanslyAdLink")
  // ads.appendChild(fanslyLink)

  const bannerAd = document.createElement("div")
  const imgBanner = document.createElement("img")
  imgBanner.src = ad
  document.body.appendChild(bannerAd)
  bannerAd.appendChild(imgBanner)
  bannerAd.addEventListener("click", () => redirectToPurchase())
  bannerAd.classList.add("customAd")
}

async function removeDefaultAds() {
  const ads = document.getElementById("video-right").nextElementSibling

  const footerAd = document.getElementById("ad-footer")

  if (ads.id === "video-player-bg") {
    await wait(500)
    return removeDefaultAds()
  }

  footerAd.remove()

  if (hasPremium) {
    ads.remove()
    return
  }

  const children = ads.children

  // Loop over the children in reverse order (so removing elements doesn't affect the loop)
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i]

    // Skip removal if the child is a <style> tag, or if the child has the 'style' attribute
    if (child.tagName !== "STYLE" && !child.hasAttribute("style")) {
      ads.removeChild(child) // Remove the child if it doesn't have the style attribute or isn't a <style> tag
    }
  }

  appendMyOwnAds()
}

function removeDefaultDownload() {
  const videoDownlaod =
    document.getElementById(`anc-tst-params-btn`).nextElementSibling
  videoDownlaod.remove()
}

function appendContainerButtonsDownload() {
  const container = document.getElementById("v-actions")
  const containerDownloadButtons = document.createElement("div")
  containerDownloadButtons.id = ID_CONTAINER
  containerDownloadButtons.classList.add("container-download")
  container.appendChild(containerDownloadButtons)
}

function updateDownloadProgess(totalChunks: number, currentChunks: number) {
  const buttonsDownload = document.getElementById(ID_CONTAINER)

  buttonsDownload.classList.add("hide")

  const progressBar = document.getElementById(
    `container-${ID_PROGESS_DOWNLOAD}`
  ) as HTMLDivElement
  progressBar.classList.remove("hide")

  const progressInput = document.getElementById(
    ID_PROGESS_DOWNLOAD
  ) as HTMLInputElement

  const percentage = (currentChunks / totalChunks) * 100

  const integerPercentage = +`${percentage}`.split(".")[0]

  progressInput.setAttribute("value", `${integerPercentage}`)
}

function saveChunk(chunk: ChunkDownloaded) {
  updateDownloadProgess(chunk.totalChunks, QUALITYS.length)

  QUALITYS.push(chunk)

  // Chunks not downloaded 100%
  if (QUALITYS[0].totalChunks !== QUALITYS.length) return

  // Sort by numberOfChunk (ascending order)
  QUALITYS.sort((a, b) => a.numberOfChunk - b.numberOfChunk)

  const chunksParsed = QUALITYS.map((item) =>
    base64ToFile(item.base64, item.numberOfChunk)
  )

  const domTitle = document.getElementById(`title-auto-tr`);
  const subDomTitle = document.getElementsByClassName('page-title');

  let filename = `${window.crypto.randomUUID()}`;

  if(domTitle!==null) filename = domTitle.textContent;
  if(subDomTitle!==null) filename = subDomTitle[0].textContent;

  // const filename = domTitle === null ? window.crypto.randomUUID(): domTitle.textContent;

  mergeTsFiles(chunksParsed).then((file) => downloadBlob(file,filename))

  resetProgressDownload()
}

function resetProgressDownload() {
  QUALITYS = [];


  const progressBar = document.getElementById(
    `container-${ID_PROGESS_DOWNLOAD}`
  ) as HTMLDivElement

  const progressInput = document.getElementById(
    ID_PROGESS_DOWNLOAD
  ) as HTMLInputElement

  const buttonsDownload = document.getElementById(ID_CONTAINER)

  buttonsDownload.classList.remove("hide")

  progressBar.classList.add("hide")

  progressInput.setAttribute("value", "0")

  toggleBlockDownloads(false)
}

function appendDownloadProgress() {
  const html = `  <div class="progress-container hide" id="container-${ID_PROGESS_DOWNLOAD}">
    <input type="range" id="${ID_PROGESS_DOWNLOAD}" min="0" max="100">
    <p class="thinking">Downloading</p>
  </div>`

  document.body.insertAdjacentHTML("afterend", html)
  const progressBar = document.getElementById(
    ID_PROGESS_DOWNLOAD
  ) as HTMLInputElement

  function updateBackground() {
    const value = progressBar.value
    const styles = `background:linear-gradient(to right, #4caf50 ${value}%, #ddd ${value}%) !important;`
    progressBar.setAttribute("style", styles)
  }

  progressBar.addEventListener("input", updateBackground)

  // Observer to detect changes made to value programmatically
  const observer = new MutationObserver(() => {
    updateBackground() // Call the same updateBackground function when value changes
  })

  // Observe 'value' attribute for changes
  observer.observe(progressBar, {
    attributes: true,
    attributeFilter: ["value"]
  })
}

async function getAvailableDomains() {
  const res = await fetch(window.location.hostname)
  const html = await res.text()

  const match = html.match(/html5player\.setVideoHLS\(['"]([^'"]+)['"]\)/)

  if (!match) return null

  const url = match[1]

  return url
}

async function eventDownloadVideo(quality: number) {
  toggleBlockDownloads(true)

  const url = await getAvailableDomains()

  if (!hasPremium && quality >= 1080) {
    toggleBlockDownloads(false)

    const adRes = await Swal.fire({
      title: "Premium feature",
      showConfirmButton: true,
      confirmButtonText: "Donate right now!",
      showDenyButton: true,
      denyButtonText: "Nah, I pass, cancel",
      html: `
          <p style="font-size: 15px; line-height: 1.6; margin:0;">
Sorry, if you want to use this feature, you must donate a fee of <strong>$9.00 USD</strong> to unblock full access to the extension and remove all the existing ads.
</p>`
    })

    if (adRes.isConfirmed) redirectToPurchase()

    return
  }

  chrome.runtime.sendMessage({
    type: "downloadVideo",
    payload: {
      quality,
      url
    }
  } as Action)
}

function addDownloadButton(quality: number) {
  const container = document.getElementById(ID_CONTAINER)

  const downloadIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
</svg>`

  if (!container) return

  const id = window.crypto.randomUUID()

  const downloadButton = document.createElement("button")

  downloadButton.id = id
  downloadButton.innerHTML = `${quality}p ${downloadIcon}`
  downloadButton.classList.add("download")
  downloadButton.addEventListener("click", () => eventDownloadVideo(quality))

  container.appendChild(downloadButton)
}

function requestAvailableQualitys() {
  getAvailableDomains().then((url) =>
    chrome.runtime.sendMessage({
      type: "overviewVideo",
      payload: url
    })
  )
}

export function injectCustomScss() {
  const style = document.createElement("style")
  style.id = "xvideos-styles"
  style.textContent = styleText
  document.head.appendChild(style)
  return style
}
