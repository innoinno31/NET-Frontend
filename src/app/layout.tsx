import type { Metadata } from "next";
import "./globals.css";
import '@rainbow-me/rainbowkit/styles.css';
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Providers } from '../../utils/providers';


export const metadata: Metadata = {
  title: "NET Website",
  description: "Nuclear equipment tracability",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow px-6 lg:px-10 xl:px-16 py-4 bg-gray-50">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
