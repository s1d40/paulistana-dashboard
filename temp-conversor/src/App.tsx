import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  RefreshCw,
  Video,
  Music,
  Download,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Plus
} from "lucide-react";
import DropZone from "./components/DropZone";
import SettingsPanel from "./components/SettingsPanel";
import JobList from "./components/JobList";
import { ClientFileInfo, ConversionSettings, Job } from "./types";

export default function App() {
  const [selectedFile, setSelectedFile] = useState<ClientFileInfo | null>(null);
  const [settings, setSettings] = useState<ConversionSettings>({
    targetFormat: "mp4",
    resolution: "original",
    fps: "original",
    audioBitrate: "original",
    audioSampleRate: "original",
    audioChannels: "original",
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [appError, setAppError] = useState<string | null>(null);

  // Poll jobs list
  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (err) {
      console.error("Erro ao buscar fila de conversões:", err);
    }
  };

  // Determine active count to control polling frequency securely
  const activeCount = jobs.filter((j) => j.status === "pending" || j.status === "processing").length;

  useEffect(() => {
    fetchJobs();
    
    // Poll more frequently if there are active conversion jobs
    const intervalTime = activeCount > 0 ? 1500 : 8000;
    const timer = setInterval(fetchJobs, intervalTime);

    return () => clearInterval(timer);
  }, [activeCount]);

  // Handle new file selection
  const handleFileSelected = (fileInfo: ClientFileInfo) => {
    setSelectedFile(fileInfo);
    setAppError(null);
    
    // Suggest logical default format based on input type
    setSettings((prev) => ({
      ...prev,
      targetFormat: fileInfo.isAudio ? "mp3" : "mp4",
      resolution: "original",
      fps: "original",
    }));
  };

  const handleClearSelected = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setAppError(null);
  };

  // Upload and trigger conversion
  const handleStartConversion = () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setAppError(null);

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", selectedFile.file);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = async () => {
      if (xhr.status === 200) {
        try {
          const uploadRes = JSON.parse(xhr.responseText);
          
          // Trigger conversion
          const convertRes = await fetch("/api/convert", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileId: uploadRes.fileId,
              originalName: uploadRes.originalName,
              targetFormat: settings.targetFormat,
              resolution: settings.resolution,
              fps: settings.fps,
              audioBitrate: settings.audioBitrate,
              audioSampleRate: settings.audioSampleRate,
              audioChannels: settings.audioChannels,
              duration: selectedFile.duration,
            }),
          });

          const convertData = await convertRes.json();
          
          if (!convertRes.ok) {
            throw new Error(convertData.error || "Erro ao iniciar o processo de conversão.");
          }

          // Success - clear file selector & fetch jobs
          handleClearSelected();
          setIsUploading(false);
          fetchJobs();
        } catch (err: any) {
          setAppError(err.message || "Erro ao processar conversão.");
          setIsUploading(false);
        }
      } else {
        if (xhr.status === 413) {
          setAppError("O arquivo é muito grande para o servidor do Cloud Run/Proxy (Limite excedido). Por favor, tente enviar um arquivo menor de teste (ex: menor que 10MB ou 20MB).");
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            setAppError(errRes.error || `Erro no servidor (Status ${xhr.status}): Falha no envio.`);
          } catch (_) {
            setAppError(`Falha no upload do arquivo (Status HTTP ${xhr.status}). Certifique-se de que o arquivo é menor ou tente outro formato.`);
          }
        }
        setIsUploading(false);
      }
    };

    xhr.onerror = () => {
      setAppError("Erro de conexão ou limite de tamanho do arquivo excedido. Por favor, tente enviar um arquivo menor de teste.");
      setIsUploading(false);
    };

    xhr.open("POST", "/api/upload", true);
    xhr.send(formData);
  };

  const handleDownloadJob = (jobId: string) => {
    const link = document.createElement("a");
    link.href = `/api/download/${jobId}`;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/job/${jobId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchJobs();
      }
    } catch (err) {
      console.error("Erro ao remover job:", err);
    }
  };

  const handleClearFinished = async () => {
    const finishedJobs = jobs.filter((j) => j.status === "completed" || j.status === "failed");
    for (const job of finishedJobs) {
      await handleDeleteJob(job.id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Decorative ambient background lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full filter blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="flex-grow w-full max-w-7xl mx-auto px-4 py-8 relative z-10">
        
        {/* Header */}
        <header id="app-header" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 border-b border-slate-900 pb-6">
          <div className="flex items-center gap-3">
            <div id="logo-icon-wrapper" className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl text-white shadow-lg shadow-emerald-950/40">
              <RefreshCw className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h1 id="app-title" className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Conversor de Mídia
              </h1>
              <p id="app-subtitle" className="text-xs text-slate-400 font-medium">
                Inspirado no Any Video Converter • Completo e em Português
              </p>
            </div>
          </div>
          <div id="service-badge" className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            FFmpeg Ativo no Servidor
          </div>
        </header>

        {/* Bento/Split Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Creator Workspace */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Step 1: Upload / Selected File Preview */}
            <section id="step-upload-section">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-[10px] font-bold">1</span>
                  Escolha o Arquivo
                </span>
              </div>
              <DropZone
                onFileSelected={handleFileSelected}
                selectedFile={selectedFile}
                onClear={handleClearSelected}
              />
            </section>

            {/* Step 2: Settings & Execution */}
            {selectedFile && (
              <motion.section
                id="step-settings-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-5"
              >
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-[10px] font-bold">2</span>
                    Ajuste os Parâmetros de Saída
                  </span>
                  <SettingsPanel
                    settings={settings}
                    onChange={setSettings}
                    inputIsAudioOnly={selectedFile.isAudio}
                  />
                </div>

                {/* Conversion Trigger Box */}
                <div id="trigger-box" className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
                  
                  {isUploading ? (
                    <div id="upload-progress-wrapper" className="flex flex-col gap-2.5">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-indigo-400 flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Enviando arquivo para o servidor...
                        </span>
                        <span className="text-slate-300 font-mono">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-3.5 overflow-hidden border border-slate-800/80">
                        <motion.div
                          id="upload-progress-fill"
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Mantenha esta aba aberta. O processamento iniciará automaticamente assim que o upload for concluído.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-center sm:text-left">
                        <p className="text-xs text-slate-400 font-medium">Pronto para converter:</p>
                        <p className="text-sm font-semibold text-slate-200 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                          {selectedFile.isAudio ? <Music className="w-4 h-4 text-emerald-400" /> : <Video className="w-4 h-4 text-cyan-400" />}
                          {selectedFile.name.length > 25 ? `${selectedFile.name.substring(0, 25)}...` : selectedFile.name}
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-emerald-400 uppercase font-bold font-mono">{settings.targetFormat}</span>
                        </p>
                      </div>

                      <button
                        id="start-conversion-btn"
                        onClick={handleStartConversion}
                        type="button"
                        className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-2.5 group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-200" />
                        Iniciar Conversão
                      </button>
                    </div>
                  )}

                  {appError && (
                    <div id="app-error-box" className="flex items-start gap-2.5 text-rose-400 bg-rose-950/20 border border-rose-900/30 p-3.5 rounded-xl">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-semibold">Erro no Processamento</p>
                        <p className="text-rose-400/90 leading-relaxed font-mono mt-1">{appError}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.section>
            )}

          </div>

          {/* Right Column: Jobs Queue & Documentation */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Conversion Queue Panel */}
            <section id="queue-section" className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-[10px] font-bold">3</span>
                  Fila & Downloads
                </span>

                {jobs.some((j) => j.status === "completed" || j.status === "failed") && (
                  <button
                    id="clear-completed-btn"
                    onClick={handleClearFinished}
                    type="button"
                    className="text-xs text-slate-400 hover:text-rose-400 transition font-medium flex items-center gap-1 cursor-pointer"
                  >
                    Limpar Concluídos
                  </button>
                )}
              </div>
              
              <JobList
                jobs={jobs}
                onDownload={handleDownloadJob}
                onDelete={handleDeleteJob}
              />
            </section>

            {/* Formatting Help / Tips Card */}
            <section id="help-card" className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-400" /> Dicas de Conversão
              </h4>
              <ul className="text-xs text-slate-400 space-y-2.5 list-disc list-inside">
                <li>
                  <strong className="text-slate-300">Conversão de Áudio:</strong> Para converter arquivos de vídeo em arquivos de som (como MP3), basta selecionar qualquer formato de áudio abaixo de "Formatos de Áudio".
                </li>
                <li>
                  <strong className="text-slate-300">Controle de FPS:</strong> Reduzir a taxa de quadros (ex: 24 FPS) diminui consideravelmente o tamanho de arquivos de vídeo, ideal para armazenamento.
                </li>
                <li>
                  <strong className="text-slate-300">Resolução Inteligente:</strong> Ao selecionar uma resolução menor (ex: 720p em vez de 1080p), você acelera a conversão e otimiza para telas menores.
                </li>
                <li>
                  <strong className="text-slate-300">Privacidade Absoluta:</strong> Seus arquivos são processados de forma temporária e excluídos automaticamente após a conversão, garantindo total segurança.
                </li>
              </ul>
            </section>

          </div>

        </main>
      </div>

      {/* Footer */}
      <footer id="app-footer" className="w-full text-center py-6 border-t border-slate-950 bg-slate-950 text-[11px] text-slate-500">
        <p>© 2026 Conversor de Mídia. Todos os direitos reservados. Processado por FFmpeg.</p>
      </footer>
    </div>
  );
}
