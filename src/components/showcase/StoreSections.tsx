import React from "react";
import { HeroSection } from "./HeroSection";
import { FeaturedSection } from "./FeaturedSection";
import { BlogSection } from "./BlogSection";
import { AboutSection } from "./AboutSection";
import { ContactSection } from "./ContactSection";
import { RadarShowcaseSlider } from "../RadarShowcaseSlider";

interface StoreSectionsProps {
  store: any;
  featuredProducts: any[];
  t: any;
  addToBasket: (product: any) => void;
  setSelectedProduct: (product: any) => void;
  setSelectedBlogPost: (post: any) => void;
  primaryColor: string;
  isLuxury: boolean;
  sector: string;
  isTr: boolean;
  radarNews: any[];
  lang: string;
}

export const StoreSections: React.FC<StoreSectionsProps> = ({
  store,
  featuredProducts,
  t,
  addToBasket,
  setSelectedProduct,
  setSelectedBlogPost,
  primaryColor,
  isLuxury,
  sector,
  isTr,
  radarNews,
  lang
}) => {
  if (!store?.page_layout || store.page_layout.length === 0) return null;

  return (
    <div className="space-y-24">
      {store.page_layout.map((section: any) => {
        switch (section.type) {
          case "hero":
            return <HeroSection key={section.id} store={store} />;
          case "featured":
            return (
              <FeaturedSection
                key={section.id}
                store={store}
                featuredProducts={featuredProducts}
                t={t}
                addToBasket={addToBasket}
                onView={setSelectedProduct}
                primaryColor={primaryColor}
                isLuxury={isLuxury}
                sector={sector}
              />
            );
          case "blog":
            return (
              <BlogSection
                key={section.id}
                store={store}
                isTr={isTr}
                onSelectPost={setSelectedBlogPost}
              />
            );
          case "news":
            if (!radarNews || radarNews.length === 0) return null;
            return (
              <section key={section.id} className="py-6 border-t border-slate-150 bg-slate-50/50 px-4">
                <RadarShowcaseSlider radarNews={radarNews} lang={lang} theme="light" />
              </section>
            );
          case "about":
            return (
              <AboutSection
                key={section.id}
                store={store}
                isTr={isTr}
              />
            );
          case "contact":
            return (
              <ContactSection
                key={section.id}
                store={store}
                isTr={isTr}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
};
