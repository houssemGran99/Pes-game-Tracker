import "./globals.css";
import "./App.css";
import { Providers } from "../components/Providers";
import localFont from "next/font/local";

const atari = localFont({
  src: "./fonts/AtariClassic.ttf",
  variable: "--font-atari",
  display: "swap",
});

export const metadata = {
  title: "PES 6 Tracker",
  description: "Track your PES 6 matches",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${atari.variable}`}>
      <body suppressHydrationWarning={true}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
