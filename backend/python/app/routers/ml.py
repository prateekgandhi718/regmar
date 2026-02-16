"""
ML router for classifier and NER endpoints.
"""

from fastapi import APIRouter
from app.schemas import (
    ClassifyEmailRequest, ClassifyEmailResponse,
    ClassifyTransactionTypeRequest, ClassifyTransactionTypeResponse
)
from app.controllers.ml import classify_email, classify_txn_type

router = APIRouter(prefix="/ml", tags=["ml"])


@router.post("/classify-email", response_model=ClassifyEmailResponse)
async def classify_email_endpoint(request: ClassifyEmailRequest) -> ClassifyEmailResponse:
    """
    Classify an email as transaction or non-transaction.
    
    Request:
        {
            "email_body": "Rs.1082.00 has been debited..."
        }
    
    Response:
        {
            "label": 1,
            "is_transaction": true,
            "confidence": 0.9523,
            "probabilities": {
                "non_transaction": 0.0477,
                "transaction": 0.9523
            }
        }
    """
    result = classify_email(request.email_body)
    return ClassifyEmailResponse(**result)


@router.post("/classify-txn-type", response_model=ClassifyTransactionTypeResponse)
async def classify_txn_type_endpoint(request: ClassifyTransactionTypeRequest) -> ClassifyTransactionTypeResponse:
    """
    Classify a transaction email as debit or credit.
    
    Request:
        {
            "email_body": "Rs.1082.00 has been debited to account..."
        }
    
    Response:
        {
            "label": 1,
            "type": "debit",
            "confidence": 0.9234,
            "probabilities": {
                "credit": 0.0766,
                "debit": 0.9234
            }
        }
    """
    result = classify_txn_type(request.email_body)
    return ClassifyTransactionTypeResponse(**result)
