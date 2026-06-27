import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";


// Set FFmpeg binary path
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
} else {
  console.warn("Warning: ffmpeg-static could not find a static binary path. Using system ffmpeg.");
}

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure directories exist
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const CONVERTED_DIR = path.join(process.cwd(), "converted");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(CONVERTED_DIR)) {
  fs.mkdirSync(CONVERTED_DIR, { recursive: true });
}

// Clean up previous files on startup
try {
  fs.readdirSync(UPLOADS_DIR).forEach((file) => {
    fs.unlinkSync(path.join(UPLOADS_DIR, file));
  });
  fs.readdirSync(CONVERTED_DIR).forEach((file) => {
    fs.unlinkSync(path.join(CONVERTED_DIR, file));
  });
  console.log("Cleanup of temporary directories completed.");
} catch (err) {
  console.error("Error during startup cleanup:", err);
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 300 * 1024 * 1024, // 300MB limit
  },
});

app.use(express.json());

// In-memory jobs database
interface Job {
  id: string;
  sourcePath: string;
  outputPath: string;
  originalName: string;
  targetFormat: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  error?: string;
  downloadName: string;
  originalSize: number;
  convertedSize?: number;
  duration?: number; // In seconds
}

const jobs = new Map<string, Job>();

// Utility helper to convert hh:mm:ss.xx to seconds
function timemarkToSeconds(timemark: string): number {
  if (!timemark) return 0;
  const parts = timemark.split(":");
  if (parts.length !== 3) return 0;
  const hrs = parseFloat(parts[0]);
  const mins = parseFloat(parts[1]);
  const secs = parseFloat(parts[2]);
  return hrs * 3600 + mins * 60 + secs;
}

// Get clean extension
function getExtensionForFormat(format: string): string {
  const f = format.toLowerCase();
  switch (f) {
    case "mp3": return ".mp3";
    case "wav": return ".wav";
    case "m4a": return ".m4a";
    case "flac": return ".flac";
    case "ogg": return ".ogg";
    case "aac": return ".aac";
    case "mp4": return ".mp4";
    case "mkv": return ".mkv";
    case "avi": return ".avi";
    case "mov": return ".mov";
    case "webm": return ".webm";
    case "gif": return ".gif";
    default: return `.${f}`;
  }
}

// --- API ROUTES ---

// 1. Upload a file
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Nenhum arquivo enviado." });
    return;
  }

  res.json({
    fileId: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    path: req.file.path,
  });
});

