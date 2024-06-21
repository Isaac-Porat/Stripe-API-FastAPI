import os
from fastapi import FastAPI, HTTPException
import stripe
from dotenv import load_dotenv
import uvicorn

load_dotenv()

STRIPE_API_KEY = os.getenv("STRIPE_API_KEY")

app = FastAPI()

@app.post("/process-payment")
async def process_payment(amount: int, currency: str, token: str):
  try:

    intent = stripe.PaymentIntent.create(
      amount=amount,
      currency=currency,
      automatic_payment_methods={
          'enabled': True,
    })

    return {"status": "success", "charge_id": intent.id}

  except stripe.CardError as e:
    return {"status": "error", "message": str(e)}
  except stripe.StripeError as e:
    return {"status": "error", "message": "Something went wrong. Please try again later."}

if __name__ == "__main__":
  uvicorn.run(app, host="0.0.0.0", port=8000)