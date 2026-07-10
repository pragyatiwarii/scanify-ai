import os

import cv2
import pytesseract


# =========================
# TESSERACT CONFIGURATION
# =========================

WINDOWS_TESSERACT_PATH = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)


def configure_tesseract() -> None:
    """
    Configure Tesseract for local development.

    Priority:
    1. TESSERACT_CMD environment variable
    2. Default Windows installation path
    3. System PATH
    """

    environment_path = os.getenv("TESSERACT_CMD")

    if environment_path:
        pytesseract.pytesseract.tesseract_cmd = (
            environment_path
        )

        return

    if (
        os.name == "nt"
        and os.path.exists(WINDOWS_TESSERACT_PATH)
    ):
        pytesseract.pytesseract.tesseract_cmd = (
            WINDOWS_TESSERACT_PATH
        )


configure_tesseract()


# =========================
# OCR IMAGE PREPROCESSING
# =========================

def prepare_image_for_ocr(
    image_path: str,
):
    """
    Prepare a document image before OCR.

    Steps:
    - Load image
    - Convert to grayscale
    - Upscale small images
    - Remove light image noise
    - Apply automatic thresholding
    """

    if not os.path.exists(image_path):
        raise FileNotFoundError(
            "OCR image file does not exist."
        )

    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(
            "Could not read the uploaded image."
        )

    grayscale = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY,
    )

    height, width = grayscale.shape[:2]

    # Upscaling helps Tesseract with small text.
    if max(width, height) < 1600:
        grayscale = cv2.resize(
            grayscale,
            None,
            fx=2,
            fy=2,
            interpolation=cv2.INTER_CUBIC,
        )

    denoised = cv2.fastNlMeansDenoising(
        grayscale,
        None,
        h=10,
        templateWindowSize=7,
        searchWindowSize=21,
    )

    _, processed_image = cv2.threshold(
        denoised,
        0,
        255,
        cv2.THRESH_BINARY
        + cv2.THRESH_OTSU,
    )

    return processed_image


# =========================
# EXTRACT TEXT
# =========================

def extract_text_from_image(
    image_path: str,
    language: str = "eng",
) -> str:
    """
    Extract text from a document image.
    """

    processed_image = prepare_image_for_ocr(
        image_path
    )

    try:
        extracted_text = (
            pytesseract.image_to_string(
                processed_image,
                lang=language,
                config="--oem 3 --psm 3",
            )
        )

    except pytesseract.TesseractNotFoundError as error:
        raise RuntimeError(
            "Tesseract OCR could not be found."
        ) from error

    except pytesseract.TesseractError as error:
        raise RuntimeError(
            f"OCR processing failed: {error}"
        ) from error

    return extracted_text.strip()