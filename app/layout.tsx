import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@heroui/react";
import { ThemeProvider } from "@/src/shared/providers/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GestorPro",
  description: "Panel de licencias EdDeli",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem("gestor-theme-mode");var r=document.documentElement;if(m==="light"){}else if(m==="dark")r.classList.add("dark");else{r.classList.add("neon","dark");}}catch(e){}})();`,
          }}
        />
        <ThemeProvider>
          <ToastProvider placement="top end" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
