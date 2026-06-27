import { motion } from "motion/react";
import { Settings, Music, Video, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { ConversionSettings, TargetFormat } from "../types";

interface SettingsPanelProps {
  settings: ConversionSettings;
  onChange: (settings: ConversionSettings) => void;
  inputIsAudioOnly: boolean;
}

export default function SettingsPanel({ settings, onChange, inputIsAudioOnly }: SettingsPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const videoFormats: { ext: TargetFormat; label: string }[] = [
    { ext: "mp4", label: "MP4" },
    { ext: "mkv", label: "MKV" },
    { ext: "avi", label: "AVI" },
    { ext: "mov", label: "MOV" },
    { ext: "webm", label: "WebM" },
    { ext: "gif", label: "GIF Animado" },
  ];

  const audioFormats: { ext: TargetFormat; label: string }[] = [
    { ext: "mp3", label: "MP3" },
    { ext: "wav", label: "WAV" },
    { ext: "m4a", label: "M4A" },
    { ext: "flac", label: "FLAC" },
    { ext: "ogg", label: "OGG" },
    { ext: "aac", label: "AAC" },
  ];

  const resolutions = [
    { value: "original", label: "Manter Original" },
    { value: "1920x1080", label: "Full HD (1080p) - 1920x1080" },
    { value: "1280x720", label: "HD (720p) - 1280x720" },
    { value: "854x480", label: "SD (480p) - 854x480" },
    { value: "640x360", label: "Móvel (360p) - 640x360" },
  ];

  const frameRates = [
    { value: "original", label: "Manter Original" },
    { value: "60", label: "60 FPS (Super Fluido)" },
    { value: "50", label: "50 FPS" },
    { value: "30", label: "30 FPS (Padrão)" },
    { value: "24", label: "24 FPS (Cinemático)" },
    { value: "15", label: "15 FPS" },
  ];

  const bitrates = [
    { value: "original", label: "Manter Original" },
    { value: "320k", label: "320 kbps (Qualidade de CD)" },
    { value: "256k", label: "256 kbps (Alta)" },
    { value: "192k", label: "192 kbps (Muito Boa)" },
    { value: "128k", label: "128 kbps (Padrão)" },
    { value: "96k", label: "96 kbps (Comprimido)" },
  ];

  const sampleRates = [
    { value: "original", label: "Manter Original" },
    { value: "48000", label: "48.0 kHz (Estúdio)" },
    { value: "44100", label: "44.1 kHz (Padrão)" },
    { value: "32000", label: "32.0 kHz" },
  ];

  const channels = [
    { value: "original", label: "Manter Original" },
    { value: "2", label: "Estéreo (2 Canais)" },
    { value: "1", label: "Mono (1 Canal)" },
  ];

  const isOutputVideo = videoFormats.some((f) => f.ext === settings.targetFormat);

  const handleFormatSelect = (format: TargetFormat) => {
    // If transitioning from audio to video, or vice versa, reset resolution/fps
    onChange({
      ...settings,
      targetFormat: format,
    });
  };

  const handleSettingChange = (key: keyof ConversionSettings, value: string) => {
    onChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div id="settings-panel-container" className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col gap-6">
      <div id="settings-header" className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
        <Settings className="w-5 h-5 text-emerald-400" />
        <h3 className="text-lg font-semibold text-slate-100">Configurações de Conversão</h3>
      </div>

      {/* Target Format Group */}
      <div id="format-selection-group" className="flex flex-col gap-4">
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-2.5 flex items-center gap-1.5">
            <Video className="w-4 h-4 text-cyan-400" /> Formatos de Vídeo
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {videoFormats.map((f) => {
              const isSelected = settings.targetFormat === f.ext;
              return (
                <button
                  id={`format-btn-${f.ext}`}
                  key={f.ext}
                  onClick={() => handleFormatSelect(f.ext)}
                  type="button"
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition text-center cursor-pointer ${
                    isSelected
                      ? "bg-cyan-500/10 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950/25"
                      : "bg-slate-950/30 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-2.5 flex items-center gap-1.5">
            <Music className="w-4 h-4 text-emerald-400" /> Formatos de Áudio
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {audioFormats.map((f) => {
              const isSelected = settings.targetFormat === f.ext;
              return (
                <button
                  id={`format-btn-${f.ext}`}
                  key={f.ext}
                  onClick={() => handleFormatSelect(f.ext)}
                  type="button"
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition text-center cursor-pointer ${
                    isSelected
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/25"
                      : "bg-slate-950/30 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Video Customizations */}
      {isOutputVideo && (
        <motion.div
          id="video-options-group"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/60"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Resolução do Vídeo</label>
            <div className="relative">
              <select
                id="video-resolution-select"
                value={settings.resolution}
                onChange={(e) => handleSettingChange("resolution", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 appearance-none cursor-pointer"
              >
                {resolutions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Taxa de Quadros (Frame Rate)</label>
            <div className="relative">
              <select
                id="video-fps-select"
                value={settings.fps}
                onChange={(e) => handleSettingChange("fps", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 appearance-none cursor-pointer"
              >
                {frameRates.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Advanced Audio Toggle */}
      <div id="advanced-audio-toggle-wrapper" className="pt-2 border-t border-slate-800/60">
        <button
          id="advanced-audio-toggle"
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full py-1 text-sm font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
        >
          <span>Ajustes Avançados de Áudio</span>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <motion.div
            id="advanced-audio-group"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bitrate do Áudio</label>
              <div className="relative">
                <select
                  id="audio-bitrate-select"
                  value={settings.audioBitrate}
                  onChange={(e) => handleSettingChange("audioBitrate", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                >
                  {bitrates.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Frequência</label>
              <div className="relative">
                <select
                  id="audio-sample-rate-select"
                  value={settings.audioSampleRate}
                  onChange={(e) => handleSettingChange("audioSampleRate", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                >
                  {sampleRates.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Canais</label>
              <div className="relative">
                <select
                  id="audio-channels-select"
                  value={settings.audioChannels}
                  onChange={(e) => handleSettingChange("audioChannels", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                >
                  {channels.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
