import React from 'react';
import { 
  FileText, 
  Download, 
  Trash2, 
  Calendar, 
  AlertCircle 
} from 'lucide-react';
import { VehicleDocument, Vehicle } from '../../../types';

interface ObligationsTabProps {
  documents: VehicleDocument[];
  vehicles: Vehicle[];
  t: any;
  lang: string;
  isViewer: boolean;
  onDelete: (id: number) => void;
  safeFormatDate: (date: any, fmt: string) => string;
  getVehiclePlate: (id: number) => string;
}

export const ObligationsTab: React.FC<ObligationsTabProps> = ({
  documents,
  vehicles,
  t,
  lang,
  isViewer,
  onDelete,
  safeFormatDate,
  getVehiclePlate
}) => {
  const filteredDocs = documents.filter(d => ['Muayene', 'Sigorta', 'Kasko', 'Vergi'].includes(d.type));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
      {filteredDocs.map(d => (
        <div key={d.id} className="bg-white p-2.5 rounded-lg border border-slate-200 hover:shadow-sm transition-all group flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 bg-slate-50 rounded flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all border border-slate-100 shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-medium text-slate-900 text-[10px] truncate uppercase tracking-tighter leading-tight">{d.type}</h4>
                <span className="inline-flex px-1 bg-blue-50 text-blue-600 rounded text-[7px] font-medium uppercase border border-blue-100 mt-0.5 leading-none">
                  {getVehiclePlate(d.vehicle_id)}
                </span>
              </div>
            </div>
            {!isViewer && (
              <button
                onClick={() => onDelete(d.id)}
                className="p-1 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className={`p-2 rounded-lg mb-2 flex items-center justify-between border ${
            new Date(d.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              ? 'bg-red-50 text-red-700 border-red-100'
              : 'bg-green-50 text-green-700 border-green-100'
          }`}>
            <div className="flex flex-col">
              <span className="text-[6px] font-medium uppercase tracking-widest opacity-60 leading-tight">{t.expiryDate}</span>
              <span className="text-[10px] font-medium">{safeFormatDate(d.expiry_date, 'dd.MM.yyyy')}</span>
            </div>
            {new Date(d.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
              <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
            )}
          </div>

          {d.document_url && (
            <a 
              href={d.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-1 bg-slate-50 border border-slate-200 rounded text-[8px] font-medium text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all uppercase tracking-wider mt-auto text-center"
            >
              {t.downloadDocument}
            </a>
          )}
        </div>
      ))}
      {filteredDocs.length === 0 && (
        <div className="col-span-full py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center">
          <FileText className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-medium text-[10px] uppercase tracking-widest">{t.noDocumentsFound}</p>
        </div>
      )}
    </div>

  );
};
