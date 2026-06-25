import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

export async function resizeImageApi(
  file: File,
  width: number,
  height: number
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("width", String(width));
  formData.append("height", String(height));

  const response = await axios.post(
    `${API_BASE_URL}/resize-image`,
    formData,
    {
      responseType: "blob",
    }
  );

  return URL.createObjectURL(response.data);
}