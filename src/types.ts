export interface AbstractExplanation {
  isAbstract: boolean;
  lowAbstractionExplanation: string;
  concreteExample: string;
  analogy?: string;
  whyImportant?: string;
}

export interface KeyTerm {
  term: string;
  definition: string;
  isAbstract?: boolean;
  abstractExplanation?: AbstractExplanation;
  annotations?: Array<{
    id: string;
    word: string;
    explanation: string;
  }>;
}

export interface LectureStudyData {
  title: string;
  core_points: string[];
  key_terms: KeyTerm[];
}

export interface DifficultTerm {
  id: string;
  termIndex: number;
  difficultWord: string;
  simplifiedExplanation: string;
  suggestedReplacement?: string;
}

export interface DifficultTermAnalysisResponse {
  success: boolean;
  analyses?: DifficultTerm[];
  error?: string;
}

export interface ProcessResponse {
  success: boolean;
  data?: LectureStudyData;
  rawTextLength?: number;
  error?: string;
}

