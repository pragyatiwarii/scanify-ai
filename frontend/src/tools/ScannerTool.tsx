import type { ScanMode } from "../types";

type ScannerToolProps = {
  scanMode: ScanMode;
  onScanModeChange: (mode: ScanMode) => void;
  onScanDocument: () => void;
  onAutoScanDocument: () => void;
};

function ScannerTool({
  scanMode,
  onScanModeChange,
  onScanDocument,
  onAutoScanDocument,
}: ScannerToolProps) {
  return (
    <section className="tool-card">
      <h2>Document Scanner</h2>

      <p className="tool-description">
        Apply scanner effects or auto-crop the document when full page borders
        are visible.
      </p>

      <label>Scan Mode</label>
      <select
        value={scanMode}
        onChange={(event) => onScanModeChange(event.target.value as ScanMode)}
      >
        <option value="clean">Clean Paper Scan</option>
        <option value="color">Enhanced Color Scan</option>
        <option value="gray">Grayscale Soft Scan</option>
        <option value="bw">Black & White Text Scan</option>
      </select>

      <button onClick={onScanDocument}>Scan Document</button>

      <button onClick={onAutoScanDocument}>Auto Crop + Scan Document</button>
    </section>
  );
}

export default ScannerTool;