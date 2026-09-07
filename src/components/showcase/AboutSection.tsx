import React from 'react';
import { Store as StoreInfo } from '../../types';

interface AboutSectionProps {
  store: StoreInfo;
  isTr: boolean;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ store, isTr }) => {
  return (
    <section id="about" className="bg-gray-50 p-8 rounded-2xl">
      <h2 className="text-3xl font-semibold text-gray-900 mb-6">
        {isTr ? "Hakkımızda" : "About Us"}
      </h2>
      <p className="text-gray-600 leading-relaxed">
        {store.about_text}
      </p>
    </section>
  );
};
