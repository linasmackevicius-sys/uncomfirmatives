import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Uncomfirmatives",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app">
          <header className="titlebar">
            <h1>UNCOMFIRMATIVES</h1>
          </header>
          <div className="app-body">
            <Sidebar />
            <main className="main">{children}</main>
          </div>
          <footer className="statusbar">Uncomfirmatives v0.1.0</footer>
        </div>
      </body>
    </html>
  );
}
