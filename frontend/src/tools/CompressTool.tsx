type CompressToolProps = {
  quality: number;
  onQualityChange: (quality: number) => void;
  onCompress: () => void;
};

function CompressTool({
  quality,
  onQualityChange,
  onCompress,
}: CompressToolProps) {
  return (
    <section className="tool-card">
      <h2>Compress Image</h2>

      <p className="tool-description">
        Reduce image size by adjusting quality.
      </p>

      <label>Quality: {quality}</label>
      <input
        type="range"
        min="10"
        max="100"
        value={quality}
        onChange={(event) => onQualityChange(Number(event.target.value))}
      />

      <button onClick={onCompress}>Compress Image</button>
    </section>
  );
}

export default CompressTool;