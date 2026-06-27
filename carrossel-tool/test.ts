import { generateSlide } from './src/services/imageGenerator';
import fs from 'fs';

generateSlide({
  backgroundImageUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1080&auto=format&fit=crop",
  text: "Conteúdo dinâmico gerado via código",
  title: "Gerador Automático",
  theme: {
    textColor: "#FFFFFF",
    fontSize: "48px"
  }
}).then(buf => {
  fs.writeFileSync('test.png', buf);
  console.log('SUCCESS: image generated successfully.');
}).catch(e => {
  console.error('FAIL:', e);
});
