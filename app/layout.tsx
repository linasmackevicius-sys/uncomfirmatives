import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/sidebar";
import Breadcrumbs from "@/components/breadcrumbs";

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
          <div className="app-body">
            <Sidebar />
            <div className="main-wrapper">
              <header className="header-bar">
                <Breadcrumbs />
                <div className="header-actions">
                  <input
                    className="header-search"
                    placeholder="Search..."
                    readOnly
                  />
                  <div className="header-user">U</div>
                </div>
              </header>
              <main className="main">{children}</main>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
