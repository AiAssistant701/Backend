import psycopg2
import os

# Connect to PostgreSQL
conn = psycopg2.connect(os.getenv("POSTGRES_URI"))
cursor = conn.cursor()

def log_ai_decision(task_type, model_used, reason):
    """Logs AI decisions to improve explainability & debugging."""
    cursor.execute(
        "INSERT INTO ai_decision_logs (task_type, model_used, reason, timestamp) VALUES (%s, %s, %s, NOW())",
        (task_type, model_used, reason)
    )
    conn.commit()
