import React, { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  Code, 
  Video, 
  Sparkles, 
  Play, 
  Pause, 
  CheckCircle2, 
  Layers, 
  Film,
  FileCode,
  Copy,
  Check
} from 'lucide-react';
import { HYPERFRAME_SCENARIOS, HyperFrameScenario } from '../hyperframes/scenarios';
import { HyperFramesPlayer } from '../hyperframes/HyperFramesPlayer';
import { recordElementToVideo } from '../hyperframes/videoRecorder';

interface SuperAdminVideoStudioModalProps {
  initialScenarioId?: string;
  onClose: () => void;
  lang?: string;
}

export function SuperAdminVideoStudioModal({
  initialScenarioId = 'hotel_booking',
  onClose,
  lang = 'tr'
}: SuperAdminVideoStudioModalProps) {
  const [activeScenarioId, setActiveScenarioId] = useState<string>(initialScenarioId);
  const [activeTab, setActiveTab] = useState<'record' | 'json'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [recordStatusText, setRecordStatusText] = useState('');
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const scenario: HyperFrameScenario = 
    HYPERFRAME_SCENARIOS.find(s => s.id === activeScenarioId) || HYPERFRAME_SCENARIOS[0];

  const studioContainerRef = useRef<HTMLDivElement>(null);

  // Handle Recording of the actual rendered canvas
  const handleStartRealRender = async () => {
    try {
      setIsRecording(true);
      setRecordProgress(5);
      setRecordStatusText('Simülasyon sahnesi hazırlanıyor...');
      setRecordedVideoUrl(null);

      // Locate the screen container inside player
      const playerEl = studioContainerRef.current?.querySelector('[data-video-screen="true"]') as HTMLElement;
      const targetEl = playerEl || studioContainerRef.current;

      if (!targetEl) {
        alert('Video ekranı bulunamadı.');
        setIsRecording(false);
        return;
      }

      // Record DOM elements to pure WebM/MP4 video stream
      const videoBlob = await recordElementToVideo(
        targetEl,
        scenario.duration,
        20, // 20 FPS for crisp UI rendering
        (p, status) => {
          setRecordProgress(p);
          setRecordStatusText(status);
        }
      );

      const url = URL.createObjectURL(videoBlob);
      setRecordedVideoUrl(url);
      setIsRecording(false);
      setRecordStatusText('Video başarıyla render edildi!');

      // Automatically trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `LookPrice_${scenario.id}_HD.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch (err: any) {
      console.error('Render error:', err);
      alert('Video oluşturulurken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
      setIsRecording(false);
      setRecordStatusText('');
    }
  };

  const handleCopySpec = () => {
    navigator.clipboard.writeText(JSON.stringify(scenario, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSpecJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scenario, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `LookPrice_Spec_${scenario.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-y-auto">
      <div className="bg-[#090d16] border border-slate-700/60 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[94vh] my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#0e1424] border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">SüperAdmin Medya Stüdyosu & Video Dışa Aktarıcı</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  YÖNETİCİ MODU
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Web'de oynatılan gerçek simülasyon videosunu başlık başlık indirin ve YouTube kanalına yükleyin.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-left">
          {/* Scenario Selector Chips */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              İndirilecek / İncelenecek Senaryoyu Seçin:
            </label>
            <div className="flex flex-wrap gap-2">
              {HYPERFRAME_SCENARIOS.map((s) => {
                const isSelected = s.id === activeScenarioId;
                return (
                  <button
                    key={s.id}
                    disabled={isRecording}
                    onClick={() => {
                      setActiveScenarioId(s.id);
                      setRecordedVideoUrl(null);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    <span>{s.badge}</span>
                    <span className="text-[10px] opacity-70">({s.duration}s)</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <button
              onClick={() => setActiveTab('record')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'record'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Canlı Video Kaydedici & İndirici (WebM / HD)</span>
            </button>

            <button
              onClick={() => setActiveTab('json')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'json'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Senaryo Kodunu İncele (JSON Spec)</span>
            </button>
          </div>

          {/* Tab 1: Video Player & Direct HD Element Video Renderer */}
          {activeTab === 'record' && (
            <div className="space-y-4">
              {/* Active Player Preview */}
              <div 
                ref={studioContainerRef} 
                className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black"
              >
                <HyperFramesPlayer
                  key={`studio-${activeScenarioId}`}
                  initialScenarioId={activeScenarioId as any}
                  lang={lang}
                  className="w-full"
                  hideHeaderChips={true}
                  allowAdminTools={false}
                />
              </div>

              {/* Action Toolbar & Recording Status */}
              <div className="bg-[#0e1424] p-4 sm:p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>{scenario.title.tr}</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Süre: <strong className="text-white">{scenario.duration} saniye</strong> • Çözünürlük: <strong className="text-white">HD Canlı Kare Yakalama (Ekran Paylaşımı Gerektirmez)</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  {recordedVideoUrl && (
                    <a
                      href={recordedVideoUrl}
                      download={`LookPrice_${scenario.id}_HD.webm`}
                      className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Tekrar İndir</span>
                    </a>
                  )}

                  <button
                    disabled={isRecording}
                    onClick={handleStartRealRender}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl w-full sm:w-auto cursor-pointer ${
                      isRecording
                        ? 'bg-amber-600 text-white animate-pulse cursor-wait'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>{isRecording ? 'Video Kare Kare Render Ediliyor...' : "Bu Videoyu HD Olarak İndir (YouTube İçin)"}</span>
                  </button>
                </div>
              </div>

              {/* Progress Box */}
              {isRecording && (
                <div className="bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
                      {recordStatusText || 'Video render ediliyor...'}
                    </span>
                    <span>%{recordProgress}</span>
                  </div>
                  <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                      style={{ width: `${recordProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-emerald-400/80 italic">
                    Ekranınızın kaydı alınmaz; arka planda video motoru bu bileşenin karelerini yakalayarak doğrudan video dosyası üretir.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: JSON Spec Inspector */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-300">
                  Bu senaryo için resmi bildirimsel JSON deklarasyon kodu:
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySpec}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
                  </button>
                  <button
                    onClick={handleDownloadSpecJson}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JSON İndir</span>
                  </button>
                </div>
              </div>

              <pre className="bg-black/80 p-4 rounded-2xl border border-white/10 text-xs font-mono text-purple-200 overflow-y-auto max-h-[420px] select-all leading-relaxed shadow-inner">
                {JSON.stringify(scenario, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
