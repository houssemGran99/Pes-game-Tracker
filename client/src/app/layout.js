import "./globals.css";
import "./App.css";
import { Providers } from "../components/Providers";

export const metadata = {
  title: "PES 6 Tracker",
  description: "Track your PES 6 matches",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
