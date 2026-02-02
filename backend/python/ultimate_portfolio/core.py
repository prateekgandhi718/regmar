# core.py
import yfinance as yf
from pypfopt import EfficientFrontier, expected_returns, risk_models


def run_ultimate_portfolio(tickers, period="5y", risk_free_rate=0.03):
    prices = yf.download(
        tickers,
        period=period,
        interval="1d",
        auto_adjust=True,
        progress=False
    )["Close"]

    prices = prices.dropna() # This is problamatic since it will drop all the records for na. If a user has an ipo, it will drop most of the records for legacy stocks as well since the ipo must have been listed quite recently.

    mu = expected_returns.mean_historical_return(prices, frequency=252)
    S = risk_models.sample_cov(prices, frequency=252)

    ef = EfficientFrontier(mu, S)
    ef.max_sharpe(risk_free_rate=risk_free_rate)

    weights = ef.clean_weights()
    performance = ef.portfolio_performance(risk_free_rate=risk_free_rate)

    return weights, performance
