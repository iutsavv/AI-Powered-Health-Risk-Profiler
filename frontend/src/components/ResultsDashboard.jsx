import React from 'react';
import {
    CheckCircle2, AlertTriangle, ArrowRight,
    RotateCcw, Target, ListChecks, Lightbulb, AlertCircle
} from 'lucide-react';
import RiskMeter from './RiskMeter';
import RecommendationCard from './RecommendationCard';

function ResultsDashboard({ results, onReset }) {
    const {
        risk_level,
        score,
        factors,
        rationale,
        recommendations,
        detailed_recommendations,
        warnings,
        parse_confidence,
        factor_confidence,
        answers
    } = results;

    return (
        <div className="results-dashboard">
            {/* Analysis Steps */}
            <div className="analysis-steps">
                <div className="analysis-step complete">
                    <span className="analysis-step__number"><CheckCircle2 size={14} /></span>
                    Parsed
                </div>
                <ArrowRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                <div className="analysis-step complete">
                    <span className="analysis-step__number"><CheckCircle2 size={14} /></span>
                    Factors
                </div>
                <ArrowRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                <div className="analysis-step complete">
                    <span className="analysis-step__number"><CheckCircle2 size={14} /></span>
                    Risk
                </div>
                <ArrowRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                <div className="analysis-step complete">
                    <span className="analysis-step__number"><CheckCircle2 size={14} /></span>
                    Recommendations
                </div>
            </div>

            {/* Risk Meter */}
            <div className="glass-card">
                <div className="results-header">
                    <h2 className="results-header__title">Your Health Risk Assessment</h2>
                    <p className="results-header__subtitle">
                        Based on your lifestyle survey responses
                    </p>
                </div>

                <RiskMeter score={score} riskLevel={risk_level} />

                {/* Confidence Indicators */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="confidence-indicator">
                        <span>Parse confidence:</span>
                        <div className="confidence-bar">
                            <div className="confidence-bar__fill" style={{ width: `${(parse_confidence || 0) * 100}%` }} />
                        </div>
                        <span>{Math.round((parse_confidence || 0) * 100)}%</span>
                    </div>
                    <div className="confidence-indicator">
                        <span>Factor confidence:</span>
                        <div className="confidence-bar">
                            <div className="confidence-bar__fill" style={{ width: `${(factor_confidence || 0) * 100}%` }} />
                        </div>
                        <span>{Math.round((factor_confidence || 0) * 100)}%</span>
                    </div>
                </div>
            </div>

            {/* Results Grid */}
            <div className="results-grid" style={{ marginTop: '1.5rem' }}>
                {/* Risk Factors */}
                <div className="glass-card results-section">
                    <h3 className="results-section__title">
                        <Target size={20} />
                        Risk Factors Identified
                    </h3>
                    {factors && factors.length > 0 ? (
                        <div className="factor-tags">
                            {factors.map((factor, index) => (
                                <span key={index} className="factor-tag">
                                    <AlertCircle size={14} />
                                    {factor}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--color-risk-low)' }}>
                            No significant risk factors identified!
                        </p>
                    )}
                </div>

                {/* Rationale */}
                <div className="glass-card results-section">
                    <h3 className="results-section__title">
                        <ListChecks size={20} />
                        Analysis Rationale
                    </h3>
                    {rationale && rationale.length > 0 ? (
                        <ul className="rationale-list">
                            {rationale.map((item, index) => (
                                <li key={index} className="rationale-item">
                                    <AlertTriangle size={16} />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            Your lifestyle factors are within healthy ranges.
                        </p>
                    )}
                </div>
            </div>

            {/* Recommendations */}
            <div className="glass-card" style={{ marginTop: '1.5rem' }}>
                <h3 className="results-section__title">
                    <Lightbulb size={20} />
                    Personalized Recommendations
                </h3>
                {detailed_recommendations && detailed_recommendations.length > 0 ? (
                    <div className="recommendations-list">
                        {detailed_recommendations.map((rec, index) => (
                            <RecommendationCard key={index} recommendation={rec} />
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--color-risk-low)' }}>
                        Keep up the great work! Maintain your healthy lifestyle habits.
                    </p>
                )}
            </div>

            {/* Warnings */}
            {warnings && warnings.length > 0 && (
                <div className="warnings">
                    {warnings.map((warning, index) => (
                        <div key={index} className="warning-item">
                            <AlertTriangle size={18} />
                            <span>{warning.message}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Parsed Data (collapsible) */}
            <details style={{ marginTop: '1.5rem' }}>
                <summary style={{
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.9rem',
                    marginBottom: '0.5rem'
                }}>
                    View parsed survey data
                </summary>
                <div className="parsed-data">
                    <pre>{JSON.stringify(answers, null, 2)}</pre>
                </div>
            </details>

            {/* Reset Button */}
            <button
                className="btn-secondary"
                onClick={onReset}
                style={{ marginTop: '2rem' }}
            >
                <RotateCcw size={18} />
                Start New Analysis
            </button>
        </div>
    );
}

export default ResultsDashboard;
