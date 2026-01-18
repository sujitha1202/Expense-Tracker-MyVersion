from fastapi import FastAPI, Depends, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List   
from sqlalchemy import func
from schemas import ChatRequest, ChatResponse


from database import SessionLocal, engine
from models import Expense
from schemas import (
    ExpenseCreate,
    ExpenseResponse,
    ExpensePostResponse,
    ExpenseDeleteResponse,
    PredictRequest,
    PredictResponse,
    CompareResponse,
)

# Create database tables
from models import Base
Base.metadata.create_all(bind=engine)

app = FastAPI()



# Configure CORS to allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost:5174"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create API router (endpoints without /api prefix)
api_router = APIRouter()


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def process_chat(message: str, db: Session) -> str:
    message = message.lower()

    # 1️⃣ Greeting
    if "hello" in message or "hi" in message:
        return "Hi 👋 I can help you track your expenses."

    # 2️⃣ Total spent query
    if "how much" in message or "spent" in message or "total" in message:
        categories = ["food", "coffee", "taxi", "transport", "shopping"]

        for category in categories:
            if category in message:
                total = (
                    db.query(func.sum(Expense.amount))
                    .filter(Expense.category.ilike(category))
                    .scalar()
                )
                total = total or 0
                return f"You have spent a total of ₹{total} on {category.capitalize()}."

    # 3️⃣ Add expense command
    if "add" in message:
        # Example: add 200 for taxi
        words = message.split()
        try:
            amount = float(words[1])
            category = words[-1].capitalize()

            expense = Expense(
                title=category,
                amount=amount,
                category=category,
                date="2026-01-02"
            )

            db.add(expense)
            db.commit()

            return f"✅ Added ₹{amount} to {category}."
        except:
            return "❌ Use format: Add <amount> for <category>"

    return "🤖 I didn’t understand. Try: 'How much did I spend on Food?'"


# Expenses endpoints (no /api prefix - will be mounted at /api)
@api_router.get("/expenses", response_model=List[ExpenseResponse])
def get_expenses(db: Session = Depends(get_db)):
    """Get all expenses"""
    expenses = db.query(Expense).all()
    return expenses


@api_router.post("/expenses", response_model=ExpensePostResponse)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    """Create a new expense"""
    db_expense = Expense(
        title=expense.title,
        amount=expense.amount,
        category=expense.category,
        date=expense.date
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return ExpensePostResponse(message="Expense Added", id=db_expense.id)


@api_router.delete("/expenses/{expense_id}", response_model=ExpenseDeleteResponse)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    """Delete an expense by ID"""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return ExpenseDeleteResponse(message="Deleted Successfully")


# AIML endpoints (mocked for now)
@api_router.post("/aiml/predict", response_model=PredictResponse)
def predict_category(request: PredictRequest):
    """Mock endpoint for category prediction"""
    return PredictResponse(
        predicted_category="Mocked Category",
        confidence=0.95
    )


@api_router.get("/aiml/compare", response_model=CompareResponse)
def compare_spending():
    """Mock endpoint for spending comparison"""
    return CompareResponse(
        message="Spending analysis placeholder."
    )

@api_router.post("/chat", response_model=ChatResponse)
def chat_endpoint(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    reply = process_chat(request.user_message, db)
    return {"bot_response": reply}

# Mount the API router at root (proxy will strip /api before forwarding)
app.include_router(api_router)


# To run the server, use:
# uvicorn main:app --reload --port 8000

