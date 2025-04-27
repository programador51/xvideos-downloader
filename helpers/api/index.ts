export async function checkVipOnServer(licenseCode: string) {
  const regex =
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i

  if (regex.test(licenseCode) === false) {
    return false
  }

  const res = await fetch(
    `https://telegram-downloader-shop-jade.vercel.app/api/v1/donation/validate?search=${licenseCode}`
  )

  if (res.status === 200) return true

  return false
}
