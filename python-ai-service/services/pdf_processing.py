import PyPDF2

def extract_text_from_pdf(pdf_bytes):
    """Extracts text from a PDF document."""
    pdf_reader = PyPDF2.PdfReader(pdf_bytes)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text() + "\n"
    return text.strip()
