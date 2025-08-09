import { Metadata } from "next";
import App from "./app";
import { APP_DESCRIPTION, APP_OG_IMAGE_URL } from "../lib/constants";
import { getMiniAppEmbedMetadata } from "../lib/utils";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Tag - Play Urit`,
    openGraph: {
      title: `Tag - Play Urit`,
      description: APP_DESCRIPTION,
      images: [APP_OG_IMAGE_URL],
    },
    other: {
      "fc:miniapp": JSON.stringify(getMiniAppEmbedMetadata()),
      "fc:frame": JSON.stringify(getMiniAppEmbedMetadata()),
    },
  };
}

export default function Home() {
  return (<App />);
}