// 2. Trigger conversion
app.post("/api/convert", (req, res) => {
  const {
    fileId,
    originalName,
    targetFormat,
    resolution, // 'original' or '1920x1080', '1280x720', etc.
    fps, // 'original' or '60', '30', etc.
    audioBitrate, // 'original' or '320k', '192k', etc.
    audioSampleRate, // 'original' or '44100', '48000', etc.
    audioChannels, // 'original' or '2', '1', etc.
    duration, // optional client-provided duration in seconds
  } = req.body;

  if (!fileId || !targetFormat) {
    res.status(400).json({ error: "Parâmetros fileId e targetFormat são obrigatórios." });
    return;
  }

  const sourcePath = path.join(UPLOADS_DIR, fileId);

  if (!fs.existsSync(sourcePath)) {
    res.status(404).json({ error: "Arquivo original não encontrado ou já processado." });
    return;
  }

  const jobId = `job-${Date.now()}-${Math.round(Math.random() * 1e5)}`;
  const ext = getExtensionForFormat(targetFormat);
  const baseNameWithoutExt = path.basename(originalName, path.extname(originalName));
  const downloadName = `${baseNameWithoutExt}_convertido${ext}`;
  const outputPath = path.join(CONVERTED_DIR, `${jobId}${ext}`);

  const originalStats = fs.statSync(sourcePath);

  const job: Job = {
    id: jobId,
    sourcePath,
    outputPath,
    originalName,
    targetFormat,
    status: "processing",
    progress: 0,
    downloadName,
    originalSize: originalStats.size,
    duration: duration ? Number(duration) : undefined,
  };

  jobs.set(jobId, job);

  // Start FFmpeg process
  const command = ffmpeg(sourcePath);

  // Output format
  command.toFormat(targetFormat);

  const isAudioOnly = ["mp3", "wav", "m4a", "flac", "ogg", "aac"].includes(targetFormat.toLowerCase());

  if (isAudioOnly) {
    command.noVideo();
    
    // Audio adjustments
    if (audioBitrate && audioBitrate !== "original") {
      command.audioBitrate(audioBitrate);
    }
    if (audioSampleRate && audioSampleRate !== "original") {
      command.audioFrequency(Number(audioSampleRate));
    }
    if (audioChannels && audioChannels !== "original") {
      command.audioChannels(Number(audioChannels));
    }
  } else {
    // Video conversion
    // Select highly compatible codecs for common formats
    const targetLower = targetFormat.toLowerCase();
    if (targetLower === "webm") {
      command.videoCodec("libvpx-vp9");
      command.audioCodec("libopus");
    } else if (targetLower === "gif") {
      // standard gif conversion
    } else {
      // MP4, MKV, AVI, MOV default codecs (libx264, aac)
      command.videoCodec("libx264");
      command.audioCodec("aac");
    }

    // Video adjustments
    if (resolution && resolution !== "original") {
      command.size(resolution);
    }
    if (fps && fps !== "original") {
      command.fps(Number(fps));
    }

    // Audio adjustments inside video
    if (audioBitrate && audioBitrate !== "original") {
      command.audioBitrate(audioBitrate);
    }
    if (audioSampleRate && audioSampleRate !== "original") {
      command.audioFrequency(Number(audioSampleRate));
    }
    if (audioChannels && audioChannels !== "original") {
      command.audioChannels(Number(audioChannels));
    }
  }

  // Event handlers
  command
    .on("start", (cmdString) => {
      console.log(`[Job ${jobId}] Started FFmpeg command: ${cmdString}`);
    })
    .on("progress", (progressInfo) => {
      let percent = progressInfo.percent;

      // Fallback progress calculation if duration is known
      if ((percent === undefined || isNaN(percent)) && job.duration && progressInfo.timemark) {
        const currentSecs = timemarkToSeconds(progressInfo.timemark);
        percent = (currentSecs / job.duration) * 100;
      }

      if (percent !== undefined && !isNaN(percent)) {
        job.progress = Math.min(Math.round(percent), 99);
        jobs.set(jobId, { ...job });
      }
    })
    .on("end", () => {
      console.log(`[Job ${jobId}] Conversion completed successfully.`);
      try {
        const convertedStats = fs.statSync(outputPath);
        job.status = "completed";
        job.progress = 100;
        job.convertedSize = convertedStats.size;
        jobs.set(jobId, { ...job });

        // Clean up the uploaded source file to save space
        if (fs.existsSync(sourcePath)) {
          fs.unlinkSync(sourcePath);
          console.log(`[Job ${jobId}] Cleaned up temporary source file.`);
        }
      } catch (err) {
        console.error(`Error finishing job ${jobId}:`, err);
        job.status = "failed";
        job.error = "Erro ao ler as estatísticas do arquivo convertido.";
        jobs.set(jobId, { ...job });
      }
    })
    .on("error", (err) => {
      console.error(`[Job ${jobId}] Error:`, err);
      job.status = "failed";
      job.error = err.message || "Erro durante o processamento do FFmpeg.";
      jobs.set(jobId, { ...job });

      // Clean up the source file in case of error
      if (fs.existsSync(sourcePath)) {
        try {
          fs.unlinkSync(sourcePath);
        } catch (_) {}
      }
    });

  // Run the command
  command.save(outputPath);

  res.json({ jobId });
});

// 3. Get all jobs
app.get("/api/jobs", (req, res) => {
  const jobsList = Array.from(jobs.values()).map((job) => ({
    id: job.id,
    originalName: job.originalName,
    targetFormat: job.targetFormat,
    status: job.status,
    progress: job.progress,
    error: job.error,
    downloadName: job.downloadName,
    originalSize: job.originalSize,
    convertedSize: job.convertedSize,
  }));
  res.json(jobsList);
});

// 4. Get a specific job status
app.get("/api/job/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    res.status(404).json({ error: "Job não encontrado." });
    return;
  }

  res.json({
    id: job.id,
    originalName: job.originalName,
    targetFormat: job.targetFormat,
    status: job.status,
    progress: job.progress,
    error: job.error,
    downloadName: job.downloadName,
    originalSize: job.originalSize,
    convertedSize: job.convertedSize,
  });
});

// 5. Download converted file
app.get("/api/download/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    res.status(404).json({ error: "Job não encontrado." });
    return;
  }

  if (job.status !== "completed") {
    res.status(400).json({ error: "O arquivo ainda não terminou de ser convertido." });
    return;
  }

  if (!fs.existsSync(job.outputPath)) {
    res.status(404).json({ error: "Arquivo convertido não encontrado no servidor." });
    return;
  }

  res.download(job.outputPath, job.downloadName);
});

// 6. Delete a job (and its converted file)
app.delete("/api/job/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    res.status(404).json({ error: "Job não encontrado." });
    return;
  }

  // Delete source file if it still exists
  if (fs.existsSync(job.sourcePath)) {
    try {
      fs.unlinkSync(job.sourcePath);
    } catch (_) {}
  }

  // Delete output converted file
  if (fs.existsSync(job.outputPath)) {
    try {
      fs.unlinkSync(job.outputPath);
    } catch (_) {}
  }

  jobs.delete(jobId);
  res.json({ success: true });
});

// --- GLOBAL ERROR HANDLING MIDDLEWARE ---
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global Error Handler caught:", err);
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "O arquivo excede o limite máximo de upload de 300MB." });
      return;
    }
    res.status(400).json({ error: `Erro no envio do arquivo (Multer): ${err.message}` });
    return;
  }
  res.status(500).json({ error: err.message || "Erro interno no processamento do arquivo no servidor." });
});

// --- START SERVER ---
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
