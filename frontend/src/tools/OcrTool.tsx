import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  extractTextFromImage,
} from "../api/ocrApi";

import {
  uploadDocumentToCloud,
} from "../api/storageApi";

type OcrToolProps = {
  selectedImage: File | null;
};

function OcrTool({
  selectedImage,
}: OcrToolProps) {
  // =========================
  // OCR STATE
  // =========================

  const [
    extractedText,
    setExtractedText,
  ] = useState("");

  const [
    extracting,
    setExtracting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    imagePreviewUrl,
    setImagePreviewUrl,
  ] = useState("");

  // =========================
  // CLOUD SAVE STATE
  // =========================

  const [
    savingToCloud,
    setSavingToCloud,
  ] = useState(false);

  const [
    savedToCloud,
    setSavedToCloud,
  ] = useState(false);

  const [
    cloudSaveMessage,
    setCloudSaveMessage,
  ] = useState("");

  const [
    cloudSaveError,
    setCloudSaveError,
  ] = useState("");

  // =========================
  // IMAGE PREVIEW
  // =========================

  useEffect(() => {
    if (!selectedImage) {
      setImagePreviewUrl("");
      return;
    }

    const objectUrl =
      URL.createObjectURL(selectedImage);

    setImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedImage]);

  // =========================
  // RESET WHEN IMAGE CHANGES
  // =========================

  useEffect(() => {
    setExtractedText("");

    setErrorMessage("");
    setSuccessMessage("");

    setSavingToCloud(false);
    setSavedToCloud(false);

    setCloudSaveMessage("");
    setCloudSaveError("");
  }, [selectedImage]);

  // =========================
  // LIVE TEXT STATISTICS
  // =========================

  const wordCount = useMemo(() => {
    const trimmedText =
      extractedText.trim();

    if (!trimmedText) {
      return 0;
    }

    return trimmedText
      .split(/\s+/)
      .filter(Boolean)
      .length;
  }, [extractedText]);

  const characterCount =
    extractedText.length;

  const hasText =
    extractedText.trim().length > 0;

  // =========================
  // EXTRACT TEXT
  // =========================

  const handleExtract = async () => {
    if (!selectedImage) {
      setErrorMessage(
        "Please select a document image first."
      );

      return;
    }

    setExtracting(true);

    setErrorMessage("");
    setSuccessMessage("");

    setSavedToCloud(false);
    setCloudSaveMessage("");
    setCloudSaveError("");

    try {
      const result =
        await extractTextFromImage(
          selectedImage,
          "eng"
        );

      setExtractedText(result.text);

      if (!result.text.trim()) {
        setErrorMessage(
          "No readable text was found in this image."
        );

        return;
      }

      setSuccessMessage(
        "Text extracted successfully."
      );
    } catch (error) {
      console.error(
        "OCR extraction error:",
        error
      );

      setErrorMessage(
        "Could not extract text from this image."
      );
    } finally {
      setExtracting(false);
    }
  };

  // =========================
  // EDIT TEXT
  // =========================

  const handleTextChange = (
    newText: string
  ) => {
    setExtractedText(newText);

    setSuccessMessage("");

    // If the user edits text after saving,
    // allow the updated version to be saved again.
    if (savedToCloud) {
      setSavedToCloud(false);

      setCloudSaveMessage(
        "Text changed. Save again to store the updated version."
      );
    }

    setCloudSaveError("");
  };

  // =========================
  // COPY TEXT
  // =========================

  const handleCopy = async () => {
    if (!hasText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        extractedText
      );

      setSuccessMessage(
        "Text copied to clipboard."
      );

      setErrorMessage("");
    } catch (error) {
      console.error(
        "Copy error:",
        error
      );

      setErrorMessage(
        "Could not copy text."
      );
    }
  };

  // =========================
  // DOWNLOAD TXT
  // =========================

  const handleDownload = () => {
    if (!hasText) {
      return;
    }

    const textBlob = new Blob(
      [extractedText],
      {
        type: "text/plain;charset=utf-8",
      }
    );

    const objectUrl =
      URL.createObjectURL(textBlob);

    const downloadLink =
      document.createElement("a");

    downloadLink.href = objectUrl;

    downloadLink.download =
      createTextFileName(
        selectedImage?.name
      );

    document.body.appendChild(
      downloadLink
    );

    downloadLink.click();

    downloadLink.remove();

    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1000);

    setSuccessMessage(
      "Text file downloaded successfully."
    );

    setErrorMessage("");
  };

  // =========================
  // SAVE TXT TO CLOUD
  // =========================

  const handleSaveToCloud = async () => {
    if (!hasText) {
      setCloudSaveError(
        "There is no extracted text to save."
      );

      return;
    }

    if (savedToCloud) {
      return;
    }

    setSavingToCloud(true);

    setCloudSaveMessage("");
    setCloudSaveError("");

    try {
      const textFile = new File(
        [extractedText],
        createTextFileName(
          selectedImage?.name
        ),
        {
          type: "text/plain;charset=utf-8",
        }
      );

      await uploadDocumentToCloud(
        textFile
      );

      setSavedToCloud(true);

      setCloudSaveMessage(
        "Extracted text saved privately to My Documents."
      );
    } catch (error) {
      console.error(
        "OCR cloud save error:",
        error
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Could not save text to cloud.";

      setCloudSaveError(
        errorMessage
      );
    } finally {
      setSavingToCloud(false);
    }
  };

  return (
    <section className="tool-card ocr-tool">
      {/* =========================
          HEADING
      ========================= */}

      <div className="ocr-heading">
        <h2>
          OCR Text Extraction
        </h2>

        <p className="tool-description">
          Extract, review, edit, copy, download,
          and privately save text from document images.
        </p>
      </div>

      {/* =========================
          MAIN OCR WORKSPACE
      ========================= */}

      <div className="ocr-workspace-grid">
        {/* =====================
            ORIGINAL DOCUMENT
        ====================== */}

        <section className="ocr-document-panel">
          <div className="ocr-panel-heading">
            <div>
              <h3>
                Original Document
              </h3>

              <p>
                The image currently selected for OCR.
              </p>
            </div>
          </div>

          <div className="ocr-selected-file">
            <span className="ocr-file-label">
              Selected document
            </span>

            <strong>
              {selectedImage
                ? selectedImage.name
                : "No image selected"}
            </strong>
          </div>

          <div className="ocr-image-preview">
            {imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt="OCR document preview"
              />
            ) : (
              <div className="ocr-no-image">
                <span>📄</span>

                <h4>
                  No document selected
                </h4>

                <p>
                  Choose an image from the top bar
                  to begin OCR.
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            className="ocr-extract-btn"
            onClick={handleExtract}
            disabled={
              !selectedImage ||
              extracting
            }
          >
            {extracting
              ? "Extracting Text..."
              : "Extract Text"}
          </button>

          {successMessage && (
            <div className="ocr-success">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="ocr-error">
              {errorMessage}
            </div>
          )}
        </section>

        {/* =====================
            EXTRACTED TEXT
        ====================== */}

        <section className="ocr-text-panel">
          <div className="ocr-result-header">
            <div>
              <h3>
                Extracted Text
              </h3>

              <p>
                Review and correct the OCR result
                before copying, downloading, or
                saving it.
              </p>
            </div>

            <div className="ocr-stats">
              <span>
                {wordCount}{" "}
                {wordCount === 1
                  ? "word"
                  : "words"}
              </span>

              <span>
                {characterCount} characters
              </span>
            </div>
          </div>

          <textarea
            className="ocr-textarea"
            value={extractedText}
            onChange={(event) =>
              handleTextChange(
                event.target.value
              )
            }
            placeholder={
              selectedImage
                ? "Click Extract Text and the OCR result will appear here..."
                : "Select a document image first..."
            }
            spellCheck
          />

          <div className="ocr-actions">
            <button
              type="button"
              className="ocr-copy-btn"
              onClick={handleCopy}
              disabled={!hasText}
            >
              Copy Text
            </button>

            <button
              type="button"
              className="ocr-download-btn"
              onClick={handleDownload}
              disabled={!hasText}
            >
              Download TXT
            </button>

            <button
              type="button"
              className="ocr-save-cloud-btn"
              onClick={handleSaveToCloud}
              disabled={
                !hasText ||
                savingToCloud ||
                savedToCloud
              }
            >
              {savingToCloud
                ? "Saving..."
                : savedToCloud
                  ? "Saved ✓"
                  : "Save to My Documents"}
            </button>
          </div>

          {cloudSaveMessage && (
            <div className="ocr-cloud-success">
              {cloudSaveMessage}
            </div>
          )}

          {cloudSaveError && (
            <div className="ocr-error">
              {cloudSaveError}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

// =========================
// CREATE TXT FILE NAME
// =========================

function createTextFileName(
  originalName?: string
) {
  if (!originalName) {
    return "scanify-extracted-text.txt";
  }

  const nameWithoutExtension =
    originalName.replace(
      /\.[^/.]+$/,
      ""
    );

  return `${nameWithoutExtension}-ocr.txt`;
}

export default OcrTool;