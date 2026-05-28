import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edén | Barra de Ensaladas y Jugos",
  description: "Ordena en línea las ensaladas, jugos y smoothies más frescos y deliciosos de Edén. Recoge en mostrador y disfruta de comida saludable con sabor casero.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
