import duckdb
import pandas as pd
import uuid
import os
import pymysql
import psycopg2

TEMP_DIR = os.path.join(os.path.dirname(__file__), '..', 'temp_data')

def _save_to_parquet(df: pd.DataFrame, session_id: str):
    os.makedirs(TEMP_DIR, exist_ok=True)
    path = os.path.join(TEMP_DIR, f"{session_id}.parquet")
    df.to_parquet(path)

def connect_sqlite(db_path: str) -> str:
    session_id = str(uuid.uuid4())
    tables = list_sqlite_tables(db_path)
    if not tables:
        raise ValueError("No tables found in SQLite database")
    return load_sqlite_table(db_path, tables[0])[0]

def query_session(session_id: str, sql: str) -> pd.DataFrame:
    path = os.path.join(TEMP_DIR, f"{session_id}.parquet")
    if not os.path.exists(path):
        raise ValueError("Session not found")
    
    conn = duckdb.connect(database=':memory:')
    conn.execute(f"CREATE TABLE data AS SELECT * FROM read_parquet('{path}')")
    result = conn.execute(sql).df()
    conn.close()
    return result

def list_sqlite_tables(db_path: str) -> list[str]:
    conn = duckdb.connect(database=':memory:')
    conn.execute(f"INSTALL sqlite;")
    conn.execute(f"LOAD sqlite;")
    conn.execute(f"ATTACH '{db_path}' AS db (TYPE SQLITE);")
    tables_df = conn.execute("SELECT name FROM sqlite_master WHERE type='table';").df()
    conn.close()
    return tables_df['name'].tolist()

def load_sqlite_table(db_path: str, table_name: str) -> tuple[str, pd.DataFrame]:
    session_id = str(uuid.uuid4())
    conn = duckdb.connect(database=':memory:')
    conn.execute(f"INSTALL sqlite;")
    conn.execute(f"LOAD sqlite;")
    conn.execute(f"ATTACH '{db_path}' AS db (TYPE SQLITE);")
    df = conn.execute(f"SELECT * FROM db.{table_name}").df()
    conn.close()
    _save_to_parquet(df, session_id)
    return session_id, df

def connect_postgres(host, port, db, user, password) -> str:
    conn = psycopg2.connect(host=host, port=port, dbname=db, user=user, password=password)
    query = "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
    df_tables = pd.read_sql(query, conn)
    if df_tables.empty:
        conn.close()
        raise ValueError("No tables found in PostgreSQL database")
    
    table_name = df_tables['table_name'].iloc[0]
    df = pd.read_sql(f"SELECT * FROM {table_name}", conn)
    conn.close()
    
    session_id = str(uuid.uuid4())
    _save_to_parquet(df, session_id)
    return session_id

def connect_mysql(host, port, db, user, password) -> str:
    conn = pymysql.connect(host=host, port=int(port), database=db, user=user, password=password)
    df_tables = pd.read_sql("SHOW TABLES", conn)
    if df_tables.empty:
        conn.close()
        raise ValueError("No tables found in MySQL database")
    
    table_name = df_tables.iloc[0, 0]
    df = pd.read_sql(f"SELECT * FROM {table_name}", conn)
    conn.close()
    
    session_id = str(uuid.uuid4())
    _save_to_parquet(df, session_id)
    return session_id
