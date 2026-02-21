"""
NER utility to load and use the trained spaCy NER model.
Extracts entities (AMOUNT, MERCHANT) from email text.
"""
import spacy
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Singleton model instance
_ner_model = None
_model_loaded = False


def load_ner_model():
    """Load the trained NER model. Cached after first load."""
    global _ner_model, _model_loaded
    if _model_loaded:
        return _ner_model
    
    model_path = Path(__file__).parent / 'models' / 'model-best'
    
    if not model_path.exists():
        logger.warning(f"NER model not found at {model_path}")
        return None
    
    try:
        _ner_model = spacy.load(model_path)
        _model_loaded = True
        logger.info(f"NER model loaded from {model_path}")
        return _ner_model
    except Exception as e:
        logger.error(f"Error loading NER model: {e}")
        return None


def extract_entities(email_body: str) -> dict:
    """
    Extract named entities (AMOUNT, MERCHANT) from email text.
    
    Args:
        email_body: Raw email text
    
    Returns:
        {
            'text': email_body,
            'entities': [
                {'text': '500', 'label': 'AMOUNT', 'start': 18, 'end': 21},
                {'text': 'Blinkit', 'label': 'MERCHANT', 'start': 87, 'end': 94},
            ],
            'error': None (or error message if extraction failed)
        }
    """
    if not email_body or not isinstance(email_body, str):
        return {
            'text': email_body,
            'entities': [],
            'error': 'Invalid input: email_body must be a non-empty string'
        }
    
    model = load_ner_model()
    if model is None:
        return {
            'text': email_body,
            'entities': [],
            'error': 'NER model not loaded'
        }
    
    try:
        # Process text with spaCy
        doc = model(email_body)
        
        # Extract entities
        entities = []
        for ent in doc.ents:
            entities.append({
                'text': ent.text,
                'label': ent.label_,
                'start': ent.start_char,
                'end': ent.end_char
            })
        
        return {
            'text': email_body,
            'entities': entities,
            'error': None
        }
    except Exception as e:
        logger.error(f"Error extracting entities: {e}")
        return {
            'text': email_body,
            'entities': [],
            'error': str(e)
        }
