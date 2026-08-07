import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

function projectRetirement({
  currentAge,
  retirementAge,
  currentSavings,
  monthlyContribution,
  annualReturnPct,
  annualInflationPct,
}) {
  const monthlyRate = annualReturnPct / 100 / 12;
  const years = [];
  let balance = currentSavings;

  for (let age = currentAge; age <= retirementAge; age++) {
    if (age > currentAge) {
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + monthlyRate) + monthlyContribution;
      }
    }
    const yearsElapsed = age - currentAge;
    const realBalance = balance / Math.pow(1 + annualInflationPct / 100, yearsElapsed);
    years.push({
      age,
      nominalBalance: Math.round(balance),
      realBalance: Math.round(realBalance),
    });
  }

  return {
    years,
    summary: {
      finalNominal: years[years.length - 1].nominalBalance,
      finalReal: years[years.length - 1].realBalance,
    },
  };
}

app.post('/api/project', (req, res) => {
  const {
    currentAge,
    retirementAge,
    currentSavings,
    monthlyContribution,
    annualReturnPct,
    annualInflationPct,
  } = req.body;

  const inputs = { currentAge, retirementAge, currentSavings, monthlyContribution, annualReturnPct, annualInflationPct };
  const missing = Object.entries(inputs).filter(([, v]) => typeof v !== 'number' || Number.isNaN(v));
  if (missing.length > 0) {
    return res.status(400).json({ error: `Invalid or missing numeric fields: ${missing.map(([k]) => k).join(', ')}` });
  }
  if (retirementAge <= currentAge) {
    return res.status(400).json({ error: 'retirementAge must be greater than currentAge' });
  }

  res.json(projectRetirement(inputs));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Retirement API listening on port ${PORT}`));
