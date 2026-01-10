import React, { useState } from 'react';
import { FileText, Image, Send, Loader2 } from 'lucide-react';
import ImageUploader from './ImageUploader';

const SAMPLE_JSON = `{
  "age": 42,
  "smoker": true,
  "exercise": "rarely",
  "diet": "high sugar"
}`;

const DEFAULT_FORM_DATA = {
    age: '',
    smoker: false,
    exercise: 'sometimes',
    diet: 'balanced',
    alcohol: 'rarely',
    sleep: '7',
    stress: 'moderate',
};

function SurveyForm({ onAnalyze, loading }) {
    const [mode, setMode] = useState('form'); // 'form', 'json', 'image'
    const [jsonInput, setJsonInput] = useState(SAMPLE_JSON);
    const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
    const [ocrText, setOcrText] = useState('');

    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (mode === 'json') {
            try {
                const parsed = JSON.parse(jsonInput);
                onAnalyze(parsed, false);
            } catch {
                onAnalyze(jsonInput, false);
            }
        } else if (mode === 'image') {
            onAnalyze(ocrText, true);
        } else {
            // Convert form data to proper types
            const data = {
                age: parseInt(formData.age, 10) || undefined,
                smoker: formData.smoker,
                exercise: formData.exercise,
                diet: formData.diet,
                alcohol: formData.alcohol,
                sleep: parseInt(formData.sleep, 10) || undefined,
                stress: formData.stress,
            };
            onAnalyze(data, false);
        }
    };

    const handleOcrComplete = (text) => {
        setOcrText(text);
    };

    return (
        <div className="glass-card survey-form">
            {/* Tab Switcher */}
            <div className="tab-switcher">
                <button
                    type="button"
                    className={`tab-button ${mode === 'form' ? 'active' : ''}`}
                    onClick={() => setMode('form')}
                >
                    <FileText size={18} />
                    Form Input
                </button>
                <button
                    type="button"
                    className={`tab-button ${mode === 'json' ? 'active' : ''}`}
                    onClick={() => setMode('json')}
                >
                    <FileText size={18} />
                    JSON Input
                </button>
                <button
                    type="button"
                    className={`tab-button ${mode === 'image' ? 'active' : ''}`}
                    onClick={() => setMode('image')}
                >
                    <Image size={18} />
                    Image/OCR
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Form Mode */}
                {mode === 'form' && (
                    <div className="form-section">
                        <h3 className="section-title">
                            <FileText size={20} />
                            Lifestyle Survey
                        </h3>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label" htmlFor="age">Age</label>
                                <input
                                    type="number"
                                    id="age"
                                    className="form-input"
                                    placeholder="Enter your age"
                                    value={formData.age}
                                    onChange={(e) => handleFormChange('age', e.target.value)}
                                    min="1"
                                    max="120"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Smoker</label>
                                <div className="toggle-container">
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={formData.smoker}
                                            onChange={(e) => handleFormChange('smoker', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>
                                        {formData.smoker ? 'Yes' : 'No'}
                                    </span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="exercise">Exercise Frequency</label>
                                <select
                                    id="exercise"
                                    className="form-select"
                                    value={formData.exercise}
                                    onChange={(e) => handleFormChange('exercise', e.target.value)}
                                >
                                    <option value="rarely">Rarely / Never</option>
                                    <option value="sometimes">Sometimes (1-2x/week)</option>
                                    <option value="regularly">Regularly (3+ times/week)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="diet">Diet Type</label>
                                <select
                                    id="diet"
                                    className="form-select"
                                    value={formData.diet}
                                    onChange={(e) => handleFormChange('diet', e.target.value)}
                                >
                                    <option value="high sugar">High Sugar / Junk Food</option>
                                    <option value="balanced">Balanced / Mixed</option>
                                    <option value="healthy">Healthy / Whole Foods</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="alcohol">Alcohol Consumption</label>
                                <select
                                    id="alcohol"
                                    className="form-select"
                                    value={formData.alcohol}
                                    onChange={(e) => handleFormChange('alcohol', e.target.value)}
                                >
                                    <option value="rarely">Rarely / Never</option>
                                    <option value="moderate">Moderate / Social</option>
                                    <option value="heavy">Heavy / Frequent</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="sleep">Average Sleep (hours)</label>
                                <select
                                    id="sleep"
                                    className="form-select"
                                    value={formData.sleep}
                                    onChange={(e) => handleFormChange('sleep', e.target.value)}
                                >
                                    <option value="4">4 hours or less</option>
                                    <option value="5">5 hours</option>
                                    <option value="6">6 hours</option>
                                    <option value="7">7 hours</option>
                                    <option value="8">8 hours</option>
                                    <option value="9">9+ hours</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="stress">Stress Level</label>
                                <select
                                    id="stress"
                                    className="form-select"
                                    value={formData.stress}
                                    onChange={(e) => handleFormChange('stress', e.target.value)}
                                >
                                    <option value="low">Low</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* JSON Mode */}
                {mode === 'json' && (
                    <div className="form-section">
                        <h3 className="section-title">
                            <FileText size={20} />
                            JSON Survey Data
                        </h3>
                        <div className="form-group">
                            <label className="form-label" htmlFor="json-input">
                                Enter survey data as JSON
                            </label>
                            <textarea
                                id="json-input"
                                className="form-textarea"
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                placeholder='{"age": 42, "smoker": true, "exercise": "rarely", "diet": "high sugar"}'
                                spellCheck="false"
                            />
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            Supported fields: age, smoker, exercise, diet, alcohol, sleep, stress, bmi
                        </p>
                    </div>
                )}

                {/* Image Mode */}
                {mode === 'image' && (
                    <div className="form-section">
                        <h3 className="section-title">
                            <Image size={20} />
                            Scan Survey Form
                        </h3>
                        <ImageUploader onOcrComplete={handleOcrComplete} />

                        {ocrText && (
                            <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                <label className="form-label">Extracted Text (editable)</label>
                                <textarea
                                    className="form-textarea"
                                    value={ocrText}
                                    onChange={(e) => setOcrText(e.target.value)}
                                    rows={6}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    className={`btn-primary ${loading ? 'loading' : ''}`}
                    disabled={loading || (mode === 'image' && !ocrText)}
                >
                    {loading ? (
                        <>
                            <Loader2 size={20} className="spinner" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Send size={20} />
                            Analyze Health Risk
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

export default SurveyForm;
