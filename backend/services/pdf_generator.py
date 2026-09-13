import io
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_pdf(df: pd.DataFrame, title: str, report_text: str, charts_images: list[bytes]) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []
    
    # Title
    title_style = styles['Title']
    elements.append(Paragraph(f"ManzStudio: {title}", title_style))
    elements.append(Spacer(1, 12))
    
    # Report text
    normal_style = styles['Normal']
    for p in report_text.split('\n\n'):
        if p.strip():
            elements.append(Paragraph(p, normal_style))
            elements.append(Spacer(1, 12))
            
    # Charts (skipped parsing bytes for now, normally would use io.BytesIO wrapper for ReportLab Image)
    for img_bytes in charts_images:
        try:
            img = Image(io.BytesIO(img_bytes), width=400, height=300)
            elements.append(img)
            elements.append(Spacer(1, 12))
        except:
            pass
            
    # Data Table (first 50 rows)
    data = [df.columns.tolist()] + df.head(50).astype(str).values.tolist()
    t = Table(data)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.grey),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 12),
        ('BACKGROUND', (0,1), (-1,-1), colors.beige),
        ('GRID', (0,0), (-1,-1), 1, colors.black)
    ]))
    elements.append(t)
    
    doc.build(elements)
    return buffer.getvalue()
