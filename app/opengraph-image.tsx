import { ImageResponse } from "next/og"

export const alt = "Sabs Online Store — beauty and skincare delivered in the UAE and India"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #2c241c 0%, #6d5642 48%, #c4a484 100%)",
          color: "#fffaf4",
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 8, textTransform: "uppercase" }}>
          Since 2015 · Dubai and India
        </div>
        <div style={{ fontSize: 78, fontWeight: 700, marginTop: 18, lineHeight: 1.05 }}>
          Sabs Online Store
        </div>
        <div style={{ fontSize: 34, marginTop: 22 }}>Beauty, skincare and cosmetics</div>
        <div style={{ fontSize: 28, marginTop: 28 }}>Free shipping over AED 200 / ₹3000</div>
      </div>
    ),
    { ...size },
  )
}
