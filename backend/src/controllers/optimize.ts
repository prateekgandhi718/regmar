import express from 'express';
import path from 'path';
import { spawn } from 'child_process';
import { AuthRequest } from '../middlewares/auth';
import fs from 'fs';

export const runPortfolioOptimizer = async (
  req: AuthRequest,
  res: express.Response
) => {
  try {
    const userId = req.userId;
    const { tickers, period, riskFreeRate } = req.body as {
      tickers?: string[];
      period?: string;
      riskFreeRate?: number;
    };

    if (!userId) return res.sendStatus(401);

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return res.status(400).json({ message: 'tickers must be a non-empty array' });
    }

    // 1. Resolve Paths
    const pythonFolder = path.join(process.cwd(), 'python', 'ultimate_portfolio');
    const scriptPath = path.join(pythonFolder, 'analyze.py');
    
    // 2. Locate the Virtual Environment Python executable
    // On Windows, it's usually .venv/Scripts/python.exe
    // On Linux/Mac, it's usually .venv/bin/python
    const venvPath = path.join(pythonFolder, '.venv', 'Scripts', 'python.exe');
    const pythonExecutable = fs.existsSync(venvPath) ? venvPath : 'python'; 

    const args = [
      scriptPath,
      '--tickers', tickers.join(','),
      '--period', period ?? '5y',
      '--risk_free', String(riskFreeRate ?? 0.03),
    ];

    // 3. Spawn the process using the specific venv python
    const python = spawn(pythonExecutable, args, {
        cwd: pythonFolder // Set working directory so core.py can be imported
    });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => { stdout += data.toString(); });
    python.stderr.on('data', (data) => { stderr += data.toString(); });

    python.on('close', (code) => {
      if (code !== 0) {
        console.error('Optimizer stderr:', stderr);
        return res.status(500).json({ message: 'Optimization failed', detail: stderr });
      }

      try {
        const result = JSON.parse(stdout);
        return res.status(200).json(result);
      } catch (err) {
        console.error('Invalid output:', stdout);
        return res.status(500).json({ message: 'Invalid optimizer response' });
      }
    });
  } catch (error) {
    console.error('Run optimizer error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};