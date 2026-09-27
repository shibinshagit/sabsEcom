export const SITE_NAME = "Sabs Online Store"
export const SITE_SHORT_NAME = "Sabs Online"
export const SITE_DEFAULT_URL = "https://sabsonlinestore.com"

export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    SITE_DEFAULT_URL
  return raw.replace(/\/$/, "")
}

export const DEFAULT_TITLE =
  "Sabs Online Store | Beauty, Skincare & Cosmetics in UAE & India"

export const DEFAULT_DESCRIPTION =
  "Shop authentic Sabs beauty and skincare products online — serums, creams, sun care, and more. Delivering across UAE (AED) and India (INR) with trusted quality since 2015."

export const DEFAULT_KEYWORDS = [
  "Sabs Online",
  "Sabs beauty products",
  "buy skincare online UAE",
  "buy cosmetics India",
  "hair serum",
  "whitening cream",
  "sun spray SPF",
  "perfume online",
  "beauty store Dubai",
  "Sabs Online Store",
]
