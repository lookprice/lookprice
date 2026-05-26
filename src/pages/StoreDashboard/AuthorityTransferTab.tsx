import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  Plus, 
  Clock, 
  Building2,
  Store,
  ArrowRight,
  Loader2,
  ChevronRight,
  MapPin,
  History,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { RealEstateProperty } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations';
import { ConsultingInsights } from '../../components/ConsultingInsights';

interface AuthorityTransferTabProps {
  storeId: number;
  properties: RealEstateProperty[];
  isViewer?: boolean;
  includeBranches?: boolean;
  onUpdate?: () => void;
}

export default function AuthorityTransferTab({ storeId, properties, isViewer, includeBranches, onUpdate }: AuthorityTransferTabProps) {
  const { lang } = useLanguage();
  const [branches, setBranches] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTransfer, setShowNewTransfer] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [transferItems, setTransferItems] = useState<any[]>([]);

  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  const paginatedTransfers = transfers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  useEffect(() => {
    fetchData();
  }, [storeId, includeBranches]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [branchesRes, auditLogsRes] = await Promise.all([
        api.getBranches(storeId),
        api.getAuditLogs(storeId)
      ]);
      
      setBranches(Array.isArray(branchesRes) ? branchesRes : []);
      // Filter for AUTHORITY_TRANSFER logs
      setTransfers(Array.isArray(auditLogsRes) ? auditLogsRes.filter((log: any) => log.action === 'AUTHORITY_TRANSFER') : []);
    } catch (error) {
      console.error("Error fetching authority transfer data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch || transferItems.length === 0) return;

    try {
      setLoading(true);
      await api.transferPropertyAuthority(transferItems[0].id, {
        authorized_branch_id: selectedBranch,
        responsible_consultant_id: 1 // Need to handle this in UI, hardcoded for now
      });
      setShowNewTransfer(false);
      setTransferItems([]);
      setSelectedBranch(null);
      fetchData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Hata:", error);
      alert("Hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <ArrowLeftRight className="h-5 w-5 mr-2 text-indigo-600" />
            {lang === 'tr' ? 'Portföy Yetki Transferi' : 'Portfolio Authority Transfer'}
          </h2>
          <p className="hidden md:block text-sm text-gray-500">
            {lang === 'tr' ? 'Gayrimenkul yetkilerini şubeler arası aktarın.' : 'Transfer real estate property authorities between branches.'}
          </p>
        </div>
        {!isViewer && (
          <button
            onClick={() => setShowNewTransfer(true)}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-700 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            {lang === 'tr' ? 'Yeni Yetki Transferi' : 'New Authority Transfer'}
          </button>
        )}
      </div>
{/* Authority Transfer Modal */}
      <AnimatePresence>
        {showNewTransfer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl"
            >
              <h2 className="text-xl font-bold mb-4">{lang === 'tr' ? 'Yeni Yetki Transferi' : 'New Authority Transfer'}</h2>
              <form onSubmit={handleCreateTransfer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {lang === 'tr' ? 'Portföy Seçin' : 'Select Property'}
                  </label>
                  <select
                    className="w-full p-3 border border-gray-200 rounded-xl"
                    required
                    onChange={(e) => {
                       const p = properties.find(prop => prop.id === Number(e.target.value));
                       setTransferItems(p ? [p] : []);
                    }}
                  >
                    <option value="">{lang === 'tr' ? 'Portföy seçin...' : 'Select property...'}</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {lang === 'tr' ? 'Transfer Edilecek Şube' : 'Target Branch'}
                  </label>
                  <select
                    className="w-full p-3 border border-gray-200 rounded-xl"
                    required
                    onChange={(e) => setSelectedBranch(Number(e.target.value))}
                  >
                    <option value="">{lang === 'tr' ? 'Şube seçin...' : 'Select branch...'}</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewTransfer(false)}
                    className="px-4 py-2 text-gray-600 font-medium"
                  >
                    {lang === 'tr' ? 'İptal' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-sm hover:bg-indigo-700"
                  >
                    {lang === 'tr' ? 'Transferi Başlat' : 'Start Transfer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <History className="h-5 w-5 mr-2 text-gray-400" />
            {lang === 'tr' ? 'Transfer Geçmişi' : 'Transfer History'}
          </h3>
          <div className="space-y-4">
            {transfers.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Henüz bir yetki transferi kaydı bulunmuyor.</p>
            ) : (
              paginatedTransfers.map((transfer: any) => (
                <div key={transfer.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <ArrowRight className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{transfer.propertyTitle}</p>
                      <p className="text-xs text-gray-500">{transfer.fromBranch} → {transfer.toBranch}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-green-50 text-green-700">Tamamlandı</span>
                </div>
              ))
            )}
          </div>
        </div>

        <ConsultingInsights />
      </div>
    </div>
  );
}

