import Head from "next/head";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";

export default function PublicLayout({ title, description, children }) {
  const pageTitle = title ? `${title} | Crumbly` : "Crumbly — Handmade Cakes from Local Bakers";

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description || "Order custom cakes, cupcakes and desserts from independent bakers near you."} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="flex min-h-screen flex-col bg-cream-50">
        <Navbar />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <Footer />
        <MobileBottomNav />
      </div>
    </>
  );
}
