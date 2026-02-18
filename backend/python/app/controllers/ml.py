"""
ML-related controller logic (classifier, NER, etc).
"""

from app.ml.classifier import classify_email_func
from app.ml.type_classifier import classify_transaction_type
from app.ml.ner import extract_entities
import logging

logger = logging.getLogger(__name__)


def classify_email(email_body: str) -> dict:
    """
    Classify an email as transaction or non-transaction.
    
    Args:
        email_body: The raw email text to classify
    
    Returns:
        {
            "label": 0 or 1,
            "is_transaction": bool,
            "confidence": float,
            "probabilities": {
                "non_transaction": float,
                "transaction": float
            }
        }
    """
    if not email_body or len(email_body.strip()) == 0:
        raise ValueError("email_body cannot be empty")
    
    result = classify_email_func(email_body)
    
    # If there was an error loading the model
    if result.get('error'):
        logger.error(f"Classification error: {result['error']}")
        raise RuntimeError(f"Model error: {result['error']}")
    
    return result


def classify_txn_type(email_body: str) -> dict:
    """
    Classify a transaction email as debit or credit.
    
    Args:
        email_body: The raw transaction email text to classify
    
    Returns:
        {
            "label": 0 or 1,
            "type": 'credit' or 'debit',
            "confidence": float,
            "probabilities": {
                "credit": float,
                "debit": float
            }
        }
    """
    if not email_body or len(email_body.strip()) == 0:
        raise ValueError("email_body cannot be empty")
    
    result = classify_transaction_type(email_body)
    
    # If there was an error loading the model
    if result.get('error'):
        logger.error(f"Type classification error: {result['error']}")
        raise RuntimeError(f"Model error: {result['error']}")
    
    return result


def extract_ner_entities(email_body: str) -> dict:
    """
    Extract named entities (AMOUNT, MERCHANT) from an email.
    
    Args:
        email_body: The raw email text to extract entities from
    
    Returns:
        {
            "text": email_body,
            "entities": [
                {"text": "500", "label": "AMOUNT", "start": 18, "end": 21},
                {"text": "Blinkit", "label": "MERCHANT", "start": 87, "end": 94}
            ]
        }
    """
    if not email_body or len(email_body.strip()) == 0:
        raise ValueError("email_body cannot be empty")
    
    result = extract_entities(email_body)
    
    # If there was an error
    if result.get('error'):
        logger.error(f"NER extraction error: {result['error']}")
        raise RuntimeError(f"Model error: {result['error']}")
    
    return result
