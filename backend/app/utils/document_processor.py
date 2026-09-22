import os
import re
import uuid
from typing import List, Tuple
from PyPDF2 import PdfReader
from docx import Document as DocxDocument
from app.config import settings


def validate_file(filename: str, file_size: int) -> Tuple[bool, str]:
    """Validate file type and size."""
    ext = os.path.splitext(filename)[1].lower()

    if ext not in settings.ALLOWED_EXTENSIONS:
        return False, f"File type '{ext}' not allowed. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"

    if file_size > settings.max_file_size_bytes:
        return False, f"File size exceeds {settings.MAX_FILE_SIZE_MB}MB limit"

    return True, "Valid"


def generate_unique_filename(original_filename: str) -> str:
    """Generate a unique filename to prevent collisions."""
    ext = os.path.splitext(original_filename)[1].lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    return unique_name


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text content from a PDF file."""
    try:
        reader = PdfReader(file_path)
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        return "\n\n".join(text_parts)
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")


def extract_text_from_docx(file_path: str) -> str:
    """Extract text content from a DOCX file."""
    try:
        doc = DocxDocument(file_path)
        text_parts = []
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_parts.append(paragraph.text)
        return "\n\n".join(text_parts)
    except Exception as e:
        raise ValueError(f"Failed to extract text from DOCX: {str(e)}")


def extract_text_from_txt(file_path: str) -> str:
    """Extract text content from a TXT file."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception as e:
        raise ValueError(f"Failed to read TXT file: {str(e)}")


def extract_text(file_path: str, file_type: str) -> str:
    """Extract text from a file based on its type."""
    extractors = {
        ".pdf": extract_text_from_pdf,
        ".docx": extract_text_from_docx,
        ".txt": extract_text_from_txt,
    }

    extractor = extractors.get(file_type.lower())
    if not extractor:
        raise ValueError(f"Unsupported file type: {file_type}")

    return extractor(file_path)


def clean_text(text: str) -> str:
    """Clean extracted text by removing extra whitespace and special characters."""
    if not text:
        return ""

    # Remove null bytes
    text = text.replace("\x00", "")

    # Replace multiple newlines with double newline
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Replace multiple spaces with single space
    text = re.sub(r" {2,}", " ", text)

    # Remove leading/trailing whitespace from each line
    lines = [line.strip() for line in text.split("\n")]
    text = "\n".join(lines)

    # Remove leading/trailing whitespace
    text = text.strip()

    return text


def chunk_text(text: str, chunk_size: int = 2000, overlap: int = 200) -> List[str]:
    """Split text into manageable chunks with overlap for context continuity."""
    if not text:
        return []

    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size

        # Try to break at a sentence boundary
        if end < len(text):
            # Look for sentence-ending punctuation near the end
            last_period = text.rfind(".", start + chunk_size - 200, end)
            last_newline = text.rfind("\n", start + chunk_size - 200, end)
            break_point = max(last_period, last_newline)

            if break_point > start:
                end = break_point + 1

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        # Move start with overlap
        start = end - overlap if end < len(text) else end

    return chunks


def get_text_for_ai(text: str, max_length: int = 8000) -> str:
    """Get text suitable for sending to AI, truncated if needed."""
    if not text:
        return ""
    if len(text) <= max_length:
        return text
    # Take the first max_length characters, breaking at a sentence
    truncated = text[:max_length]
    last_period = truncated.rfind(".")
    if last_period > max_length * 0.8:
        return truncated[:last_period + 1]
    return truncated
