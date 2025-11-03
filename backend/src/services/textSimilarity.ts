/**
 * Text Similarity Service
 * Implements simple TF-IDF vectorization and cosine similarity
 * Can be swapped for external AI provider
 */

interface Document {
  id: string;
  text: string;
}

/**
 * Simple tokenizer - splits text into words
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

/**
 * Calculate term frequency (TF)
 */
function calculateTF(term: string, document: string[]): number {
  const termCount = document.filter((word) => word === term).length;
  return termCount / document.length;
}

/**
 * Calculate inverse document frequency (IDF)
 */
function calculateIDF(
  term: string,
  documents: Document[]
): number {
  const docsWithTerm = documents.filter((doc) =>
    tokenize(doc.text).includes(term)
  ).length;

  if (docsWithTerm === 0) return 0;
  return Math.log(documents.length / docsWithTerm);
}

/**
 * Create TF-IDF vector for a document
 */
function createTFIDFVector(
  document: string[],
  vocabulary: string[],
  documents: Document[]
): number[] {
  return vocabulary.map((term) => {
    const tf = calculateTF(term, document);
    const idf = calculateIDF(term, documents);
    return tf * idf;
  });
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) return 0;

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Calculate similarity between a new report and existing reports in the same area
 */
export async function calculateSimilarity(
  newReportText: string,
  existingReports: Array<{ id: number; description: string }>
): Promise<{
  averageSimilarity: number;
  similarCount: number;
  maxSimilarity: number;
}> {
  if (existingReports.length === 0) {
    return {
      averageSimilarity: 0,
      similarCount: 0,
      maxSimilarity: 0,
    };
  }

  // Create documents array
  const documents: Document[] = [
    { id: 'new', text: newReportText },
    ...existingReports.map((r) => ({ id: r.id.toString(), text: r.description })),
  ];

  // Build vocabulary from all documents
  const allTokens = new Set<string>();
  documents.forEach((doc) => {
    tokenize(doc.text).forEach((token) => allTokens.add(token));
  });
  const vocabulary = Array.from(allTokens);

  // Create vectors
  const newDocTokens = tokenize(newReportText);
  const newVector = createTFIDFVector(newDocTokens, vocabulary, documents);

  // Compare with existing reports
  const similarities: number[] = [];
  for (const report of existingReports) {
    const reportTokens = tokenize(report.description);
    const reportVector = createTFIDFVector(reportTokens, vocabulary, documents);
    const similarity = cosineSimilarity(newVector, reportVector);
    similarities.push(similarity);
  }

  const threshold = parseFloat(process.env.SIMILARITY_THRESHOLD || '0.7');
  const similarCount = similarities.filter((s) => s >= threshold).length;

  return {
    averageSimilarity:
      similarities.reduce((a, b) => a + b, 0) / similarities.length,
    similarCount,
    maxSimilarity: Math.max(...similarities, 0),
  };
}

/**
 * Calculate credibility boost based on similarity
 */
export function calculateCredibilityBoost(
  similarity: { averageSimilarity: number; similarCount: number }
): number {
  const boost = parseFloat(process.env.SIMILARITY_CREDIBILITY_BOOST || '0.2');
  
  if (similarity.similarCount >= 3 && similarity.averageSimilarity >= 0.7) {
    return boost;
  }
  
  if (similarity.similarCount >= 2 && similarity.averageSimilarity >= 0.6) {
    return boost * 0.5;
  }
  
  return 0;
}

