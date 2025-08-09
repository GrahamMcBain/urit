export const dynamic = 'force-dynamic';

import { ImageResponse } from "next/og";

export async function GET() {
  const title = process.env.NEXT_PUBLIC_MINI_APP_NAME || "Tag";
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 800 }}>{title}</div>
        <div style={{ fontSize: 28, marginTop: 16 }}>Play now</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
