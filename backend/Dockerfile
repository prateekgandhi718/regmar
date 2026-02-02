# ---------- Base image ----------
FROM node:20-slim

# ---------- Install system deps ----------
RUN apt-get update && apt-get install -y \
    python3 \
    python3-venv \
    python3-dev \
    ca-certificates \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*


# ---------- Install uv ----------
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

# ---------- Set working directory ----------
WORKDIR /app

# ---------- Copy Node files ----------
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Copy Python files ----------
COPY python ./python

# ---------- Copy equity data ----------
COPY data ./data

# ---------- Create Python venv & install deps ----------
WORKDIR /app/python/ultimate_portfolio
RUN uv venv .venv && uv sync --frozen

# ---------- Back to app root ----------
WORKDIR /app

# ---------- Copy backend ----------
COPY src ./src
COPY tsconfig.json ./

# ---------- Build Node ----------
RUN npm run build

# ---------- Expose port ----------
EXPOSE 5000

# ---------- Start server ----------
CMD ["npm", "start"]
    