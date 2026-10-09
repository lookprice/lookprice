import React from 'react';

interface ContactSectionProps {
  store: any;
  isTr: boolean;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ store, isTr }) => {
  return (
    <section id="contact" className="bg-gray-900 text-white p-8 rounded-2xl">
      <h2 className="text-3xl font-semibold mb-6">
        {isTr ? "İletişim" : "Contact"}
      </h2>
      <p>{store.address}</p>
      <p>{store.email}</p>
      <p>{store.phone}</p>
    </section>
  );
};
