import { motion, AnimatePresence } from "motion/react";
import { Download, Trash2, CheckCircle2, XCircle, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Job } from "../types";

interface JobListProps {
  jobs: Job[];
  onDownload: (jobId: string) => void;
  onDelete: (jobId: string) => void;
}

export default function JobList({ jobs, onDownload, onDelete }: JobListProps) {
  const formatSize = (bytes?: number) => {
    if (bytes === undefined || bytes === 0) return "---";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getStatusBadge = (status: Job["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Na fila
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Convertendo
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Concluído
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Falhou
          </span>
        );
      default:
        return null;
    }
  };

  if (jobs.length === 0) {
    return (
      <div id="job-list-empty" className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
        <Sparkles className="w-8 h-8 text-slate-600" />
        <p className="text-sm">Nenhum arquivo convertido recentemente.</p>
        <p className="text-xs text-slate-600">Envie um arquivo e configure-o acima para iniciar!</p>
      </div>
    );
  }

  return (
    <div id="job-list-container" className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 px-1">
        Fila de Conversões
        <span id="job-count-badge" className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono font-normal">
          {jobs.length}
        </span>
      </h3>

      <div id="job-list-scrollable" className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {jobs.map((job) => (
            <motion.div
              id={`job-card-${job.id}`}
              key={job.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3.5"
            >
              <div id="job-card-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <h4 id={`job-title-${job.id}`} className="text-sm font-semibold text-slate-200 truncate" title={job.originalName}>
                    {job.originalName}
                  </h4>
                  <p id={`job-meta-${job.id}`} className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono">
                    <span>Para: <strong className="text-slate-300 uppercase">{job.targetFormat}</strong></span>
                    <span>•</span>
                    <span>Original: <strong className="text-slate-300">{formatSize(job.originalSize)}</strong></span>
                    {job.convertedSize && (
                      <>
                        <span>•</span>
                        <span>Convertido: <strong className="text-emerald-400">{formatSize(job.convertedSize)}</strong></span>
                      </>
                    )}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2 self-start sm:self-center">
                  {getStatusBadge(job.status)}
                </div>
              </div>

              {/* Progress Bar & Error Messages */}
              <div id="job-progress-wrapper" className="w-full">
                {job.status === "failed" ? (
                  <div id={`job-error-${job.id}`} className="flex items-start gap-2 text-xs text-rose-400 bg-rose-950/25 border border-rose-900/30 p-2.5 rounded-lg mt-1">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Falha na Conversão</p>
                      <p className="text-rose-500/90 leading-relaxed font-mono text-[11px] break-all">{job.error || "Ocorreu um erro desconhecido durante o FFmpeg."}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800/80">
                      <motion.div
                        id={`job-progress-bar-${job.id}`}
                        className={`h-full rounded-full ${
                          job.status === "completed"
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                            : "bg-gradient-to-r from-indigo-500 to-cyan-500"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${job.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <span id={`job-progress-text-${job.id}`} className="text-xs font-semibold font-mono text-slate-300 w-9 text-right shrink-0">
                      {job.progress}%
                    </span>
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div id="job-card-actions" className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/40">
                {job.status === "completed" && (
                  <button
                    id={`job-download-btn-${job.id}`}
                    onClick={() => onDownload(job.id)}
                    type="button"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar Arquivo
                  </button>
                )}
                <button
                  id={`job-delete-btn-${job.id}`}
                  onClick={() => onDelete(job.id)}
                  type="button"
                  title="Remover da fila"
                  className="flex items-center justify-center p-1.5 bg-slate-800/80 hover:bg-rose-950/30 hover:text-rose-400 hover:border-rose-900/30 border border-slate-700/80 text-slate-400 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
