import "./globals.css";

export const metadata = {
  title: "Weekly To-Do",
  description: "Minimal weekly todo planner",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
