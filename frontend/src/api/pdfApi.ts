import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

export async function createMultiPagePdf(
  files: File[]
): Promise<Blob> {
  if (files.length === 0) {
    throw new Error(
      "Please select at least one image."
    );
  }

  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await axios.post(
    `${API_BASE_URL}/multi-page-pdf`,
    formData,
    {
      responseType: "blob",
    }
  );

  return response.data;
}