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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredDocs.map(d => (
        <div key={d.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-amber-200 transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-gray-900">{d.type}</h4>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-black uppercase tracking-wider">
                  {getVehiclePlate(d.vehicle_id)}
                </span>
              </div>
            </div>
            {!isViewer && (
              <button
                onClick={() => onDelete(d.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className={`p-4 rounded-2xl mb-4 flex items-center justify-between ${
            new Date(d.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              ? 'bg-red-50 text-red-700'
              : 'bg-green-50 text-green-700'
          }`}>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{t.expiryDate}</span>
              <span className="text-sm font-black">{safeFormatDate(d.expiry_date, 'dd.MM.yyyy')}</span>
            </div>
            {new Date(d.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
              <AlertCircle className="w-5 h-5 animate-pulse" />
            )}
          </div>

          {d.document_url && (
            <a 
              href={d.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black text-gray-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
            >
              <Download className="w-4 h-4" />
              {t.downloadDocument}
            </a>
          )}
        </div>
      ))}
      {filteredDocs.length === 0 && (
        <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-center">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-bold">{t.noDocumentsFound}</p>
        </div>
      )}
    </div>
  );
};
