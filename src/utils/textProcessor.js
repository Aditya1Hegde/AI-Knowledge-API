class TextProcessor {
  // Split text into chunks
  static chunkText(text, chunkSize = 500, overlap = 50) {
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end);
      chunks.push(chunk.trim());
      start = end - overlap; // Overlap for context continuity
    }
    
    return chunks;
  }

  // Clean and normalize text
  static cleanText(text) {
    return text
      .replace(/\r\n/g, '\n')           // Normalize line breaks
      .replace(/\n{3,}/g, '\n\n')       // Remove excessive line breaks
      .replace(/\s{2,}/g, ' ')          // Remove excessive spaces
      .trim();
  }

  // Estimate token count (rough approximation)
  static estimateTokens(text) {
    return Math.ceil(text.split(/\s+/).length * 1.3);
  }
}

export default TextProcessor;
