"""
ML-related controller logic (classifier, NER retraining, etc).
"""

import json
import logging
import subprocess
from pathlib import Path
from typing import List
from threading import Thread

from app.ml.classifier import classify_email_func
from app.ml.type_classifier import classify_transaction_type
from app.ml.ner import extract_entities
from app.schemas import NerTrainingSample
from app.utils import get_next_model_dir

logger = logging.getLogger(__name__)

DATA_DIR = Path("app/ml/data")
JSONL_PATH = DATA_DIR / "ner_spacy.jsonl"
MODELS_DIR = Path("app/models")
LOCK_FILE = Path("app/ml/.retrain.lock")


# ==========================================================
# CLASSIFICATION
# ==========================================================

def classify_email(email_body: str) -> dict:
    if not email_body or not email_body.strip():
        raise ValueError("email_body cannot be empty")

    result = classify_email_func(email_body)

    if result.get("error"):
        logger.error(f"Classification error: {result['error']}")
        raise RuntimeError(result["error"])

    return result


def classify_txn_type(email_body: str) -> dict:
    if not email_body or not email_body.strip():
        raise ValueError("email_body cannot be empty")

    result = classify_transaction_type(email_body)

    if result.get("error"):
        logger.error(f"Txn type classification error: {result['error']}")
        raise RuntimeError(result["error"])

    return result


def extract_ner_entities(email_body: str) -> dict:
    if not email_body or not email_body.strip():
        raise ValueError("email_body cannot be empty")

    result = extract_entities(email_body)

    if result.get("error"):
        logger.error(f"NER extraction error: {result['error']}")
        raise RuntimeError(result["error"])

    return result


# ==========================================================
# NER RETRAINING (ASYNC)
# ==========================================================

def retrain_ner_model(samples: List[NerTrainingSample]) -> dict:
    """
    Public entrypoint.
    Starts retraining in background thread.
    """

    if not samples:
        raise ValueError("No training samples provided")

    # Atomic lock creation
    try:
        LOCK_FILE.open("x").close()
    except FileExistsError:
        return {
            "success": False,
            "samples_added": 0,
            "message": "Retraining already in progress",
        }

    # Start background training
    thread = Thread(target=_run_retraining_pipeline, args=(samples,))
    thread.daemon = True
    thread.start()

    return {
        "success": True,
        "samples_added": len(samples),
        "message": "NER retraining started in background",
    }


def _run_retraining_pipeline(samples: List[NerTrainingSample]) -> None:
    """
    Actual retraining pipeline (runs in background thread).
    """

    logger.info("🚀 NER retraining started")

    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)

        # --------------------------------------------------
        # 1️⃣ Append to JSONL (with flush for integrity)
        # --------------------------------------------------
        with open(JSONL_PATH, "a", encoding="utf-8") as f:
            for sample in samples:

                # Validate entity spans
                for start, end, label in sample.entities:
                    if start < 0 or end > len(sample.text) or start >= end:
                        raise ValueError(
                            f"Invalid entity span: {(start, end, label)}"
                        )

                record = {
                    "text": sample.text,
                    "entities": sample.entities,
                }

                json.dump(record, f, ensure_ascii=False)
                f.write("\n")
                f.flush()  # ensures disk write integrity

        logger.info(f"✅ Appended {len(samples)} samples to JSONL")

        # --------------------------------------------------
        # 2️⃣ Create DocBin
        # --------------------------------------------------
        _run_subprocess([
            "uv", "run",
            "scripts/create_docbin_from_jsonl.py",
            str(JSONL_PATH),
            "app/ml/data/ner.spacy",
        ])

        # --------------------------------------------------
        # 3️⃣ Split train/dev
        # --------------------------------------------------
        _run_subprocess([
            "uv", "run",
            "app/ml/split.py",
        ])

        # --------------------------------------------------
        # 4️⃣ Train spaCy (versioned model)
        # --------------------------------------------------
        model_output_dir = get_next_model_dir()

        _run_subprocess([
            "uv", "run",
            "spacy", "train",
            "app/config.cfg",
            "--output", str(model_output_dir),
            "--paths.train", "app/ml/data/train.spacy",
            "--paths.dev", "app/ml/data/dev.spacy",
        ])

        logger.info(f"🎯 Training complete → {model_output_dir.name}")

    except Exception as e:
        logger.exception(f"❌ Retraining failed: {e}")

    finally:
        # Always remove lock
        if LOCK_FILE.exists():
            LOCK_FILE.unlink()
        logger.info("🔓 Retraining lock released")


# ==========================================================
# SUBPROCESS HELPER (WITH DEBUGGING)
# ==========================================================

def _run_subprocess(command: List[str]) -> None:
    """
    Runs subprocess with stdout/stderr capture + logging.
    """

    logger.info(f"Running command: {' '.join(command)}")

    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
    )

    if result.stdout:
        logger.info(result.stdout)

    if result.stderr:
        logger.error(result.stderr)

    if result.returncode != 0:
        raise RuntimeError(
            f"Command failed with exit code {result.returncode}"
        )
