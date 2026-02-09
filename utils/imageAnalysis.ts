
import { PhotoQuality } from '../types';

export const analyzeImageQuality = (img: HTMLImageElement): PhotoQuality => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  // Downscale for performance during analysis
  const scale = Math.min(1, 400 / Math.max(img.width, img.height));
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  
  if (!ctx) return { sharpness: 0, exposure: 0, overall: 0, brightness: 0, issues: ['Analysis failed'] };
  
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  let totalLuminance = 0;
  let totalGradient = 0;
  const issues: string[] = [];

  // 1. Exposure & Brightness Analysis
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Luminance using ITU-R BT.709
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    totalLuminance += lum;
  }
  
  const avgBrightness = totalLuminance / (data.length / 4);
  
  // Exposure Score: 100 is perfectly centered around 128.
  // Penalty for being too dark (<60) or too light (>200)
  let exposureScore = Math.max(0, 100 - (Math.abs(avgBrightness - 128) / 128) * 100);
  
  if (avgBrightness < 50) issues.push('Under-exposed (Dark)');
  if (avgBrightness > 210) issues.push('Over-exposed (Bright)');

  // 2. Sharpness Analysis (Average Gradient Magnitude)
  // Simple check: compare adjacent pixels to detect edge strength
  const width = canvas.width;
  const height = canvas.height;
  let gradientCount = 0;

  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const nextXIdx = (y * width + (x + 1)) * 4;
      const nextYIdx = ((y + 1) * width + x) * 4;
      
      const lum = 0.2126 * data[idx] + 0.7152 * data[idx+1] + 0.0722 * data[idx+2];
      const lumX = 0.2126 * data[nextXIdx] + 0.7152 * data[nextXIdx+1] + 0.0722 * data[nextXIdx+2];
      const lumY = 0.2126 * data[nextYIdx] + 0.7152 * data[nextYIdx+1] + 0.0722 * data[nextYIdx+2];
      
      const dx = lum - lumX;
      const dy = lum - lumY;
      const gradient = Math.sqrt(dx * dx + dy * dy);
      
      totalGradient += gradient;
      gradientCount++;
    }
  }

  const avgGradient = totalGradient / gradientCount;
  // Map gradient to a 0-100 sharpness score. Typical sharp photos hit 15-30+ on this simple metric.
  let sharpnessScore = Math.min(100, (avgGradient / 15) * 100);
  
  if (sharpnessScore < 40) issues.push('Potentially Blurry');

  // Overall Score
  const overall = (exposureScore * 0.4) + (sharpnessScore * 0.6);

  return {
    sharpness: Math.round(sharpnessScore),
    exposure: Math.round(exposureScore),
    overall: Math.round(overall),
    brightness: Math.round(avgBrightness),
    issues
  };
};
