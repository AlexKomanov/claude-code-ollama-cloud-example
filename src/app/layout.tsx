import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MSWProvider } from "@/components/shared/MSWProvider";
import { RealtimeProvider } from "@/components/shared/RealtimeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trello Clone",
  description: "A high-performance Trello-style ticketing system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <MSWProvider>
          <RealtimeProvider>
            {children}
          </RealtimeProvider>
        </MSWProvider>
      </body>
    </html>
  );
}
