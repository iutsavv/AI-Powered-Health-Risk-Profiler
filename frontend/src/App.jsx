import React, { useState } from 'react';
import { Heart, Activity, Shield, Sparkles } from 'lucide-react';
import SurveyForm from './components/SurveyForm';
import ResultsDashboard from './components/ResultsDashboard';

// API URL - uses environment variable in production, proxy in development
const API_URL = import.meta.env.VITE_API_URL || '';

function App() {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleAnalyze = async (input, isOcr = false) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/api/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input, isOcr }),
            });

            const data = await response.json();

            if (data.status === 'ok') {
                setResults(data);
            } else {
                setError(data);
            }
        } catch (err) {
            setError({
                status: 'connection_error',
                reason: 'Unable to connect to the analysis server. Please ensure the backend is running.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setResults(null);
        setError(null);
    };

    return (
        <div className="app-container">
            <header className="header">
                <div className="header__logo">
                    <div className="header__icon">
                        <Heart size={32} color="white" />
                    </div>
                    <h1 className="header__title">Health Risk Analyzer</h1>
                </div>
                <p className="header__subtitle">
                    Analyze your lifestyle survey and receive personalized health insights
                    with actionable recommendations
                </p>
            </header>

            <main className="main-container">
                {!results && !error && (
                    <SurveyForm onAnalyze={handleAnalyze} loading={loading} />
                )}

                {error && (
                    <div className="glass-card">
                        <div className="error-card">
                            <div className="error-card__icon">
                                <Shield size={40} />
                            </div>
                            <h2 className="error-card__title">
                                {error.status === 'incomplete_profile'
                                    ? 'Incomplete Profile'
                                    : 'Analysis Error'}
                            </h2>
                            <p className="error-card__message">{error.reason}</p>

                            {error.missing_fields && error.missing_fields.length > 0 && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                        Missing fields:
                                    </p>
                                    <div className="factor-tags" style={{ justifyContent: 'center' }}>
                                        {error.missing_fields.map((field, i) => (
                                            <span key={i} className="factor-tag">{field}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {error.partial_parse && (
                                <div className="parsed-data" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                                    <pre>{JSON.stringify(error.partial_parse, null, 2)}</pre>
                                </div>
                            )}

                            <button className="btn-primary" onClick={handleReset}>
                                <Activity size={20} />
                                Try Again
                            </button>
                        </div>
                    </div>
                )}

                {results && (
                    <ResultsDashboard results={results} onReset={handleReset} />
                )}
            </main>

            <footer className="disclaimer">
                <p className="disclaimer__text">
                    <Sparkles size={16} />
                    Made by Utsavv Kumar
                </p>
            </footer>
        </div>
    );
}

export default App;
