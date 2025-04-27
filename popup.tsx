import "~popup.scss"
import ad from "data-base64:~assets/ad.png"

function IndexPopup() {
  return (
    <div className="container">
      <h1 className="text-center">XVideos downloader</h1>
      <p className="text-center">
        <strong>v1.0.0</strong>
      </p>

      <p className="text-center">To open the settings</p>
      <ol className="text-center">
        <li>Right clic on the extension's icon</li>
        <li>Clic on Options</li>
      </ol>

      <a className="bannerPopup" href="https://telegram-downloader-shop-jade.vercel.app?xvideos=1">
        <img src={ad} alt="kofi_page" />
      </a>
    </div>
  )
}

export default IndexPopup
