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

import {
  summarizeText,
  type SummaryType,
} from "../api/aiApi";

type OcrToolProps = {
  selectedImage: File | null;
};

type OcrLanguage =
  | "eng"
  | "hin"
  | "hin+eng";

function OcrTool({
  selectedImage,
}: OcrToolProps) {
  // =========================
  // OCR STATE
  // =========================

  const [
  ocrLanguage,
  setOcrLanguage,
] = useState<OcrLanguage>("eng");

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
  // OCR CLOUD SAVE STATE
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
  // AI SUMMARY STATE
  // =========================

  const [
    aiSummary,
    setAiSummary,
  ] = useState("");

  const [
    selectedSummaryType,
    setSelectedSummaryType,
  ] = useState<SummaryType>("short");

  const [
    summarizing,
    setSummarizing,
  ] = useState(false);

  const [
    summaryMessage,
    setSummaryMessage,
  ] = useState("");

  const [
    summaryError,
    setSummaryError,
  ] = useState("");

  const [
    savingSummaryToCloud,
    setSavingSummaryToCloud,
  ] = useState(false);

  const [
    summarySavedToCloud,
    setSummarySavedToCloud,
  ] = useState(false);

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

    setAiSummary("");
    setSelectedSummaryType("short");

    setSummaryMessage("");
    setSummaryError("");

    setSavingSummaryToCloud(false);
    setSummarySavedToCloud(false);
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

  const summaryWordCount = useMemo(() => {
    const trimmedSummary =
      aiSummary.trim();

    if (!trimmedSummary) {
      return 0;
    }

    return trimmedSummary
      .split(/\s+/)
      .filter(Boolean)
      .length;
  }, [aiSummary]);

  const hasSummary =
    aiSummary.trim().length > 0;

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

    setAiSummary("");
    setSummaryMessage("");
    setSummaryError("");
    setSummarySavedToCloud(false);

    try {
      const result =
        await extractTextFromImage(
          selectedImage,
          ocrLanguage
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
  // EDIT OCR TEXT
  // =========================

  const handleTextChange = (
    newText: string
  ) => {
    setExtractedText(newText);

    setSuccessMessage("");

    if (savedToCloud) {
      setSavedToCloud(false);

      setCloudSaveMessage(
        "Text changed. Save again to store the updated version."
      );
    }

    if (aiSummary) {
      setSummaryMessage(
        "OCR text changed. Generate the summary again for the updated text."
      );

      setSummarySavedToCloud(false);
    }

    setCloudSaveError("");
    setSummaryError("");
  };

  // =========================
  // COPY OCR TEXT
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
  // DOWNLOAD OCR TXT
  // =========================

  const handleDownload = () => {
    if (!hasText) {
      return;
    }

    downloadTextFile(
      extractedText,
      createTextFileName(
        selectedImage?.name
      )
    );

    setSuccessMessage(
      "Text file downloaded successfully."
    );

    setErrorMessage("");
  };

  // =========================
  // SAVE OCR TXT TO CLOUD
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

      const message =
        error instanceof Error
          ? error.message
          : "Could not save text to cloud.";

      setCloudSaveError(message);
    } finally {
      setSavingToCloud(false);
    }
  };

  // =========================
  // AI SUMMARIZATION
  // =========================

  const handleSummarize = async (
    summaryType: SummaryType
  ) => {
    if (!hasText) {
      setSummaryError(
        "Extract or paste text before summarizing."
      );

      return;
    }

    setSelectedSummaryType(
      summaryType
    );

    setSummarizing(true);

    setSummaryMessage("");
    setSummaryError("");

    setSummarySavedToCloud(false);

    try {
      const result =
        await summarizeText(
          extractedText,
          summaryType
        );

      setAiSummary(
        result.summary
      );

      setSummaryMessage(
        result.was_truncated
          ? "Summary generated. Long text was shortened before sending to AI."
          : "Summary generated successfully."
      );
    } catch (error) {
      console.error(
        "AI summary error:",
        error
      );

      setSummaryError(
        "Could not generate AI summary."
      );
    } finally {
      setSummarizing(false);
    }
  };

  // =========================
  // EDIT SUMMARY
  // =========================

  const handleSummaryChange = (
    newSummary: string
  ) => {
    setAiSummary(newSummary);

    setSummaryMessage("");

    if (summarySavedToCloud) {
      setSummarySavedToCloud(false);

      setSummaryMessage(
        "Summary changed. Save again to store the updated version."
      );
    }

    setSummaryError("");
  };

  // =========================
  // COPY SUMMARY
  // =========================

  const handleCopySummary = async () => {
    if (!hasSummary) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        aiSummary
      );

      setSummaryMessage(
        "Summary copied to clipboard."
      );

      setSummaryError("");
    } catch (error) {
      console.error(
        "Summary copy error:",
        error
      );

      setSummaryError(
        "Could not copy summary."
      );
    }
  };

  // =========================
  // DOWNLOAD SUMMARY
  // =========================

  const handleDownloadSummary = () => {
    if (!hasSummary) {
      return;
    }

    downloadTextFile(
      aiSummary,
      createSummaryFileName(
        selectedImage?.name,
        selectedSummaryType
      )
    );

    setSummaryMessage(
      "Summary downloaded successfully."
    );

    setSummaryError("");
  };

  // =========================
  // SAVE SUMMARY TO CLOUD
  // =========================

  const handleSaveSummaryToCloud =
    async () => {
      if (!hasSummary) {
        setSummaryError(
          "There is no summary to save."
        );

        return;
      }

      if (summarySavedToCloud) {
        return;
      }

      setSavingSummaryToCloud(true);

      setSummaryMessage("");
      setSummaryError("");

      try {
        const summaryFile = new File(
          [aiSummary],
          createSummaryFileName(
            selectedImage?.name,
            selectedSummaryType
          ),
          {
            type: "text/plain;charset=utf-8",
          }
        );

        await uploadDocumentToCloud(
          summaryFile
        );

        setSummarySavedToCloud(true);

        setSummaryMessage(
          "AI summary saved privately to My Documents."
        );
      } catch (error) {
        console.error(
          "Summary cloud save error:",
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : "Could not save summary to cloud.";

        setSummaryError(message);
      } finally {
        setSavingSummaryToCloud(false);
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
          Extract, review, edit, summarize,
          download, and privately save text
          from document images.
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

          <div className="ocr-language-control">
  <label htmlFor="ocr-language">
    OCR Language
  </label>

  <select
    id="ocr-language"
    value={ocrLanguage}
    onChange={(event) => {
      const newLanguage =
        event.target.value as OcrLanguage;

      setOcrLanguage(newLanguage);

      setExtractedText("");
      setAiSummary("");

      setSuccessMessage("");
      setErrorMessage("");

      setCloudSaveMessage("");
      setCloudSaveError("");

      setSummaryMessage("");
      setSummaryError("");

      setSavedToCloud(false);
      setSummarySavedToCloud(false);
    }}
  >
    <option value="eng">
      English
    </option>

    <option value="hin">
      Hindi
    </option>

    <option value="hin+eng">
      Hindi + English
    </option>
  </select>

  <p>
    Choose Hindi for Devanagari documents.
    Use Hindi + English for mixed pages.
  </p>
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
                before copying, downloading,
                saving, or summarizing it.
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
                  : "Save Text"}
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

          {/* =====================
              AI SUMMARY
          ====================== */}

          <section className="ocr-ai-section">
            <div className="ocr-ai-header">
              <div>
                <h3>
                  AI Document Summary
                </h3>

                <p>
                  Generate a summary from the extracted
                  text using your AICredits connection.
                </p>
              </div>

              <span className="ocr-ai-badge">
                AI
              </span>
            </div>

            <div className="ocr-summary-mode-buttons">
              <button
                type="button"
                className={
                  selectedSummaryType === "short"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  handleSummarize("short")
                }
                disabled={
                  !hasText ||
                  summarizing
                }
              >
                Short Summary
              </button>

              <button
                type="button"
                className={
                  selectedSummaryType === "detailed"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  handleSummarize("detailed")
                }
                disabled={
                  !hasText ||
                  summarizing
                }
              >
                Detailed Summary
              </button>

              <button
                type="button"
                className={
                  selectedSummaryType === "bullets"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  handleSummarize("bullets")
                }
                disabled={
                  !hasText ||
                  summarizing
                }
              >
                Study Notes
              </button>
            </div>

            {summarizing && (
              <div className="ocr-ai-loading">
                Generating AI summary...
              </div>
            )}

            {summaryMessage && (
              <div className="ocr-success">
                {summaryMessage}
              </div>
            )}

            {summaryError && (
              <div className="ocr-error">
                {summaryError}
              </div>
            )}

            <div className="ocr-summary-stats">
              <span>
                {summaryWordCount}{" "}
                {summaryWordCount === 1
                  ? "word"
                  : "words"}
              </span>

              <span>
                {selectedSummaryType}
              </span>
            </div>

            <textarea
              className="ocr-summary-textarea"
              value={aiSummary}
              onChange={(event) =>
                handleSummaryChange(
                  event.target.value
                )
              }
              placeholder={
                hasText
                  ? "Choose Short Summary, Detailed Summary, or Study Notes..."
                  : "Extract text first to generate an AI summary..."
              }
              spellCheck
            />

            <div className="ocr-summary-actions">
              <button
                type="button"
                onClick={handleCopySummary}
                disabled={!hasSummary}
              >
                Copy Summary
              </button>

              <button
                type="button"
                onClick={handleDownloadSummary}
                disabled={!hasSummary}
              >
                Download Summary
              </button>

              <button
                type="button"
                className="ocr-save-summary-btn"
                onClick={handleSaveSummaryToCloud}
                disabled={
                  !hasSummary ||
                  savingSummaryToCloud ||
                  summarySavedToCloud
                }
              >
                {savingSummaryToCloud
                  ? "Saving..."
                  : summarySavedToCloud
                    ? "Saved ✓"
                    : "Save Summary"}
              </button>
            </div>
          </section>
        </section>
      </div>
    </section>
  );
}

// =========================
// DOWNLOAD TEXT FILE
// =========================

function downloadTextFile(
  text: string,
  fileName: string
) {
  const textBlob = new Blob(
    [text],
    {
      type: "text/plain;charset=utf-8",
    }
  );

  const objectUrl =
    URL.createObjectURL(textBlob);

  const downloadLink =
    document.createElement("a");

  downloadLink.href = objectUrl;
  downloadLink.download = fileName;

  document.body.appendChild(
    downloadLink
  );

  downloadLink.click();

  downloadLink.remove();

  setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}

// =========================
// CREATE OCR TXT FILE NAME
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

// =========================
// CREATE SUMMARY FILE NAME
// =========================

function createSummaryFileName(
  originalName: string | undefined,
  summaryType: SummaryType
) {
  const baseName = originalName
    ? originalName.replace(
        /\.[^/.]+$/,
        ""
      )
    : "scanify-document";

  return `${baseName}-${summaryType}-summary.txt`;
}

export default OcrTool;