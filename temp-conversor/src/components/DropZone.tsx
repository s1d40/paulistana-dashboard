import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { Upload, FileVideo, FileAudio, AlertTriangle } from "lucide-react";
import { ClientFileInfo } from "../types";

interface DropZoneProps {
  onFileSelected: (fileInfo: ClientFileInfo) => void;
  selectedFile: ClientFileInfo | null;
  onClear: () => void;
}

export default function DropZone({ onFileSelected, selectedFile, onClear }: DropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setError(null);
    const isVideo = file.type.startsWith("video/") || /\.(mp4|mkv|avi|mov|webm|flv|wmv|m4v|3gp|gif)$/i.test(file.name);
    const isAudio = file.type.startsWith("audio/") || /\.(mp3|wav|m4a|flac|ogg|aac|wma|opus)$/i.test(file.name);

    if (!isVideo && !isAudio) {
      setError("Por favor, selecione um arquivo válido de áudio ou vídeo.");
      return;
    }

    const fileInfo: ClientFileInfo = {
      file,
      name: file.name,
      size: file.size,
      type: file.type || (isVideo ? "video/mp4" : "audio/mpeg"),
      isAudio,
      isVideo,
    };

    // Parse metadata client-side
    const objectUrl = URL.createObjectURL(file);

    if (isVideo) {
      const videoEl = document.createElement("video");
      videoEl.preload = "metadata";
      videoEl.src = objectUrl;
      videoEl.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        fileInfo.duration = videoEl.duration;
        fileInfo.dimensions = {
          width: videoEl.videoWidth,
          height: videoEl.videoHeight,
        };
        onFileSelected(fileInfo);
      };
      videoEl.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        // Fallback if metadata read fails
        onFileSelected(fileInfo);
      };
    } else {
      const audioEl = document.createElement("audio");
      audioEl.preload = "metadata";
      audioEl.src = objectUrl;
      audioEl.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        fileInfo.duration = audioEl.duration;
        onFileSelected(fileInfo);
      };
      audioEl.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        // Fallback
        onFileSelected(fileInfo);
      };
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || isNaN(seconds)) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div id="dropzone-container" className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*"
        onChange={handleChange}
        className="hidden"
        id="media-file-input"
      />

      {!selectedFile ? (
        <motion.div
          id="dropzone-box"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 min-h-[250px] ${
            isDragActive
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-slate-700 bg-slate-900/40 hover:border-slate-500 hover:bg-slate-900/60"
          }`}
        >
          <div id="dropzone-icon" className="p-4 bg-slate-800/80 rounded-full mb-4 text-emerald-400">
            <Upload className="w-8 h-8" />
          </div>
          <h3 id="dropzone-title" className="text-lg font-medium text-slate-100 text-center mb-1">
            Arraste e solte seu arquivo aqui
          </h3>
          <p id="dropzone-subtitle" className="text-sm text-slate-400 text-center mb-4">
            Suporta qualquer formato de áudio ou vídeo (até 300MB)
          </p>
          <button
            id="dropzone-browse-button"
            type="button"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-sm transition shadow-lg shadow-emerald-900/20 cursor-pointer"
          >
            Selecionar Arquivo
          </button>

          {error && (
            <motion.div
              id="dropzone-error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2 text-rose-400 text-sm bg-rose-950/20 border border-rose-900/30 px-3 py-1.5 rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div
          id="file-preview-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden"
        >
          <div
            id="file-preview-icon-wrapper"
            className={`p-5 rounded-2xl ${
              selectedFile.isVideo ? "bg-cyan-500/10 text-cyan-400" : "bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {selectedFile.isVideo ? <FileVideo className="w-12 h-12" /> : <FileAudio className="w-12 h-12" />}
          </div>

          <div id="file-preview-details" className="flex-1 min-w-0 text-center sm:text-left">
            <h4 id="file-preview-name" className="text-base font-semibold text-slate-100 truncate mb-1">
              {selectedFile.name}
            </h4>
            <div id="file-preview-metadata" className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-slate-400 font-mono">
              <span>Tamanho: <strong className="text-slate-200">{formatSize(selectedFile.size)}</strong></span>
              <span>•</span>
              <span>Duração: <strong className="text-slate-200">{formatDuration(selectedFile.duration)}</strong></span>
              {selectedFile.dimensions && (
                <>
                  <span>•</span>
                  <span>Resolução: <strong className="text-slate-200">{selectedFile.dimensions.width}x{selectedFile.dimensions.height}</strong></span>
                </>
              )}
            </div>
            <p id="file-preview-type" className="text-xs text-slate-500 mt-2">
              Tipo detectado: {selectedFile.type || "Desconhecido"}
            </p>
          </div>

          <div id="file-preview-actions" className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
            <button
              id="file-preview-change-button"
              onClick={triggerFileInput}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              Alterar Arquivo
            </button>
            <button
              id="file-preview-clear-button"
              onClick={onClear}
              className="px-4 py-2 bg-rose-950/20 border border-rose-900/30 hover:bg-rose-950/40 text-rose-400 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              Remover
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
