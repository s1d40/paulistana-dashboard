export type TargetFormat =
  | "mp4"
  | "mkv"
  | "avi"
  | "mov"
  | "webm"
  | "gif"
  | "mp3"
  | "wav"
  | "m4a"
  | "flac"
  | "ogg"
  | "aac";

export interface ConversionSettings {
  targetFormat: TargetFormat;
  resolution: "original" | "1920x1080" | "1280x720" | "854x480" | "640x360";
  fps: "original" | "60" | "50" | "30" | "24" | "15";
  audioBitrate: "original" | "320k" | "256k" | "192k" | "128k" | "96k";
  audioSampleRate: "original" | "44100" | "48000" | "32000";
  audioChannels: "original" | "2" | "1";
}

export interface ClientFileInfo {
  file: File;
  name: string;
  size: number;
  type: string;
  duration?: number; // in seconds
  dimensions?: { width: number; height: number };
  isAudio: boolean;
  isVideo: boolean;
}

export interface Job {
  id: string;
  originalName: string;
  targetFormat: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  error?: string;
  downloadName: string;
  originalSize: number;
  convertedSize?: number;
}
