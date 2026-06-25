# Scanify AI

Scanify AI is a smart document scanner and image utility web application. It allows users to upload images, apply scanner effects, crop, resize, compress, rotate, apply filters, and convert images into PDF documents.

## Features

* Image upload and preview
* Document scanner effects
* Auto crop + scan using OpenCV
* Convert image to PDF
* Convert scanned image to PDF
* Manual crop
* Resize image
* Compress image
* Rotate image
* Image filters:

  * Grayscale
  * Sepia
  * Negative
  * Sketch
  * Sharpen
  * Blur
  * Warm
  * Cool
  * Cartoon
  * Edge Detection
* Sidebar-based clean product UI
* FastAPI backend for image processing
* React + TypeScript frontend

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Axios
* React Easy Crop

### Backend

* FastAPI
* Python
* Pillow
* OpenCV
* NumPy

## Project Structure

```text
Scanify-AI/
├── Backend/
│   ├── main.py
│   └── image_utils.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── tools/
│   │   ├── constants/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── App.css
│   │
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## How to Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/your-username/scanify-ai.git
cd scanify-ai
```

### 2. Run Backend

```bash
cd Backend
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn python-multipart pillow opencv-python numpy
python -m uvicorn main:app --reload
```

Backend will run at:

```text
http://127.0.0.1:8000
```

### 3. Run Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run at:

```text
http://localhost:5173
```

## Current Status

The project currently supports image upload, document scanning, PDF conversion, filters, crop, resize, compress, and rotate features.

## Upcoming Features

* User login/signup
* Multi-page PDF generation
* File history
* Cloud storage using Supabase
* OCR text extraction
* AI-powered document search
* AI document summarization

## Author

Pragya Tiwari
