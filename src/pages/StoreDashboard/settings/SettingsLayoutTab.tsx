import React from "react";
import { PageBuilder } from "../../../components/PageBuilder";

interface SettingsLayoutTabProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
}

export const SettingsLayoutTab = ({
  branding,
  onBrandingChange,
}: SettingsLayoutTabProps) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Sayfa Düzeni</h3>
        <PageBuilder
          layout={branding?.page_layout || []}
          onUpdateLayout={(newLayout) => onBrandingChange("page_layout", newLayout)}
        />
      </div>
    </div>
  );
};
