# NER model — training steps (spaCy)

This document shows the exact commands used to split the dataset, create a spaCy config, and train the NER model so others can reproduce the process.

# 2) Split the dataset into train/dev
# This reads `data/ner.spacy` and writes `data/train.spacy` and `data/dev.spacy`.
uv run app/split.py

# 3) Generate a spaCy config (one-time)
uv run spacy init config config.cfg \
  --lang en \
  --pipeline ner \
  --optimize efficiency

# 4) Train using the spaCy CLI
uv run spacy train config.cfg \
  --output models \
  --paths.train data/train.spacy \
  --paths.dev data/dev.spacy

Notes
- The split script expects `data/ner.spacy` to exist with your labelled DocBin.
- `config.cfg` was generated with `--optimize efficiency`. If you want a transformer-based model, install `spacy-transformers` and re-run `spacy init config`.
- Trained models will be saved under `backend/python/app/models`.