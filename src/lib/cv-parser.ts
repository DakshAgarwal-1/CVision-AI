import { extractSkillsFromText } from './skills';

// Initialize pdfjs-dist worker
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    const workerUrl = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.default;
  }
  return pdfjsLib;
}

export async function parsePdf(file: File): Promise<string> {
  const pdfjs = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText.trim();
}

export function parseTextFile(file: File): Promise<string> {
  return file.text();
}

export async function parseCvFile(file: File): Promise<string> {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return parsePdf(file);
  }
  if (
    file.type === 'text/plain' ||
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.txt')
  ) {
    return parseTextFile(file);
  }
  // Try to read as text for other formats
  return parseTextFile(file);
}

export function extractCandidateName(rawText: string): string | null {
  const lines = rawText.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  // Strategy 1: Explicit label — "Name: Aarav Sharma" / "NAME: ..." / "Full Name: ..."
  for (const line of lines.slice(0, 15)) {
    const labelMatch = line.match(/^(?:full\s*name|name|candidate\s*name|nom)\s*[:]\s*(.+)$/i);
    if (labelMatch) {
      const name = labelMatch[1].trim();
      if (name.length >= 2 && name.length <= 80) return name;
    }
  }

  // Strategy 2: First non-empty line that looks like a person's name.
  // A typical CV starts with the candidate's name as a header line.
  for (const line of lines.slice(0, 5)) {
    // Skip lines that look like contact info, URLs, or section headers
    if (/[@\d]/.test(line)) continue;
    if (/^(?:curriculum\s+vitae|resume|cv|profile|summary|objective|experience|education|skills|contact|address|phone|email)/i.test(line)) {
      continue;
    }
    // A name line: 2-4 words, mostly alphabetic, title-case-ish, reasonable length
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && line.length >= 3 && line.length <= 60) {
      const alphaRatio = (line.match(/[a-zA-Z]/g) || []).length / line.length;
      if (alphaRatio >= 0.7) {
        // Accept if most words start with uppercase or are lowercase with accents
        const looksLikeName = words.every((w) => /^[A-ZÀ-Ý\u4e00-\u9fff]/.test(w) || /^[a-zà-ÿ]/.test(w));
        if (looksLikeName) return line;
      }
    }
  }

  return null;
}

export function analyzeCv(rawText: string): {
  skills: string[];
  experienceYears: number;
  education: string | null;
  score: number;
  candidateName: string | null;
} {
  const skills = extractSkillsFromText(rawText);
  const candidateName = extractCandidateName(rawText);

  // Estimate experience from text
  const expMatch = rawText.match(/(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)/i);
  const experienceYears = expMatch ? parseInt(expMatch[1], 10) : 0;

  // Extract education
  const eduMatch = rawText.match(
    /(?:B\.?Tech|B\.?E\.?|M\.?Tech|M\.?S\.?|B\.?Sc|M\.?Sc|Ph\.?D|Bachelor|Master|Diploma)[^.\n]{0,80}/i
  );
  const education = eduMatch ? eduMatch[0].trim() : null;

  // Calculate score based on skills count and experience
  const skillScore = Math.min(skills.length * 5, 70);
  const expScore = Math.min(experienceYears * 10, 20);
  const eduScore = education ? 10 : 0;
  const score = Math.min(skillScore + expScore + eduScore, 100);

  return { skills, experienceYears, education, score, candidateName };
}
