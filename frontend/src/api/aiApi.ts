import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

export type SummaryType =
  | "short"
  | "detailed"
  | "bullets";

export type SummaryResult = {
  message: string;
  summary: string;
  model: string;
  summary_type: SummaryType;
  was_truncated: boolean;
  input_character_count: number;
  processed_character_count: number;
  summary_word_count: number;
};

export type AskDocumentQuestionResult = {
  message: string;
  answer: string;
  question: string;
  model: string;
  was_truncated: boolean;
  input_character_count: number;
  processed_character_count: number;
  answer_word_count: number;
};

export async function summarizeText(
  text: string,
  summaryType: SummaryType = "short"
): Promise<SummaryResult> {
  const response =
    await axios.post<SummaryResult>(
      `${API_BASE_URL}/summarize-text`,
      {
        text,
        summary_type: summaryType,
      }
    );

  return response.data;
}

export async function askDocumentQuestion(
  text: string,
  question: string
): Promise<AskDocumentQuestionResult> {
  const response =
    await axios.post<AskDocumentQuestionResult>(
      `${API_BASE_URL}/ask-document-question`,
      {
        text,
        question,
      }
    );

  return response.data;
}