import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Header
from typing import Optional
from models.schemas import DataProfileResponse, TransformRequest
from services.data_processor import process_file_data, process_url_data, load_session, get_profile, apply_transforms
from models.i18n import get_text

router = APIRouter(prefix='/api/data', tags=['data'])

SESSIONS = {}

@router.post('/upload', response_model=DataProfileResponse)
async def upload_file(file: UploadFile = File(...), accept_language: Optional[str] = Header(None)):
    try:
        content = await file.read()
        session_id, df = process_file_data(content, file.filename)
        profile = get_profile(df, file.filename, session_id)
        SESSIONS[session_id] = {
            'df_path': f"temp_data/{session_id}.parquet",
            'filename': file.filename,
            'row_count': len(df),
            'col_count': len(df.columns)
        }
        return profile
    except Exception as e:
        raise HTTPException(status_code=400, detail=get_text(accept_language, 'error_file') + f": {str(e)}")

@router.post('/url', response_model=DataProfileResponse)
async def process_url(url_request: dict, accept_language: Optional[str] = Header(None)):
    try:
        url = url_request.get('url')
        if not url:
             raise ValueError("URL is required")
        session_id, df = process_url_data(url)
        profile = get_profile(df, "URL Data", session_id)
        SESSIONS[session_id] = {
            'df_path': f"temp_data/{session_id}.parquet",
            'filename': "URL Data",
            'row_count': len(df),
            'col_count': len(df.columns)
        }
        return profile
    except Exception as e:
        raise HTTPException(status_code=400, detail=get_text(accept_language, 'error_url') + f": {str(e)}")

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'samples')

@router.get('/samples')
async def list_samples():
    """List all available built-in sample datasets."""
    if not os.path.exists(SAMPLES_DIR):
        return []
    files = [f for f in os.listdir(SAMPLES_DIR) if f.endswith(('.csv', '.xlsx', '.json'))]
    return [{"name": f, "label": f.replace('_', ' ').replace('.csv','').replace('.xlsx','').title()} for f in files]

@router.get('/sample/{name}', response_model=DataProfileResponse)
async def load_sample(name: str, accept_language: Optional[str] = Header(None)):
    """Load a built-in sample dataset by filename."""
    sample_path = os.path.join(SAMPLES_DIR, name)
    if not os.path.exists(sample_path) or not os.path.isfile(sample_path):
        raise HTTPException(status_code=404, detail=f"Sample '{name}' not found.")
    try:
        with open(sample_path, 'rb') as f:
            content = f.read()
        session_id, df = process_file_data(content, name)
        profile = get_profile(df, name, session_id)
        SESSIONS[session_id] = {
            'df_path': f"temp_data/{session_id}.parquet",
            'filename': name,
            'row_count': len(df),
            'col_count': len(df.columns)
        }
        return profile
    except Exception as e:
        raise HTTPException(status_code=400, detail=get_text(accept_language, 'error_file') + f": {str(e)}")

@router.get('/preview/{session_id}')
async def preview_data(session_id: str, accept_language: Optional[str] = Header(None)):
    try:
        df = load_session(session_id)
        return df.head(100).fillna("").to_dict(orient='records')
    except Exception as e:
        raise HTTPException(status_code=404, detail=get_text(accept_language, 'error_not_found'))

@router.get('/profile/{session_id}', response_model=DataProfileResponse)
async def get_session_profile(session_id: str, accept_language: Optional[str] = Header(None)):
    try:
        df = load_session(session_id)
        session_meta = SESSIONS.get(session_id, {})
        filename = session_meta.get('filename', 'Unknown')
        return get_profile(df, filename, session_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=get_text(accept_language, 'error_not_found'))

@router.post('/transform/{session_id}', response_model=DataProfileResponse)
async def transform_data(session_id: str, req: TransformRequest, accept_language: Optional[str] = Header(None)):
    try:
        df = load_session(session_id)
        df = apply_transforms(df, req.operations)
        # overwrite temp parquet
        import os
        from services.data_processor import TEMP_DIR, _save_to_parquet
        _save_to_parquet(df, session_id)
        
        session_meta = SESSIONS.get(session_id, {})
        filename = session_meta.get('filename', 'Unknown')
        profile = get_profile(df, filename, session_id)
        
        # update session
        SESSIONS[session_id].update({
            'row_count': len(df),
            'col_count': len(df.columns)
        })
        
        return profile
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get('/columns/{session_id}')
async def get_columns(session_id: str, accept_language: Optional[str] = Header(None)):
    try:
        df = load_session(session_id)
        return [{"name": col, "dtype": str(df[col].dtype)} for col in df.columns]
    except Exception as e:
         raise HTTPException(status_code=404, detail=get_text(accept_language, 'error_not_found'))

@router.delete('/session/{session_id}')
async def delete_session(session_id: str, accept_language: Optional[str] = Header(None)):
    try:
        from services.data_processor import TEMP_DIR
        path = os.path.join(TEMP_DIR, f"{session_id}.parquet")
        if os.path.exists(path):
            os.remove(path)
        if session_id in SESSIONS:
            del SESSIONS[session_id]
        return {"status": get_text(accept_language, 'success')}
    except Exception as e:
         raise HTTPException(status_code=400, detail=str(e))
