import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
import stripe
from dotenv import load_dotenv

logger = logging.getLogger("uvicorn")

load_dotenv()

stripe.api_key = os.getenv("STRIPE_API_KEY")

logger.warning(stripe.api_key)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class UserInfo(BaseModel):
    name: str
    address: str
    city: str
    state: str
    zip: str
class PaymentIntent(BaseModel):
  amount: str
  currency: str
  userInfo: UserInfo

@app.post("/create-payment-intent")
async def create_payment_intent(payment_intent: PaymentIntent):

    amount = int(payment_intent.amount)

    try:
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency=payment_intent.currency
        )

        return {"clientSecret": intent.client_secret}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
  uvicorn.run(app, host="0.0.0.0", port=8000)