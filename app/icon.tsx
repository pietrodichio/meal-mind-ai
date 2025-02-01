import { UtensilsCrossed } from "lucide-react";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
        }}
      >
        <UtensilsCrossed
          style={{ width: "24px", height: "24px", color: "#000" }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
