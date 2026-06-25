type ResultImageProps = {
  title: string;
  imageUrl: string;
  downloadName: string;
};

function ResultImage({ title, imageUrl, downloadName }: ResultImageProps) {
  return (
    <div className="result-block">
      <h4>{title}</h4>
      <img src={imageUrl} alt={title} className="preview-image" />

      <a href={imageUrl} download={downloadName}>
        Download
      </a>
    </div>
  );
}

export default ResultImage;