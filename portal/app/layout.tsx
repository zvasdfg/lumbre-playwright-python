import type { Metadata } from "next";
import { Exo, Mulish } from "next/font/google";
import "./globals.css";

const exo = Exo({
  variable: "--font-exo",
  subsets: ["latin"],
});

const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumbre | Fuego y vida outdoor",
  description: "Equipo, recetas y encuentros para quienes viven alrededor del fuego.",
  icons: {
    icon: "/brand/lumbre-mark-red.png",
    shortcut: "/brand/lumbre-mark-red.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body
        className={`${exo.variable} ${mulish.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
