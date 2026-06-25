export type Tool =
  | "upload"
  | "scanner"
  | "pdf"
  | "filters"
  | "crop"
  | "resize"
  | "compress"
  | "rotate";

export type ScanMode = "clean" | "color" | "gray" | "bw";

export type FilterType =
  | "grayscale"
  | "sepia"
  | "negative"
  | "sketch"
  | "sharpen"
  | "blur"
  | "warm"
  | "cool"
  | "cartoon"
  | "edge";

export type MenuItem = {
  key: Tool;
  label: string;
};