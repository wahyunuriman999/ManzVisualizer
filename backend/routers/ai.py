from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from models.schemas import AIInsightRequest, AIReportRequest, NLQRequest, NLQResponse, ChartSuggestResponse, ChartSuggestRequest
from services.data_processor import load_session, get_profile
from services.ai_analyzer import generate_insights, generate_report, natural_language_query, suggest_charts
from services.stat_engine import get_correlation_matrix
from routers.data import SESSIONS

router = APIRouter(prefix='/api/ai', tags=['ai'])

@router.post('/insights')
async def insights(req: AIInsightRequest, accept_language: Optional[str] = Header(None)):
    try:
        df = load_session(req.session_id)
        session_meta = SESSIONS.get(req.session_id, {})
        filename = session_meta.get('filename', 'Unknown')
        profile = get_profile(df, filename, req.session_id)
        
        # Calculate some basic stats summary to send to AI
        stats_summary = {"correlations": get_correlation_matrix(df)}
        
        results = generate_insights(profile, stats_summary, req.provider, req.api_key, req.notes)
        return {"insights": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post('/report')
async def report(req: AIReportRequest, accept_language: Optional[str] = Header(None)):
    try:
        df = load_session(req.session_id)
        session_meta = SESSIONS.get(req.session_id, {})
        filename = session_meta.get('filename', 'Unknown')
        profile = get_profile(df, filename, req.session_id)
        
        res = generate_report(profile, req.provider, req.api_key, req.title, req.notes)
        return {"report": res, "title": req.title}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post('/nlq', response_model=NLQResponse)
async def nlq(req: NLQRequest, accept_language: Optional[str] = Header(None)):
    try:
        df = load_session(req.session_id)
        session_meta = SESSIONS.get(req.session_id, {})
        filename = session_meta.get('filename', 'Unknown')
        profile = get_profile(df, filename, req.session_id)
        
        response = natural_language_query(req.question, profile, req.provider, req.api_key)
        
        sql_query = response.get('sql_query', '')
        if sql_query:
            try:
                # Basic pandas query
                res_df = df.query(sql_query)
                response['result'] = res_df.head(100).fillna("").to_dict(orient='records')
            except Exception as eval_err:
                response['result'] = []
                response['explanation'] += f"\nError executing query: {str(eval_err)}"
                
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post('/suggest-charts/{session_id}', response_model=ChartSuggestResponse)
async def suggest_charts_route(session_id: str, accept_language: Optional[str] = Header(None)):
    try:
        df = load_session(session_id)
        session_meta = SESSIONS.get(session_id, {})
        filename = session_meta.get('filename', 'Unknown')
        profile = get_profile(df, filename, session_id)
        
        suggestions = suggest_charts(profile)
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
