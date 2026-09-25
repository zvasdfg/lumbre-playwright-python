import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumbre | Laboratorio de cocina al fuego",
  description: "Conocimiento, recetas y protocolos para experimentar alrededor del fuego.",
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
      <body>{children}</body>
    </html>
  );
}
