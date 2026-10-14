import { PDF_EXTENSION, PDF_MIME_TYPE } from '../data/config';

export function isPdfFile(file: File) {
  return file.type === PDF_MIME_TYPE || file.name.toLowerCase().endsWith(PDF_EXTENSION);
}