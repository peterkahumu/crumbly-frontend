import { Html, Head, Main, NextScript } from "next/document";
import { inter, poppins } from "@/lib/fonts";

export default function Document() {
  return (
    <Html lang="en" className={`${inter.variable} ${poppins.variable}`} data-scroll-behavior="smooth">
      <Head />
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
