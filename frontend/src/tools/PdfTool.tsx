import type { ScanMode } from "../types";

type PdfToolProps = {
  scanMode: ScanMode;
  imagePdfUrl: string;
  scannedPdfUrl: string;
  autoScannedPdfUrl: string;
  onScanModeChange: (mode: ScanMode) => void;
  onImageToPdf: () => void;
  onScanToPdf: (autoCrop: boolean) => void;
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
  return (
    <section className="tool-card">
      <h2>PDF Tools</h2>

      <p className="tool-description">
        Convert original or scanned images into PDF documents.
      </p>

      <label>Scan Mode for scanned PDF</label>
      <select
        value={scanMode}
        onChange={(event) => onScanModeChange(event.target.value as ScanMode)}
      >
        <option value="clean">Clean Paper Scan</option>
        <option value="color">Enhanced Color Scan</option>
        <option value="gray">Grayscale Soft Scan</option>
        <option value="bw">Black & White Text Scan</option>
      </select>

      <button onClick={onImageToPdf}>Convert Original Image to PDF</button>

      {imagePdfUrl && (
        <a href={imagePdfUrl} download="image-document.pdf">
          Download Original Image PDF
        </a>
      )}

      <button onClick={() => onScanToPdf(false)}>Scan + Convert to PDF</button>

      {scannedPdfUrl && (
        <a href={scannedPdfUrl} download="scanned-document.pdf">
          Download Scanned PDF
        </a>
      )}

      <button onClick={() => onScanToPdf(true)}>
        Auto Crop + Scan + Convert to PDF
      </button>

      {autoScannedPdfUrl && (
        <a href={autoScannedPdfUrl} download="auto-scanned-document.pdf">
          Download Auto-Scanned PDF
        </a>
      )}
    </section>
  );
}

export default PdfTool;