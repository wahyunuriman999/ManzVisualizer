from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from models.schemas import PivotRequest, PivotResponse, StatsRequest, StatsResponse, ForecastRequest, ForecastResponse, AnomalyRequest, AnomalyResponse
from services.data_processor import load_session
from services.stat_engine import compute_pivot, get_stats, get_correlation_matrix, forecast_series, detect_anomalies
from models.i18n import get_text

router = APIRouter(prefix='/api/analysis', tags=['analysis'])

@router.post('/pivot', response_model=PivotResponse)
async def pivot(req: PivotRequest, accept_language: Optional[str] = Header(None)):
    try:
        df = load_session(req.session_id)
        # Handle simple filters if present
        if req.filters:
            for k, v in req.filters.items():
                if k in df.columns:
                     df = df[df[k] == v]
                     
        result = compute_pivot(df, req.rows, req.columns, req.values, req.aggfunc)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post('/stats', response_model=StatsResponse)
async def stats(req: StatsRequest, accept_language: Optional[str] = Header(None)):
    try:
        df = load_session(req.session_id)
        return get_stats(df, req.column)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post('/correlations/{session_id}')
async def correlations(session_id: str, accept_language: Optional[str] = Header(None)):
    try:
        df = load_session(session_id)
        return get_correlation_matrix(df)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post('/forecast', response_model=ForecastResponse)
async def forecast(req: ForecastRequest, accept_language: Optional[str] = Header(None)):
    try:
        df = load_session(req.session_id)
        return forecast_series(df, req.date_col, req.value_col, req.periods)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post('/anomaly', response_model=AnomalyResponse)
async def anomaly(req: AnomalyRequest, accept_language: Optional[str] = Header(None)):
    try:
        df = load_session(req.session_id)
        return detect_anomalies(df, req.column, req.method)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
