import io
import pandas as pd
import xlsxwriter

def generate_excel(df: pd.DataFrame, title: str, charts_data: list[dict]) -> bytes:
    output = io.BytesIO()
    workbook = xlsxwriter.Workbook(output, {'in_memory': True})
    
    # Sheet 1: Data
    worksheet_data = workbook.add_worksheet("Data")
    header_format = workbook.add_format({'bold': True, 'bg_color': '#D7E4BC', 'border': 1})
    
    for col_num, value in enumerate(df.columns.values):
        worksheet_data.write(0, col_num, value, header_format)
        
    for row_num, row_data in enumerate(df.values):
        for col_num, value in enumerate(row_data):
            # Handle timestamps/NaTs
            if pd.isna(value):
                value = ""
            elif isinstance(value, pd.Timestamp):
                value = value.strftime('%Y-%m-%d %H:%M:%S')
            worksheet_data.write(row_num + 1, col_num, value)
            
    # Sheet 2: Summary stats
    worksheet_stats = workbook.add_worksheet("Summary")
    stats_df = df.describe(include='all').reset_index()
    for col_num, value in enumerate(stats_df.columns.values):
        worksheet_stats.write(0, col_num, str(value), header_format)
    for row_num, row_data in enumerate(stats_df.values):
        for col_num, value in enumerate(row_data):
            if pd.isna(value):
                value = ""
            worksheet_stats.write(row_num + 1, col_num, str(value))
            
    # Sheet 3: Charts
    # Just creating a placeholder sheet for now as implementing native xlsxwriter charts from arbitrary JSON is complex
    worksheet_charts = workbook.add_worksheet("Charts")
    worksheet_charts.write(0, 0, "Charts data included in request, but native generation requires specific mapping.")
    
    workbook.close()
    return output.getvalue()
