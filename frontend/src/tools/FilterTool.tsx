import type { FilterType } from "../types";

type FilterToolProps = {
  filterType: FilterType;
  onFilterTypeChange: (filterType: FilterType) => void;
  onApplyFilter: () => void;
};

function FilterTool({
  filterType,
  onFilterTypeChange,
  onApplyFilter,
}: FilterToolProps) {
  return (
    <section className="tool-card">
      <h2>Image Filters</h2>

      <p className="tool-description">
        Apply useful visual filters for photos, notes, and creative effects.
      </p>

      <label>Choose Filter</label>
      <select
        value={filterType}
        onChange={(event) =>
          onFilterTypeChange(event.target.value as FilterType)
        }
      >
        <option value="grayscale">Grayscale</option>
        <option value="sepia">Sepia</option>
        <option value="negative">Negative</option>
        <option value="sketch">Sketch</option>
        <option value="sharpen">Sharpen</option>
        <option value="blur">Blur</option>
        <option value="warm">Warm</option>
        <option value="cool">Cool</option>
        <option value="cartoon">Cartoon</option>
        <option value="edge">Edge Detection</option>
      </select>

      <button onClick={onApplyFilter}>Apply Filter</button>
    </section>
  );
}

export default FilterTool;