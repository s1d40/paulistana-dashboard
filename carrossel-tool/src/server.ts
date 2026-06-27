import express, { Request, Response } from 'express';
import { z } from 'zod';
import { generateSlide } from './services/imageGenerator';

const app = express();
app.use(express.json());

const SlidePayloadSchema = z.object({
  backgroundImageUrl: z.string().url(),
  content: z.object({
    headline: z.string(),
    subHeadline: z.string().optional()
  }),
  theme: z.object({
    textColor: z.string().regex(/^#[0-9A-Fa-f]{3,6}$/, "Must be a valid hex color").default("#FFFFFF"),
    highlightColor: z.string().regex(/^#[0-9A-Fa-f]{3,6}$/, "Must be a valid hex color").default("#E4AD75")
  }).default({ textColor: "#FFFFFF", highlightColor: "#E4AD75" }),
  overlay: z.object({
    enabled: z.boolean().default(false),
    type: z.enum(["bottom-gradient", "full-dark"]).default("bottom-gradient"),
    height: z.string().default("60%"),
    opacity: z.number().min(0).max(1).default(0.8)
  }).default({ enabled: false, type: "bottom-gradient", height: "60%", opacity: 0.8 })
});

export type SlidePayload = z.infer<typeof SlidePayloadSchema>;

app.post('/api/v1/generate-slide', async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = SlidePayloadSchema.parse(req.body);
    const imageBuffer = await generateSlide(payload);
    
    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(imageBuffer);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid payload details", details: error.errors });
      return;
    }
    console.error("Error generating slide:", error);
    res.status(400).json({ error: error.message || "Failed to generate image" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Carousel API is running on http://localhost:${PORT}`);
});
