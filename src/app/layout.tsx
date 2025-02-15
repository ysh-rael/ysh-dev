import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../../lib/css/bulma@1.0.2/bulma.min.css";
import Header from "@/partial/header";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ysh-Dev",
  description: "Yshrael: Software Developer",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className={inter.className}>
          <Header/>

          <div className="container-content-app single-page">
          {children}
          </div>
      
        <Script src="https://kit.fontawesome.com/ed21d56832.js" crossOrigin="anonymous" ></Script>
      </body>
    </html>
  );
}
