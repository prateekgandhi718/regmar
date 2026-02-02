# analyze.py
import argparse
import json
from core import run_ultimate_portfolio

parser = argparse.ArgumentParser()
parser.add_argument("--tickers", required=True)
parser.add_argument("--period", default="5y")
parser.add_argument("--risk_free", type=float, default=0.03)

args = parser.parse_args()

tickers = [t.strip() for t in args.tickers.split(",")]

weights, perf = run_ultimate_portfolio(
    tickers=tickers,
    period=args.period,
    risk_free_rate=args.risk_free
)

result = {
    "allocations": {
        k: round(v * 100, 2)
        for k, v in weights.items()
    },
    "metrics": {
        "expectedAnnualReturn": round(perf[0], 4),
        "annualVolatility": round(perf[1], 4),
        "sharpeRatio": round(perf[2], 4)
    }
}

print(json.dumps(result))
