import json
import requests
from openai import OpenAI
import google.generativeai as genai
import anthropic
import cohere

def get_llm_response(prompt: str, provider: str, api_key: str) -> str:
    if provider == 'openai':
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    elif provider == 'gemini':
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-pro')
        response = model.generate_content(prompt)
        return response.text
    elif provider == 'anthropic':
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text
    elif provider == 'cohere':
        co = cohere.Client(api_key)
        response = co.chat(message=prompt, model="command-r")
        return response.text
    elif provider == 'ollama':
        resp = requests.post('http://localhost:11434/api/generate', json={
            "model": "llama3", # default fallback
            "prompt": prompt,
            "stream": False
        })
        resp.raise_for_status()
        return resp.json().get("response", "")
    else:
        raise ValueError("Unsupported AI provider")

def generate_report(profile: dict, provider: str, api_key: str, title: str, notes: str) -> str:
    prompt = f"Write an executive summary report for data titled '{title}'. Notes: {notes}. Data profile: {json.dumps(profile, default=str)}. Return as Markdown."
    return get_llm_response(prompt, provider, api_key)

def generate_insights(profile: dict, stats_summary: dict, provider: str, api_key: str, notes: str) -> list[dict]:
    prompt = f"""Given the data profile and stats, generate 5-8 insights in JSON format.
    Format must be a JSON array of objects, each with: title (string), description (string), type (trend|anomaly|correlation|distribution|recommendation), severity (low|medium|high).
    Data: {json.dumps(profile, default=str)}. Stats: {json.dumps(stats_summary, default=str)}"""
    
    text = get_llm_response(prompt, provider, api_key)
    # Basic JSON extraction
    try:
        start = text.find('[')
        end = text.rfind(']') + 1
        return json.loads(text[start:end])
    except:
        return [{"title": "Failed to parse insights", "description": text, "type": "recommendation", "severity": "low"}]

def natural_language_query(question: str, profile: dict, provider: str, api_key: str) -> dict:
    prompt = f"""Convert the following question into a pandas query/filter expression or SQL logic to apply on a dataframe `df`. Also suggest a chart type.
    Question: {question}
    Columns: {json.dumps([c['name'] for c in profile['columns']])}
    Return ONLY JSON with keys: sql_query (string, pandas query string like "age > 30 and country == 'US'"), chart_suggestion (string), explanation (string)."""
    
    text = get_llm_response(prompt, provider, api_key)
    try:
        start = text.find('{')
        end = text.rfind('}') + 1
        data = json.loads(text[start:end])
        data['result'] = [] # to be filled by caller
        return data
    except:
        return {"sql_query": "", "result": [], "chart_suggestion": "table", "explanation": "Failed to parse LLM response"}

def suggest_charts(profile: dict) -> list[dict]:
    suggestions = []
    num_cols = [c['name'] for c in profile['columns'] if c['dtype'] in ('int64', 'float64')]
    cat_cols = [c['name'] for c in profile['columns'] if c['dtype'] in ('object', 'string', 'category')]
    date_cols = [c['name'] for c in profile['columns'] if 'date' in c['name'].lower() or c['dtype'] == 'datetime64[ns]']
    
    if len(num_cols) >= 2:
        suggestions.append({"chart_type": "scatter", "x_col": num_cols[0], "y_col": num_cols[1], "title": "Scatter Plot", "reason": "Two numeric columns found."})
    if len(cat_cols) >= 1 and len(num_cols) >= 1:
        suggestions.append({"chart_type": "bar", "x_col": cat_cols[0], "y_col": num_cols[0], "title": "Bar Chart", "reason": "Categorical and numeric column found."})
    if len(date_cols) >= 1 and len(num_cols) >= 1:
         suggestions.append({"chart_type": "line", "x_col": date_cols[0], "y_col": num_cols[0], "title": "Line Chart", "reason": "Time series data found."})
    
    return suggestions
