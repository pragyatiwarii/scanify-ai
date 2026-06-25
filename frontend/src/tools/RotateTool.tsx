type RotateToolProps = {
  angle: number;
  onAngleChange: (angle: number) => void;
  onRotate: () => void;
};

function RotateTool({ angle, onAngleChange, onRotate }: RotateToolProps) {
  return (
    <section className="tool-card">
      <h2>Rotate Image</h2>

      <p className="tool-description">
        Rotate the image clockwise by 90°, 180°, or 270°.
      </p>

      <label>Rotation Angle</label>
      <select
        value={angle}
        onChange={(event) => onAngleChange(Number(event.target.value))}
      >
        <option value={90}>90° Clockwise</option>
        <option value={180}>180°</option>
        <option value={270}>270° Clockwise</option>
      </select>

      <button onClick={onRotate}>Rotate Image</button>
    </section>
  );
}

export default RotateTool;