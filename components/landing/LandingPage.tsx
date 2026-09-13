import Navbar from "./Navbar";
import Hero from "./Hero";
import Features from "./Features";
import HowItWorks from "./HowItWorks";
import ProductPreview from "./ProductPreview";
import Security from "./Security";
import About from "./About";
import FAQ from "./FAQ";
import FinalCTA from "./FinalCTA";
import Footer from "./Footer";
import { BRAND } from "./lp-tokens";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Finlo",
      url: "https://finlo.site",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      description:
        "Finlo helps you track expenses, manage income, organize recurring bills, and understand your finances in one simple dashboard.",
      author: {
        "@type": "Organization",
        name: "ELVA",
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free to get started",
      },
    },
    {
      "@type": "WebSite",
      name: "Finlo",
      url: "https://finlo.site",
      description:
        "Personal finance and expense management dashboard. A product by ELVA.",
      publisher: {
        "@type": "Organization",
        name: "ELVA",
      },
      inLanguage: "en",
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          background: BRAND.bg,
          color: BRAND.text,
          overflow: "hidden",
          transition: "background 0.3s ease, color 0.3s ease",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -220,
            left: "12%",
            width: 620,
            height: 620,
            borderRadius: 999,
            background: "radial-gradient(circle, rgba(82,109,223,0.22) 0%, transparent 62%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 160,
            right: "-160px",
            width: 520,
            height: 520,
            borderRadius: 999,
            background: "radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 62%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Navbar />
          <main id="main">
            <Hero />
            <Features />
            <HowItWorks />
            <ProductPreview />
            <Security />
            <About />
            <FAQ />
            <FinalCTA />
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
}