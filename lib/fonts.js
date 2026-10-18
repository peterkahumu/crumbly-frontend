import { Inter, Poppins } from "next/font/google";

// Warm, friendly type pairing: Poppins for headings, Inter for body copy.
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});
