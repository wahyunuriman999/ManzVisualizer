import io
from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import Response, StreamingResponse
from typing import Optional
from models.schemas import ExportRequest
from services.data_processor import load_session
from services.excel_generator import generate_excel
from services.pdf_generator import generate_pdf
from services.pptx_generator import generate_pptx

router = APIRouter(prefix='/api/export', tags=['export'])

@router.post('/xlsx')
async def export_xlsx(req: ExportRequest, accept_language: Optional[str] = Header(None)):
    try:
        df = load_session(req.session_id)
        excel_bytes = generate_excel(df, req.title, req.charts_data)
        
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={req.title}.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post('/pdf')
async def export_pdf(req: ExportRequest, report_text: str = "", accept_language: Optional[str] = Header(None)):
    try:
        df = load_session(req.session_id)
        
        import base64
        charts_images = []
        for chart in req.charts_data:
            img_b64 = chart.get('image_base64', '')
            if img_b64:
                if "," in img_b64:
                    img_b64 = img_b64.split(",")[1]
                charts_images.append(base64.b64decode(img_b64))
        
        pdf_bytes = generate_pdf(df, req.title, report_text, charts_images)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={req.title}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post('/pptx')
async def export_pptx(req: ExportRequest, report_text: str = "", insights: list = [], accept_language: Optional[str] = Header(None)):
    try:
        import base64
        charts_images = []
        for chart in req.charts_data:
            img_b64 = chart.get('image_base64', '')
            if img_b64:
                if "," in img_b64:
                    img_b64 = img_b64.split(",")[1]
                charts_images.append(base64.b64decode(img_b64))
                
        pptx_bytes = generate_pptx(req.title, report_text, charts_images, insights)
        
        return Response(
            content=pptx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers={"Content-Disposition": f"attachment; filename={req.title}.pptx"}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get('/csv/{session_id}')
async def export_csv(session_id: str, accept_language: Optional[str] = Header(None)):
    try:
        df = load_session(session_id)
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
        response.headers["Content-Disposition"] = f"attachment; filename=export.csv"
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
