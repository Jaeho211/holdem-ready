import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Holdem Ready",
    short_name: "Holdem Ready",
    description:
      "라스베가스 라이브 홀덤을 준비하는 사람을 위한 모바일 우선 학습 앱",
    start_url: "/",
    display: "standalone",
    background_color: "#041711",
    theme_color: "#0b3b2e",
    orientation: "portrait",
    lang: "ko",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
