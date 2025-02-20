from transformers import T5Tokenizer, T5ForConditionalGeneration
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncpg  # PostgreSQL async driver
import asyncio

# import torch
# from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# Initialize FastAPI
app = FastAPI()

# Enable CORS to allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change "*" to specific domain if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# # Load the fine-tuned T5 model and tokenizer
# model_dir = "./cxmefzzi"  # Replace with your model path
# print("Loading the model...")
# model = T5ForConditionalGeneration.from_pretrained(model_dir)
# print("Model loaded successfully!")
# tokenizer = T5Tokenizer.from_pretrained(model_dir)

# Load the fine-tuned T5 model and tokenizer
model_dir = "../flan-t5-base"  # Replace with your model path
print("Loading the model...")
model = T5ForConditionalGeneration.from_pretrained(model_dir)
print("Model loaded successfully!")
tokenizer = T5Tokenizer.from_pretrained(model_dir)


# # Model name as provided on Hugging Face
# model_name = "tscholak/cxmefzzi"

# # Load the tokenizer and model from Hugging Face Hub
# tokenizer = AutoTokenizer.from_pretrained(model_name)
# print("Loading the model...")
# model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
# print("Model loaded successfully!")

# Database Connection Settings
DB_CONFIG = {
    "user": "postgres",  # Change if your username is different
    "password": "1234",  # Use your actual PostgreSQL password
    "database": "postgres",  # Replace with your DB name
    "host": "localhost",
    "port": "5432",
}

# Create a database connection pool
db_pool = None

async def connect_db():
    global db_pool
    if db_pool is None:
        db_pool = await asyncpg.create_pool(**DB_CONFIG)


# Pydantic model for request validation (JSON body)
class QueryRequest(BaseModel):
    query: str
    schema_details: str = ""  # Optional schema details

class SQLExecutionRequest(BaseModel):
    sql_query: str

@app.post("/generate_sql")
async def generate_sql(request: QueryRequest):
    """ Converts English query to SQL and executes it immediately """
    # Append schema details to the query
    formatted_query = f"{request.schema_details}\n\nQuestion: {request.query}"
    
    inputs = tokenizer(formatted_query, return_tensors="pt", max_length=256, truncation=True)
    outputs = model.generate(inputs.input_ids, max_length=256, num_beams=8, early_stopping=True)
    sql_query = tokenizer.decode(outputs[0], skip_special_tokens=True)

    # Execute SQL immediately
    result = []
    error = None
    await connect_db()
    try:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(sql_query)
            result = [dict(row) for row in rows]
    except Exception as e:
        error = str(e)

    return {"sql_query": sql_query, "results": result, "error": error}

@app.post("/execute_sql")
async def execute_sql(request: SQLExecutionRequest):
    """ Executes an SQL query on the database """
    await connect_db()
    try:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(request.sql_query)
            result = [dict(row) for row in rows]
        return {"results": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SQL Execution Error: {str(e)}")