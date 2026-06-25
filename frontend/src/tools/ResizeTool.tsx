type ResizeToolProps = {
  width: number;
  height: number;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  onResize: () => void;
};

function ResizeTool({
  width,
  height,
  onWidthChange,
  onHeightChange,
  onResize,
}: ResizeToolProps) {
  return (
    <section className="tool-card">
      <h2>Resize Image</h2>

      <p className="tool-description">
        Change image dimensions by entering width and height.
      </p>

      <label>Width</label>
      <input
        type="number"
        value={width}
        onChange={(event) => onWidthChange(Number(event.target.value))}
      />

      <label>Height</label>
      <input
        type="number"
        value={height}
        onChange={(event) => onHeightChange(Number(event.target.value))}
      />

      <button onClick={onResize}>Resize Image</button>
    </section>
  );
}

export default ResizeTool;