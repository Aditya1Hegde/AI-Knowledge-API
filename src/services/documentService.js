import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

import Document from '../models/Document.js';
import DocumentChunk from '../models/DocumentChunk.js';
import TextProcessor from '../utils/textProcessor.js';
// import EmbeddingService from './embeddingService.js';  // COMMENT THIS OUT FOR NOW
import mammoth from 'mammoth';
import fs from 'fs/promises';

class DocumentService {
  static async extractText(filePath, fileType) {
    try {
      if (fileType === 'application/pdf') {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
      } 
      else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      } 
      else if (fileType === 'text/plain' || fileType === 'text/markdown') {
        return await fs.readFile(filePath, 'utf-8');
      }
      
      throw new Error('Unsupported file type');
    } catch (error) {
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  static async processDocument(documentId, filePath, fileType) {
    try {
      const rawText = await this.extractText(filePath, fileType);
      const cleanedText = TextProcessor.cleanText(rawText);
      const chunks = TextProcessor.chunkText(cleanedText);

      console.log(`📝 Processing ${chunks.length} chunks for document ${documentId}`);

      // SKIP EMBEDDINGS FOR NOW - just save chunks
      for (let i = 0; i < chunks.length; i++) {
        const tokenCount = TextProcessor.estimateTokens(chunks[i]);
        await DocumentChunk.create({
          documentId,
          chunkNumber: i,
          content: chunks[i],
          tokenCount,
          embedding: null  // No embeddings for now
        });
      }

      await Document.updateStatus(documentId, 'completed');
      await Document.updateChunkCount(documentId, chunks.length);

      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.log('File cleanup: already deleted');
      }

      console.log(`✅ Document ${documentId} processed with ${chunks.length} chunks`);
      return { success: true, chunksCreated: chunks.length };
    } catch (error) {
      console.error('❌ Processing error:', error);
      await Document.updateStatus(documentId, 'failed');
      throw error;
    }
  }
}

export default DocumentService;
