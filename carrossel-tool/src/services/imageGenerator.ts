import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import axios from 'axios';
import { SlidePayload } from '../server';

let fontCacheRegular: Buffer | null = null;
let fontCacheBold: Buffer | null = null;
const FONT_REGULAR_URL = "https://cdn.jsdelivr.net/npm/@fontsource/inter/files/inter-latin-400-normal.woff";
const FONT_BOLD_URL = "https://cdn.jsdelivr.net/npm/@fontsource/inter/files/inter-latin-800-normal.woff";

async function getFontBuffers(): Promise<{ regular: Buffer, bold: Buffer }> {
  if (fontCacheRegular && fontCacheBold) {
    return { regular: fontCacheRegular, bold: fontCacheBold };
  }
  try {
    const [resReg, resBold] = await Promise.all([
      axios.get(FONT_REGULAR_URL, { responseType: 'arraybuffer' }),
      axios.get(FONT_BOLD_URL, { responseType: 'arraybuffer' })
    ]);
    fontCacheRegular = Buffer.from(resReg.data);
    fontCacheBold = Buffer.from(resBold.data);
    return { regular: fontCacheRegular, bold: fontCacheBold };
  } catch (error: any) {
    const errMsg = error.message;
    const axErr = error.response ? ` status: ${error.response.status}` : '';
    throw new Error(`Failed to load font files during initialization: ${errMsg}${axErr}`);
  }
}

export function parseHighlightedText(text: string): { text: string; isHighlight: boolean }[] {
  if (!text) return [];
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.filter(part => part !== '').map(part => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return { text: part.slice(2, -2), isHighlight: true };
    }
    return { text: part, isHighlight: false };
  });
}

export async function generateSlide(payload: SlidePayload): Promise<Buffer> {
  let backgroundImageBuffer: Buffer;
  let bgBase64: string;

  try {
    const response = await axios.get(payload.backgroundImageUrl, { responseType: 'arraybuffer' });
    backgroundImageBuffer = Buffer.from(response.data);
    const mimeType = response.headers['content-type'] || 'image/jpeg';
    bgBase64 = `data:${mimeType};base64,${backgroundImageBuffer.toString('base64')}`;
  } catch (error) {
    throw new Error(`Failed to load background image from URL: ${payload.backgroundImageUrl}`);
  }

  const fonts = await getFontBuffers();
  
  const width = 1080;
  const height = 1350;

  // Use flat Satori objects, representing the DOM tree.
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: 1080,
          height: 1350,
          position: 'relative'
        },
        children: [
          {
            type: 'img',
            props: {
              src: bgBase64,
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }
            }
          },
          (payload.overlay?.enabled) ? {
            type: 'div',
            props: {
              style: payload.overlay.type === 'bottom-gradient' ? {
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: payload.overlay.height || '75%',
                display: 'flex',
                backgroundImage: `linear-gradient(to top, rgba(0,0,0,${1 * payload.overlay.opacity}) 0%, rgba(0,0,0,${0.95 * payload.overlay.opacity}) 20%, rgba(0,0,0,${0.7 * payload.overlay.opacity}) 45%, rgba(0,0,0,0) 100%)`,
                zIndex: 0
              } : {
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                height: '100%',
                backgroundColor: `rgba(0, 0, 0, ${payload.overlay.opacity})`,
                zIndex: 0
              }
            }
          } : null,
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                flexGrow: 1,
                paddingBottom: 40,
                paddingLeft: 60,
                paddingRight: 60,
                color: payload.theme.textColor,
                fontFamily: 'Inter',
                zIndex: 1, 
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      width: '100%',
                    },
                    children: parseHighlightedText(payload.content.headline).map(frag => ({
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '80px',
                          fontWeight: 800,
                          color: frag.isHighlight ? payload.theme.highlightColor : payload.theme.textColor,
                          lineHeight: 1.1,
                          whiteSpace: 'pre-wrap', 
                        },
                        children: frag.text
                      }
                    }))
                  }
                },
                payload.content.subHeadline ? {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      width: '100%',
                      marginTop: '24px',
                    },
                    children: parseHighlightedText(payload.content.subHeadline).map(frag => ({
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '32px',
                          fontWeight: 400,
                          color: frag.isHighlight ? payload.theme.highlightColor : 'rgba(255, 255, 255, 0.8)',
                          lineHeight: 1.4,
                          whiteSpace: 'pre-wrap', 
                        },
                        children: frag.text
                      }
                    }))
                  }
                } : null
              ]
            }
          }
        ]
      }
    },
    {
      width,
      height,
      fonts: [
        {
          name: 'Inter',
          data: fonts.regular,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: fonts.bold,
          weight: 800,
          style: 'normal',
        },
      ],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'original' },
  });
  
  const pngData = resvg.render();
  return pngData.asPng();
}
