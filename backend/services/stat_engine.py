import pandas as pd
import numpy as np
from scipy import stats
from sklearn.linear_model import LinearRegression

def get_stats(df: pd.DataFrame, column: str) -> dict:
    if column not in df.columns:
        raise ValueError(f"Column {column} not found")
        
    series = df[column].dropna()
    is_numeric = pd.api.types.is_numeric_dtype(series)
    
    if not is_numeric:
        return {
            "column": column,
            "count": int(len(series)),
        }
        
    return {
        "column": column,
        "count": int(len(series)),
        "mean": float(series.mean()),
        "std": float(series.std()) if len(series) > 1 else 0.0,
        "min": float(series.min()),
        "q25": float(series.quantile(0.25)),
        "median": float(series.median()),
        "q75": float(series.quantile(0.75)),
        "max": float(series.max()),
        "skewness": float(stats.skew(series)) if len(series) > 2 else 0.0,
        "kurtosis": float(stats.kurtosis(series)) if len(series) > 3 else 0.0,
    }

def get_correlation_matrix(df: pd.DataFrame) -> dict:
    numeric_df = df.select_dtypes(include=[np.number])
    if numeric_df.empty:
        return {"cols": [], "matrix": []}
        
    corr = numeric_df.corr().fillna(0).round(4)
    return {
        "cols": corr.columns.tolist(),
        "matrix": corr.values.tolist()
    }

def detect_anomalies(df: pd.DataFrame, column: str, method: str = 'iqr') -> dict:
    if column not in df.columns or not pd.api.types.is_numeric_dtype(df[column]):
        raise ValueError(f"Column {column} is not numeric or not found")
        
    series = df[column].dropna()
    if method == 'iqr':
        Q1 = series.quantile(0.25)
        Q3 = series.quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = float(Q1 - 1.5 * IQR)
        upper_bound = float(Q3 + 1.5 * IQR)
    elif method == 'zscore':
        mean = series.mean()
        std = series.std()
        lower_bound = float(mean - 3 * std)
        upper_bound = float(mean + 3 * std)
    else:
        raise ValueError("Invalid method")
        
    anomalies = series[(series < lower_bound) | (series > upper_bound)]
    
    result = []
    for idx, val in anomalies.items():
        row_dict = df.loc[idx].to_dict()
        # Convert timestamp to string if present
        for k, v in row_dict.items():
            if isinstance(v, pd.Timestamp):
                row_dict[k] = v.isoformat()
        result.append(row_dict)
        
    return {
        "anomalies": result,
        "threshold_low": lower_bound,
        "threshold_high": upper_bound,
        "total_anomalies": len(result)
    }

def forecast_series(df: pd.DataFrame, date_col: str, value_col: str, periods: int = 6) -> dict:
    if date_col not in df.columns or value_col not in df.columns:
        raise ValueError("Columns not found")
        
    df = df.copy()
    df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
    df = df.dropna(subset=[date_col, value_col])
    df = df.sort_values(date_col)
    
    if len(df) < 2:
        raise ValueError("Not enough data for forecasting")
        
    # Basic linear regression forecast
    x = np.arange(len(df)).reshape(-1, 1)
    y = df[value_col].values
    
    model = LinearRegression()
    model.fit(x, y)
    
    x_pred = np.arange(len(df), len(df) + periods).reshape(-1, 1)
    y_pred = model.predict(x_pred)
    
    # Infer frequency roughly
    diffs = df[date_col].diff().dropna()
    freq = diffs.median() if not diffs.empty else pd.Timedelta(days=1)
    
    last_date = df[date_col].iloc[-1]
    forecast_dates = [last_date + (freq * i) for i in range(1, periods + 1)]
    
    historical = [{"date": row[date_col].isoformat(), "value": float(row[value_col])} for _, row in df.iterrows()]
    forecast = [{"date": d.isoformat(), "value": float(v), "method": "linear_regression"} for d, v in zip(forecast_dates, y_pred)]
    
    return {
        "historical": historical,
        "forecast": forecast,
        "method": "linear_regression"
    }

def compute_pivot(df: pd.DataFrame, rows: list, columns: list, values: list, aggfunc: str) -> dict:
    func_map = {'sum': 'sum', 'mean': 'mean', 'count': 'count', 'min': 'min', 'max': 'max', 'median': 'median'}
    agg = func_map.get(aggfunc, 'sum')
    
    try:
        pivot = pd.pivot_table(df, values=values, index=rows, columns=columns, aggfunc=agg, fill_value=0)
        
        row_labels = pivot.index.tolist() if isinstance(pivot.index, pd.MultiIndex) else [[idx] for idx in pivot.index]
        col_labels = pivot.columns.tolist() if isinstance(pivot.columns, pd.MultiIndex) else [[col] for col in pivot.columns]
        
        # Flatten for basic grid representation
        data = []
        for i, idx in enumerate(pivot.index):
            row_dict = {}
            idx_tuple = idx if isinstance(idx, tuple) else (idx,)
            for j, c in enumerate(rows):
                if j < len(idx_tuple):
                     row_dict[c] = idx_tuple[j]
            for col in pivot.columns:
                 col_name = '_'.join(map(str, col)) if isinstance(col, tuple) else str(col)
                 val = pivot.loc[idx, col]
                 try:
                     row_dict[col_name] = float(val) if pd.notna(val) else None
                 except (ValueError, TypeError):
                     row_dict[col_name] = str(val)
            data.append(row_dict)
            
        return {
            "data": data,
            "row_labels": row_labels,
            "col_labels": col_labels,
            "totals": {}
        }
    except Exception as e:
        raise ValueError(f"Pivot error: {str(e)}")
