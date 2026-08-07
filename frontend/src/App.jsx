import { useState } from 'react';
import RetirementChart from './RetirementChart';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const initialForm = {
  currentAge: 30,
  retirementAge: 65,
  currentSavings: 20000,
  monthlyContribution: 500,
  annualReturnPct: 7,
  annualInflationPct: 2.5,
};

function App() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value === '' ? '' : Number(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Retirement Projection</h1>
      <p className="subtitle">A quick, rough estimate — not financial advice.</p>

      <form onSubmit={handleSubmit} className="form">
        <label>
          Current age
          <input type="number" name="currentAge" value={form.currentAge} onChange={handleChange} required />
        </label>
        <label>
          Retirement age
          <input type="number" name="retirementAge" value={form.retirementAge} onChange={handleChange} required />
        </label>
        <label>
          Current savings ($)
          <input type="number" name="currentSavings" value={form.currentSavings} onChange={handleChange} required />
        </label>
        <label>
          Monthly contribution ($)
          <input type="number" name="monthlyContribution" value={form.monthlyContribution} onChange={handleChange} required />
        </label>
        <label>
          Expected annual return (%)
          <input type="number" step="0.1" name="annualReturnPct" value={form.annualReturnPct} onChange={handleChange} required />
        </label>
        <label>
          Expected annual inflation (%)
          <input type="number" step="0.1" name="annualInflationPct" value={form.annualInflationPct} onChange={handleChange} required />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Calculating…' : 'Project'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="results">
          <div className="summary">
            <div>
              <span className="label">At retirement (nominal)</span>
              <span className="value">${result.summary.finalNominal.toLocaleString()}</span>
            </div>
            <div>
              <span className="label">At retirement (today's dollars)</span>
              <span className="value">${result.summary.finalReal.toLocaleString()}</span>
            </div>
          </div>
          <RetirementChart years={result.years} />
        </div>
      )}
    </div>
  );
}

export default App;
