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
  title: "Raptor Solutions",
  description: "Panel de gestión de licencias y proyectos de negocio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-theme="orange"
      data-base-path={process.env.NEXT_PUBLIC_BASE_PATH ?? ""}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var r=document.documentElement;var base=r.getAttribute("data-base-path")||"";var p=window.location.pathname;var norm=p.length>1&&p.endsWith("/")?p.slice(0,-1):p;var landing=base||"/";var landingNorm=landing.length>1&&landing.endsWith("/")?landing.slice(0,-1):landing;if(norm===landingNorm||(landingNorm===""&&norm==="/")){r.classList.remove("dark","neon");r.setAttribute("data-theme","landing");return;}var m=localStorage.getItem("gestor-theme-mode");r.classList.remove("dark","neon");var t=m==="light"||m==="dark"||m==="neo"||m==="orange"?m:(m==="neon"?"neo":"orange");r.setAttribute("data-theme",t);if(t==="dark"||t==="neo")r.classList.add("dark");if(t==="neo")r.classList.add("neon");}catch(e){}})();`,
          }}
        />
        <ThemeProvider>
          <ToastProvider placement="top" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
