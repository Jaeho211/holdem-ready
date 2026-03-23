import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Holdem Ready",
    short_name: "Holdem Ready",
    description:
      "?쇱뒪踰좉????쇱씠釉???ㅼ쓣 ?꾪븳 紐⑤컮???숈뒿 ?뱀빋. ?꾨━?뚮엻, ?ъ뒪?명뵆?? ?뺣쪧, ?쇱씠釉??곸쓣 吏㏐쾶 諛섎났 ?숈뒿?⑸땲??",
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

