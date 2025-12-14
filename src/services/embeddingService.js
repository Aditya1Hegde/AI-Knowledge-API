import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';

dotenv.config();

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

class EmbeddingService {
  // Generate embedding for a single text
  static async generateEmbedding(text) {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
      }

      // Using sentence-transformers/all-MiniLM-L6-v2 (free, fast, good quality)
      // Produces 384-dimensional embeddings
      const result = await hf.featureExtraction({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        inputs: text
      });

      return result; // Returns array of 384 numbers
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  // Generate embeddings for multiple texts (batch)
  static async generateEmbeddings(texts) {
    try {
      if (!texts || texts.length === 0) {
        throw new Error('Texts array cannot be empty');
      }

      // Process in smaller batches to avoid rate limits
      const embeddings = [];
      const batchSize = 5;

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        // Generate embeddings for batch
        const batchEmbeddings = await Promise.all(
          batch.map(text => this.generateEmbedding(text))
        );
        
        embeddings.push(...batchEmbeddings);
        
        // Small delay to avoid rate limiting (free tier)
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      return embeddings;
    } catch (error) {
      console.error('Batch embedding generation error:', error);
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }

  // Calculate cosine similarity between two vectors
  static cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export default EmbeddingService;
