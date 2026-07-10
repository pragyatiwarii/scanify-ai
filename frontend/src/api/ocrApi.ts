import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

export type OcrResult = {
  message: string;
  text: string;
  word_count: number;
  character_count: number;
  language: string;
};

export async function extractTextFromImage(
  file: File,
  language: string = "eng"
): Promise<OcrResult> {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("language", language);

  const response = await axios.post<OcrResult>(
    `${API_BASE_URL}/extract-text`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}