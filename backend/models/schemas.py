from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class DataProfileColumn(BaseModel):
    name: str
    dtype: str
    null_count: int
    null_pct: float
    unique_count: int
    min_val: Optional[Any] = None
    max_val: Optional[Any] = None
    mean_val: Optional[float] = None
    sample_values: List[Any]

class DataProfileResponse(BaseModel):
    session_id: str
    filename: str
    row_count: int
    col_count: int
    columns: List[DataProfileColumn]
    preview: List[Dict[str, Any]]

class PivotRequest(BaseModel):
    session_id: str
    rows: List[str]
    columns: List[str]
    values: List[str]
    aggfunc: str
    filters: Optional[Dict[str, Any]] = None

class PivotResponse(BaseModel):
    data: List[Dict[str, Any]]
    row_labels: List[Any]
    col_labels: List[Any]
    totals: Dict[str, Any]

class StatsRequest(BaseModel):
    session_id: str
    column: str

class StatsResponse(BaseModel):
    column: str
    count: int
    mean: Optional[float] = None
    std: Optional[float] = None
    min: Optional[float] = None
    q25: Optional[float] = None
    median: Optional[float] = None
    q75: Optional[float] = None
    max: Optional[float] = None
    skewness: Optional[float] = None
    kurtosis: Optional[float] = None

class ForecastRequest(BaseModel):
    session_id: str
    date_col: str
    value_col: str
    periods: int = 6

class ForecastResponse(BaseModel):
    historical: List[Dict[str, Any]]
    forecast: List[Dict[str, Any]]
    method: str

class AnomalyRequest(BaseModel):
    session_id: str
    column: str
    method: str = 'iqr'

class AnomalyResponse(BaseModel):
    anomalies: List[Dict[str, Any]]
    threshold_low: float
    threshold_high: float
    total_anomalies: int

class AIInsightRequest(BaseModel):
    session_id: str
    provider: str = 'gemini'
    api_key: str
    notes: str = ''

class AIReportRequest(BaseModel):
    session_id: str
    provider: str = 'gemini'
    api_key: str
    title: str
    notes: str = ''

class NLQRequest(BaseModel):
    session_id: str
    question: str
    provider: str = 'gemini'
    api_key: str

class NLQResponse(BaseModel):
    question: str
    sql_query: str
    result: List[Dict[str, Any]]
    chart_suggestion: str
    explanation: str

class ExportRequest(BaseModel):
    session_id: str
    format: str
    title: str = 'ManzStudio Report'
    charts_data: List[Dict[str, Any]] = []

class TransformRequest(BaseModel):
    session_id: str
    operations: List[Dict[str, Any]]

class ChartSuggestRequest(BaseModel):
    session_id: str

class ChartSuggestResponse(BaseModel):
    suggestions: List[Dict[str, Any]]
