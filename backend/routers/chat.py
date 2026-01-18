from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import SessionLocal
from models import Expense
from schemas import ChatRequest, ChatResponse

router = APIRouter(
    prefix="/chat",
    tags=["Chatbot"]
)


# Database dependency
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
    if "how much" in message or "total" in message or "spent" in message:
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

    # 3️⃣ Add expense
    if "add" in message:
        # Example: "add 200 for taxi"
        words = message.split()
        try:
            amount = float(words[1])
            category = words[-1].capitalize()

            new_expense = Expense(
                title=category,
                amount=amount,
                category=category,
                date="2026-01-02"
            )

            db.add(new_expense)
            db.commit()

            return f"✅ Added ₹{amount} to {category}."
        except:
            return "❌ Use format: Add <amount> for <category>"

    return "🤖 I didn't understand. Try: 'How much did I spend on Food?'"



@router.post("/", response_model=ChatResponse)
def chat_endpoint(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    reply = process_chat(request.user_message, db)
    return {"bot_response": reply}
