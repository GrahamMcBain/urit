import type { Metadata } from "next";

import { getSession } from "../auth"
import "./globals.css";
import { Providers } from "./providers";
import { APP_DESCRIPTION } from "../lib/constants";

const metadataBaseUrl = process.env.NEXT_PUBLIC_URL ? new URL(process.env.NEXT_PUBLIC_URL) : undefined;

export const metadata: Metadata = {
  title: `Tag - Play the Game`,
  description: APP_DESCRIPTION,
  metadataBase: metadataBaseUrl,
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
    shortcut: '/icon.svg',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {  
  const session = await getSession()

  return (
    <html lang="en">
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
