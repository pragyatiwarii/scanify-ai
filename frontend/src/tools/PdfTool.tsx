import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import type { ScanMode } from "../types";

import {
  createMultiPagePdf,
} from "../api/pdfApi";

import {
  uploadDocumentToCloud,
} from "../api/storageApi";

type PdfToolProps = {
  scanMode: ScanMode;

  imagePdfUrl: string;
  scannedPdfUrl: string;
  autoScannedPdfUrl: string;

  onScanModeChange: (mode: ScanMode) => void;
  onImageToPdf: () => void;
  onScanToPdf: (autoCrop: boolean) => void;
};

type MultiPageItem = {
  id: string;
  file: File;
  previewUrl: string;
};

function PdfTool({
  scanMode,
  imagePdfUrl,
  scannedPdfUrl,
  autoScannedPdfUrl,
  onScanModeChange,
  onImageToPdf,
  onScanToPdf,
}: PdfToolProps) {
  // =========================
  // MULTI-PAGE STATE
  // =========================

  const [multiPageItems, setMultiPageItems] =
    useState<MultiPageItem[]>([]);

  const [multiPagePdfUrl, setMultiPagePdfUrl] =
    useState("");

  const [creatingPdf, setCreatingPdf] =
    useState(false);

  const [multiPageMessage, setMultiPageMessage] =
    useState("");

  const [multiPageError, setMultiPageError] =
    useState("");

  // =========================
  // CLOUD SAVE STATE
  // =========================

  const [savingToCloud, setSavingToCloud] =
    useState(false);

  const [savedToCloud, setSavedToCloud] =
    useState(false);

  const [cloudSaveMessage, setCloudSaveMessage] =
    useState("");

  const [cloudSaveError, setCloudSaveError] =
    useState("");

  // =========================
  // TEMPORARY URL / BLOB REFS
  // =========================

  const previewUrlsRef =
    useRef<Set<string>>(new Set());

  const generatedPdfUrlRef =
    useRef("");

  const generatedPdfBlobRef =
    useRef<Blob | null>(null);

  // =========================
  // CLEAN TEMPORARY URLS
  // =========================

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });

      previewUrlsRef.current.clear();

      if (generatedPdfUrlRef.current) {
        URL.revokeObjectURL(
          generatedPdfUrlRef.current
        );
      }
    };
  }, []);

  // =========================
  // RESET GENERATED PDF
  // =========================

  const resetGeneratedPdf = () => {
    if (generatedPdfUrlRef.current) {
      URL.revokeObjectURL(
        generatedPdfUrlRef.current
      );

      generatedPdfUrlRef.current = "";
    }

    generatedPdfBlobRef.current = null;

    setMultiPagePdfUrl("");

    setMultiPageMessage("");
    setMultiPageError("");

    setSavingToCloud(false);
    setSavedToCloud(false);

    setCloudSaveMessage("");
    setCloudSaveError("");
  };

  // =========================
  // SELECT MULTIPLE IMAGES
  // =========================

  const handleMultiPageSelection = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = Array.from(
      event.target.files ?? []
    ).filter((file) =>
      file.type.startsWith("image/")
    );

    if (selectedFiles.length === 0) {
      return;
    }

    resetGeneratedPdf();

    const newItems = selectedFiles.map(
      (file, index) => {
        const previewUrl =
          URL.createObjectURL(file);

        previewUrlsRef.current.add(
          previewUrl
        );

        return {
          id: [
            file.name,
            file.size,
            file.lastModified,
            Date.now(),
            index,
          ].join("-"),

          file,
          previewUrl,
        };
      }
    );

    setMultiPageItems((currentItems) => [
      ...currentItems,
      ...newItems,
    ]);

    // Allows the same image to be selected again later.
    event.target.value = "";
  };

  // =========================
  // MOVE PAGE
  // =========================

  const movePage = (
    index: number,
    direction: -1 | 1
  ) => {
    resetGeneratedPdf();

    setMultiPageItems((currentItems) => {
      const targetIndex =
        index + direction;

      if (
        targetIndex < 0 ||
        targetIndex >= currentItems.length
      ) {
        return currentItems;
      }

      const updatedItems = [
        ...currentItems,
      ];

      [
        updatedItems[index],
        updatedItems[targetIndex],
      ] = [
        updatedItems[targetIndex],
        updatedItems[index],
      ];

      return updatedItems;
    });
  };

  // =========================
  // REMOVE ONE PAGE
  // =========================

  const removePage = (
    pageId: string
  ) => {
    resetGeneratedPdf();

    setMultiPageItems((currentItems) => {
      const pageToRemove =
        currentItems.find(
          (item) => item.id === pageId
        );

      if (pageToRemove) {
        URL.revokeObjectURL(
          pageToRemove.previewUrl
        );

        previewUrlsRef.current.delete(
          pageToRemove.previewUrl
        );
      }

      return currentItems.filter(
        (item) => item.id !== pageId
      );
    });
  };

  // =========================
  // CLEAR ALL PAGES
  // =========================

  const clearAllPages = () => {
    multiPageItems.forEach((item) => {
      URL.revokeObjectURL(
        item.previewUrl
      );

      previewUrlsRef.current.delete(
        item.previewUrl
      );
    });

    setMultiPageItems([]);

    resetGeneratedPdf();
  };

  // =========================
  // CREATE MULTI-PAGE PDF
  // =========================

  const handleCreateMultiPagePdf =
    async () => {
      if (multiPageItems.length === 0) {
        setMultiPageError(
          "Please select at least one image."
        );

        return;
      }

      setCreatingPdf(true);

      setMultiPageMessage("");
      setMultiPageError("");

      setCloudSaveMessage("");
      setCloudSaveError("");

      setSavedToCloud(false);

      try {
        const orderedFiles =
          multiPageItems.map(
            (item) => item.file
          );

        const pdfBlob =
          await createMultiPagePdf(
            orderedFiles
          );

        if (generatedPdfUrlRef.current) {
          URL.revokeObjectURL(
            generatedPdfUrlRef.current
          );
        }

        const pdfUrl =
          URL.createObjectURL(pdfBlob);

        generatedPdfUrlRef.current =
          pdfUrl;

        generatedPdfBlobRef.current =
          pdfBlob;

        setMultiPagePdfUrl(pdfUrl);

        setMultiPageMessage(
          `${multiPageItems.length}-page PDF created successfully.`
        );
      } catch (error) {
        console.error(
          "Multi-page PDF error:",
          error
        );

        generatedPdfBlobRef.current = null;

        setMultiPageError(
          "Could not create the multi-page PDF."
        );
      } finally {
        setCreatingPdf(false);
      }
    };

  // =========================
  // SAVE PDF TO MY DOCUMENTS
  // =========================

  const handleSavePdfToCloud =
    async () => {
      const pdfBlob =
        generatedPdfBlobRef.current;

      if (!pdfBlob) {
        setCloudSaveError(
          "Please create the PDF first."
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
        const fileName =
          `scanify-multi-page-${Date.now()}.pdf`;

        const pdfFile = new File(
          [pdfBlob],
          fileName,
          {
            type: "application/pdf",
          }
        );

        await uploadDocumentToCloud(
          pdfFile
        );

        setSavedToCloud(true);

        setCloudSaveMessage(
          "PDF saved privately to My Documents."
        );
      } catch (error) {
        console.error(
          "PDF cloud save error:",
          error
        );

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Could not save PDF to cloud.";

        setCloudSaveError(
          errorMessage
        );
      } finally {
        setSavingToCloud(false);
      }
    };

  return (
    <section className="tool-card">
      <h2>PDF Tools</h2>

      <p className="tool-description">
        Convert original or scanned images into
        PDF documents.
      </p>

      {/* =====================
          SINGLE IMAGE PDF
      ====================== */}

      <div className="pdf-tool-section">
        <h3>Single Image PDF</h3>

        <button onClick={onImageToPdf}>
          Convert Original Image to PDF
        </button>

        {imagePdfUrl && (
          <a
            href={imagePdfUrl}
            download="image-document.pdf"
          >
            Download Original Image PDF
          </a>
        )}
      </div>

      {/* =====================
          SCANNED PDF
      ====================== */}

      <div className="pdf-tool-section">
        <h3>Scanned PDF</h3>

        <label>
          Scan Mode for scanned PDF
        </label>

        <select
          value={scanMode}
          onChange={(event) =>
            onScanModeChange(
              event.target.value as ScanMode
            )
          }
        >
          <option value="clean">
            Clean Paper Scan
          </option>

          <option value="color">
            Enhanced Color Scan
          </option>

          <option value="gray">
            Grayscale Soft Scan
          </option>

          <option value="bw">
            Black & White Text Scan
          </option>
        </select>

        <button
          onClick={() =>
            onScanToPdf(false)
          }
        >
          Scan + Convert to PDF
        </button>

        {scannedPdfUrl && (
          <a
            href={scannedPdfUrl}
            download="scanned-document.pdf"
          >
            Download Scanned PDF
          </a>
        )}

        <button
          onClick={() =>
            onScanToPdf(true)
          }
        >
          Auto Crop + Scan + Convert to PDF
        </button>

        {autoScannedPdfUrl && (
          <a
            href={autoScannedPdfUrl}
            download="auto-scanned-document.pdf"
          >
            Download Auto-Scanned PDF
          </a>
        )}
      </div>

      {/* =====================
          MULTI-PAGE PDF
      ====================== */}

      <div className="pdf-tool-section multi-page-builder">
        <div className="multi-page-heading">
          <div>
            <h3>
              Multi-Page PDF Builder
            </h3>

            <p>
              Select multiple images and arrange
              them in the correct page order.
            </p>
          </div>

          {multiPageItems.length > 0 && (
            <button
              type="button"
              className="clear-pages-btn"
              onClick={clearAllPages}
              disabled={
                creatingPdf ||
                savingToCloud
              }
            >
              Clear All
            </button>
          )}
        </div>

        <label className="multi-page-file-picker">
          Select Multiple Images

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={
              handleMultiPageSelection
            }
            disabled={
              creatingPdf ||
              savingToCloud
            }
          />
        </label>

        {multiPageItems.length === 0 ? (
          <div className="multi-page-empty">
            <p>
              No pages selected yet.
            </p>

            <span>
              Select two or more images to start
              building your PDF.
            </span>
          </div>
        ) : (
          <>
            <div className="multi-page-summary">
              {multiPageItems.length}{" "}
              {multiPageItems.length === 1
                ? "page"
                : "pages"}{" "}
              ready
            </div>

            <div className="multi-page-list">
              {multiPageItems.map(
                (item, index) => (
                  <article
                    className="multi-page-item"
                    key={item.id}
                  >
                    <div className="page-number">
                      Page {index + 1}
                    </div>

                    <img
                      src={item.previewUrl}
                      alt={`Page ${index + 1}`}
                    />

                    <div className="page-file-info">
                      <strong
                        title={item.file.name}
                      >
                        {item.file.name}
                      </strong>

                      <span>
                        {formatFileSize(
                          item.file.size
                        )}
                      </span>
                    </div>

                    <div className="page-order-actions">
                      <button
                        type="button"
                        onClick={() =>
                          movePage(index, -1)
                        }
                        disabled={
                          index === 0 ||
                          creatingPdf ||
                          savingToCloud
                        }
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          movePage(index, 1)
                        }
                        disabled={
                          index ===
                            multiPageItems.length -
                              1 ||
                          creatingPdf ||
                          savingToCloud
                        }
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        className="remove-page-btn"
                        onClick={() =>
                          removePage(item.id)
                        }
                        disabled={
                          creatingPdf ||
                          savingToCloud
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                )
              )}
            </div>

            <button
              type="button"
              className="create-multi-pdf-btn"
              onClick={
                handleCreateMultiPagePdf
              }
              disabled={
                creatingPdf ||
                savingToCloud
              }
            >
              {creatingPdf
                ? "Creating PDF..."
                : `Create ${multiPageItems.length}-Page PDF`}
            </button>

            {multiPageMessage && (
              <div className="multi-page-success">
                {multiPageMessage}
              </div>
            )}

            {multiPageError && (
              <div className="multi-page-error">
                {multiPageError}
              </div>
            )}

            {multiPagePdfUrl && (
              <div className="multi-page-result">
                <h4>
                  Your PDF is ready
                </h4>

                <div className="multi-page-result-actions">
                  <a
                    href={multiPagePdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="multi-page-open-btn"
                  >
                    Open PDF
                  </a>

                  <a
                    href={multiPagePdfUrl}
                    download="scanify-multi-page.pdf"
                    className="multi-page-download-btn"
                  >
                    Download PDF
                  </a>

                  <button
                    type="button"
                    className="multi-page-save-cloud-btn"
                    onClick={
                      handleSavePdfToCloud
                    }
                    disabled={
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
                  <div className="multi-page-cloud-success">
                    {cloudSaveMessage}
                  </div>
                )}

                {cloudSaveError && (
                  <div className="multi-page-error">
                    {cloudSaveError}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

export default PdfTool;