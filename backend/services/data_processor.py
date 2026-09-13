import os
import uuid
import pandas as pd
import duckdb
import io
import requests

TEMP_DIR = os.path.join(os.path.dirname(__file__), '..', 'temp_data')

def _save_to_parquet(df: pd.DataFrame, session_id: str):
    os.makedirs(TEMP_DIR, exist_ok=True)
    path = os.path.join(TEMP_DIR, f"{session_id}.parquet")
    df.to_parquet(path)

def process_file_data(file_content: bytes, filename: str) -> tuple[str, pd.DataFrame]:
    session_id = str(uuid.uuid4())
    try:
        if filename.endswith('.csv'):
            # DuckDB can read csv directly but we have bytes, so we use pandas
            df = pd.read_csv(io.BytesIO(file_content))
        elif filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(file_content))
        elif filename.endswith('.json'):
            df = pd.read_json(io.BytesIO(file_content))
        else:
            raise ValueError("Unsupported file format")
        
        _save_to_parquet(df, session_id)
        return session_id, df
    except Exception as e:
        raise ValueError(f"Error processing file: {str(e)}")

def process_url_data(url: str) -> tuple[str, pd.DataFrame]:
    session_id = str(uuid.uuid4())
    try:
        if "docs.google.com/spreadsheets" in url:
            if "/edit" in url:
                url = url.replace("/edit", "/export?format=csv")
            elif "/view" in url:
                url = url.replace("/view", "/export?format=csv")
            df = pd.read_csv(url)
        else:
            response = requests.get(url)
            response.raise_for_status()
            df = pd.read_json(io.StringIO(response.text))
        
        _save_to_parquet(df, session_id)
        return session_id, df
    except Exception as e:
        raise ValueError(f"Error processing URL: {str(e)}")

def load_session(session_id: str) -> pd.DataFrame:
    path = os.path.join(TEMP_DIR, f"{session_id}.parquet")
    if not os.path.exists(path):
        raise ValueError("Session not found")
    return pd.read_parquet(path)

def get_profile(df: pd.DataFrame, filename: str, session_id: str) -> dict:
    columns = []
    for col in df.columns:
        dtype = str(df[col].dtype)
        null_count = int(df[col].isnull().sum())
        null_pct = float(null_count / len(df) * 100) if len(df) > 0 else 0.0
        unique_count = int(df[col].nunique())
        
        col_data = {
            'name': col,
            'dtype': dtype,
            'null_count': null_count,
            'null_pct': null_pct,
            'unique_count': unique_count,
            'sample_values': df[col].dropna().head(5).tolist()
        }
        
        if pd.api.types.is_numeric_dtype(df[col]):
            col_data['min_val'] = float(df[col].min()) if not pd.isna(df[col].min()) else None
            col_data['max_val'] = float(df[col].max()) if not pd.isna(df[col].max()) else None
            col_data['mean_val'] = float(df[col].mean()) if not pd.isna(df[col].mean()) else None
            
        columns.append(col_data)
        
    return {
        'session_id': session_id,
        'filename': filename,
        'row_count': len(df),
        'col_count': len(df.columns),
        'columns': columns,
        'preview': df.head(100).fillna("").to_dict(orient='records')
    }

def apply_transforms(df: pd.DataFrame, operations: list[dict]) -> pd.DataFrame:
    for op_dict in operations:
        op = op_dict.get('op')
        if op == 'rename':
            df = df.rename(columns={op_dict['old_col']: op_dict['new_col']})
        elif op == 'drop':
            df = df.drop(columns=[op_dict['col']])
        elif op == 'cast':
            dtype_map = {'int': 'int64', 'float': 'float64', 'str': 'str', 'datetime': 'datetime64[ns]'}
            target_dtype = dtype_map.get(op_dict['dtype'], op_dict['dtype'])
            if target_dtype == 'datetime64[ns]':
                df[op_dict['col']] = pd.to_datetime(df[op_dict['col']], errors='coerce')
            else:
                df[op_dict['col']] = df[op_dict['col']].astype(target_dtype, errors='ignore')
        elif op == 'filter':
            col = op_dict['col']
            val = op_dict['value']
            operator = op_dict['op_filter'] # renamed since 'op' is 'filter'
            if operator == 'gt':
                df = df[df[col] > val]
            elif operator == 'lt':
                df = df[df[col] < val]
            elif operator == 'eq':
                df = df[df[col] == val]
            elif operator == 'contains':
                df = df[df[col].astype(str).str.contains(str(val), na=False)]
        elif op == 'formula':
            new_col = op_dict['new_col']
            expr = op_dict['expression']
            # Very basic safe eval using pandas eval
            try:
                df[new_col] = df.eval(expr)
            except Exception as e:
                raise ValueError(f"Failed to evaluate formula: {str(e)}")
    return df
