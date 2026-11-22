import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#b8381f",
          borderRadius: "40px",
        }}
      >
        <svg viewBox="0 0 32 32" width="116" height="116">
          <polygon
            points="16,7.3 18.35,13.26 24.75,13.66 19.8,17.74 21.41,23.94 16,20.5 10.59,23.94 12.2,17.74 7.25,13.66 13.65,13.26"
            fill="#f8f5ef"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
