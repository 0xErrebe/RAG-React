import * as pdfjsLib from 'pdfjs-dist';
import '../../node_modules/pdfjs-dist/build/pdf.worker.mjs';
import { TextItem } from 'pdfjs-dist/types/src/display/api';

export async function getPDFData(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  const fullText = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = (textContent.items as TextItem[]).map((item: TextItem) => item?.str).join(' ');
    fullText.push(pageText);
  }

  return fullText;
}