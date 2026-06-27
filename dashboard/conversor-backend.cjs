var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_multer = __toESM(require("multer"), 1);
var import_fluent_ffmpeg = __toESM(require("fluent-ffmpeg"), 1);
var import_ffmpeg_static = __toESM(require("ffmpeg-static"), 1);
if (import_ffmpeg_static.default) {
  import_fluent_ffmpeg.default.setFfmpegPath(import_ffmpeg_static.default);
} else {
  console.warn("Warning: ffmpeg-static could not find a static binary path. Using system ffmpeg.");
}
var app = (0, import_express.default)();
var PORT = process.env.PORT || 3e3;
var UPLOADS_DIR = import_path.default.join(process.cwd(), "uploads");
var CONVERTED_DIR = import_path.default.join(process.cwd(), "converted");
if (!import_fs.default.existsSync(UPLOADS_DIR)) {
  import_fs.default.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!import_fs.default.existsSync(CONVERTED_DIR)) {
  import_fs.default.mkdirSync(CONVERTED_DIR, { recursive: true });
}
try {
  import_fs.default.readdirSync(UPLOADS_DIR).forEach((file) => {
    import_fs.default.unlinkSync(import_path.default.join(UPLOADS_DIR, file));
  });
  import_fs.default.readdirSync(CONVERTED_DIR).forEach((file) => {
    import_fs.default.unlinkSync(import_path.default.join(CONVERTED_DIR, file));
  });
  console.log("Cleanup of temporary directories completed.");
} catch (err) {
  console.error("Error during startup cleanup:", err);
}
var storage = import_multer.default.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = import_path.default.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});
var upload = (0, import_multer.default)({
  storage,
  limits: {
    fileSize: 300 * 1024 * 1024
    // 300MB limit
  }
});
app.use(import_express.default.json());
var jobs = /* @__PURE__ */ new Map();
function timemarkToSeconds(timemark) {
  if (!timemark) return 0;
  const parts = timemark.split(":");
  if (parts.length !== 3) return 0;
  const hrs = parseFloat(parts[0]);
  const mins = parseFloat(parts[1]);
  const secs = parseFloat(parts[2]);
  return hrs * 3600 + mins * 60 + secs;
}
function getExtensionForFormat(format) {
  const f = format.toLowerCase();
  switch (f) {
    case "mp3":
      return ".mp3";
    case "wav":
      return ".wav";
    case "m4a":
      return ".m4a";
    case "flac":
      return ".flac";
    case "ogg":
      return ".ogg";
    case "aac":
      return ".aac";
    case "mp4":
      return ".mp4";
    case "mkv":
      return ".mkv";
    case "avi":
      return ".avi";
    case "mov":
      return ".mov";
    case "webm":
      return ".webm";
    case "gif":
      return ".gif";
    default:
      return `.${f}`;
  }
}
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Nenhum arquivo enviado." });
    return;
  }
  res.json({
    fileId: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    path: req.file.path
  });
});
app.post("/api/convert", (req, res) => {
  const {
    fileId,
    originalName,
    targetFormat,
    resolution,
    // 'original' or '1920x1080', '1280x720', etc.
    fps,
    // 'original' or '60', '30', etc.
    audioBitrate,
    // 'original' or '320k', '192k', etc.
    audioSampleRate,
    // 'original' or '44100', '48000', etc.
    audioChannels,
    // 'original' or '2', '1', etc.
    duration
    // optional client-provided duration in seconds
  } = req.body;
  if (!fileId || !targetFormat) {
    res.status(400).json({ error: "Par\xE2metros fileId e targetFormat s\xE3o obrigat\xF3rios." });
    return;
  }
  const sourcePath = import_path.default.join(UPLOADS_DIR, fileId);
  if (!import_fs.default.existsSync(sourcePath)) {
    res.status(404).json({ error: "Arquivo original n\xE3o encontrado ou j\xE1 processado." });
    return;
  }
  const jobId = `job-${Date.now()}-${Math.round(Math.random() * 1e5)}`;
  const ext = getExtensionForFormat(targetFormat);
  const baseNameWithoutExt = import_path.default.basename(originalName, import_path.default.extname(originalName));
  const downloadName = `${baseNameWithoutExt}_convertido${ext}`;
  const outputPath = import_path.default.join(CONVERTED_DIR, `${jobId}${ext}`);
  const originalStats = import_fs.default.statSync(sourcePath);
  const job = {
    id: jobId,
    sourcePath,
    outputPath,
    originalName,
    targetFormat,
    status: "processing",
    progress: 0,
    downloadName,
    originalSize: originalStats.size,
    duration: duration ? Number(duration) : void 0
  };
  jobs.set(jobId, job);
  const command = (0, import_fluent_ffmpeg.default)(sourcePath);
  command.toFormat(targetFormat);
  const isAudioOnly = ["mp3", "wav", "m4a", "flac", "ogg", "aac"].includes(targetFormat.toLowerCase());
  if (isAudioOnly) {
    command.noVideo();
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
    const targetLower = targetFormat.toLowerCase();
    if (targetLower === "webm") {
      command.videoCodec("libvpx-vp9");
      command.audioCodec("libopus");
    } else if (targetLower === "gif") {
    } else {
      command.videoCodec("libx264");
      command.audioCodec("aac");
    }
    if (resolution && resolution !== "original") {
      command.size(resolution);
    }
    if (fps && fps !== "original") {
      command.fps(Number(fps));
    }
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
  command.on("start", (cmdString) => {
    console.log(`[Job ${jobId}] Started FFmpeg command: ${cmdString}`);
  }).on("progress", (progressInfo) => {
    let percent = progressInfo.percent;
    if ((percent === void 0 || isNaN(percent)) && job.duration && progressInfo.timemark) {
      const currentSecs = timemarkToSeconds(progressInfo.timemark);
      percent = currentSecs / job.duration * 100;
    }
    if (percent !== void 0 && !isNaN(percent)) {
      job.progress = Math.min(Math.round(percent), 99);
      jobs.set(jobId, { ...job });
    }
  }).on("end", () => {
    console.log(`[Job ${jobId}] Conversion completed successfully.`);
    try {
      const convertedStats = import_fs.default.statSync(outputPath);
      job.status = "completed";
      job.progress = 100;
      job.convertedSize = convertedStats.size;
      jobs.set(jobId, { ...job });
      if (import_fs.default.existsSync(sourcePath)) {
        import_fs.default.unlinkSync(sourcePath);
        console.log(`[Job ${jobId}] Cleaned up temporary source file.`);
      }
    } catch (err) {
      console.error(`Error finishing job ${jobId}:`, err);
      job.status = "failed";
      job.error = "Erro ao ler as estat\xEDsticas do arquivo convertido.";
      jobs.set(jobId, { ...job });
    }
  }).on("error", (err) => {
    console.error(`[Job ${jobId}] Error:`, err);
    job.status = "failed";
    job.error = err.message || "Erro durante o processamento do FFmpeg.";
    jobs.set(jobId, { ...job });
    if (import_fs.default.existsSync(sourcePath)) {
      try {
        import_fs.default.unlinkSync(sourcePath);
      } catch (_) {
      }
    }
  });
  command.save(outputPath);
  res.json({ jobId });
});
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
    convertedSize: job.convertedSize
  }));
  res.json(jobsList);
});
app.get("/api/job/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  if (!job) {
    res.status(404).json({ error: "Job n\xE3o encontrado." });
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
    convertedSize: job.convertedSize
  });
});
app.get("/api/download/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  if (!job) {
    res.status(404).json({ error: "Job n\xE3o encontrado." });
    return;
  }
  if (job.status !== "completed") {
    res.status(400).json({ error: "O arquivo ainda n\xE3o terminou de ser convertido." });
    return;
  }
  if (!import_fs.default.existsSync(job.outputPath)) {
    res.status(404).json({ error: "Arquivo convertido n\xE3o encontrado no servidor." });
    return;
  }
  res.download(job.outputPath, job.downloadName);
});
app.delete("/api/job/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  if (!job) {
    res.status(404).json({ error: "Job n\xE3o encontrado." });
    return;
  }
  if (import_fs.default.existsSync(job.sourcePath)) {
    try {
      import_fs.default.unlinkSync(job.sourcePath);
    } catch (_) {
    }
  }
  if (import_fs.default.existsSync(job.outputPath)) {
    try {
      import_fs.default.unlinkSync(job.outputPath);
    } catch (_) {
    }
  }
  jobs.delete(jobId);
  res.json({ success: true });
});
app.use((err, req, res, next) => {
  console.error("Global Error Handler caught:", err);
  if (err instanceof import_multer.default.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "O arquivo excede o limite m\xE1ximo de upload de 300MB." });
      return;
    }
    res.status(400).json({ error: `Erro no envio do arquivo (Multer): ${err.message}` });
    return;
  }
  res.status(500).json({ error: err.message || "Erro interno no processamento do arquivo no servidor." });
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
