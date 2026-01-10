# Health Risk Analyzer

A full-stack health risk analysis service that processes lifestyle survey responses and generates personalized health insights with actionable recommendations.

![Health Risk Analyzer](https://img.shields.io/badge/version-1.1.0-blue) ![Node.js](https://img.shields.io/badge/node-%3E%3D18-green) ![React](https://img.shields.io/badge/react-18-blue)

## Features

- **Multi-Input Support**: Form input, JSON data, or OCR from scanned images
- **AI-Powered Analysis**: Risk factor extraction and health classification
- **JSON Schema Validation**: Type-safe API responses with validation
- **Pipeline Processing**: Step-by-step chained analysis with tracking
- **Comprehensive Guardrails**: Input validation, edge case handling, incomplete profile detection
- **Personalized Recommendations**: Non-diagnostic, actionable health guidance

## Quick Start

```bash
# Clone and install
cd plumb

# Start backend (Terminal 1)
cd backend
npm install
npm start  # http://localhost:3001

# Start frontend (Terminal 2)
cd frontend
npm install
npm run dev  # http://localhost:5173
```

## Architecture

```
plumb/
├── backend/                    # Express.js API server
│   ├── server.js               # Main server with endpoints
│   └── services/
│       ├── surveyParser.js     # Text/JSON/OCR parsing
│       ├── factorExtractor.js  # Risk factor identification
│       ├── riskClassifier.js   # Risk scoring (0-100)
│       ├── recommendationEngine.js  # Personalized advice
│       ├── guardrails.js       # Validation & edge cases
│       ├── schemaValidator.js  # JSON schema validation
│       └── pipeline.js         # Chained processing
└── frontend/                   # React + Vite
    ├── src/
    │   ├── App.jsx             # Main app component
    │   ├── components/         # UI components
    │   └── index.css           # Styles
    └── vite.config.js
```

## API Reference

### Main Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze` | POST | Full analysis pipeline |
| `/api/analyze/parse` | POST | Parse survey only |
| `/api/analyze/factors` | POST | Extract risk factors |
| `/api/analyze/risk` | POST | Classify risk level |
| `/api/analyze/recommendations` | POST | Get recommendations |
| `/api/health` | GET | Health check |
| `/api/fields` | GET | Expected input fields |
| `/api/schemas` | GET | Available JSON schemas |
| `/api/validate` | POST | Validate against schema |

### Example Request

```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "age": 42,
      "smoker": true,
      "exercise": "rarely",
      "diet": "high sugar",
      "stress": "high",
      "sleep": 5
    }
  }'
```

### Example Response

```json
{
  "status": "ok",
  "answers": { "age": 42, "smoker": true, "exercise": "rarely", "diet": "high sugar" },
  "parse_confidence": 1.0,
  "factors": ["smoking", "poor diet", "low exercise", "middle age"],
  "factor_confidence": 1.0,
  "risk_level": "very high",
  "score": 85,
  "rationale": ["smoking", "high sugar diet", "low physical activity", "chronic stress"],
  "recommendations": ["Quit smoking", "Improve your diet", "Increase physical activity"],
  "detailed_recommendations": [
    {
      "title": "Quit smoking",
      "description": "Consider nicotine replacement therapy...",
      "icon": "🚭",
      "priority": "high"
    }
  ],
  "warnings": []
}
```

## Input Fields

| Field | Type | Values | Required |
|-------|------|--------|----------|
| age | number | 0-150 | ✓ |
| smoker | boolean | true/false | ✓ |
| exercise | string | rarely, sometimes, regularly | ✓ |
| diet | string | high sugar, balanced, healthy | ✓ |
| alcohol | string | rarely, moderate, heavy | |
| sleep | number | 0-24 (hours) | |
| stress | string | low, moderate, high | |
| bmi | number | 10-100 | |

## Risk Levels

| Level | Score Range | Description |
|-------|-------------|-------------|
| Low | 0-25 | Minimal health risks identified |
| Moderate | 26-50 | Some areas for improvement |
| High | 51-75 | Multiple risk factors present |
| Very High | 76-100 | Significant health risks identified |

## Guardrails

The system includes comprehensive validation:

- **Input Validation**: Null, empty, invalid JSON detection
- **Profile Completeness**: Minimum 50% of core fields required
- **Confidence Threshold**: 30% minimum parsing confidence
- **Range Validation**: Automatic clamping of out-of-range values
- **Type Correction**: String-to-boolean/number conversion
- **OCR Quality**: Artifact detection and keyword validation

## Error Responses

```json
{
  "status": "incomplete_profile",
  "reason": ">50% fields missing",
  "missing_fields": ["smoker", "exercise", "diet"],
  "partial_parse": {
    "answers": { "age": 42 },
    "confidence": 0.85
  },
  "timestamp": "2026-01-11T00:00:00.000Z"
}
```

## OCR Support

The frontend uses Tesseract.js for client-side OCR. Upload an image with survey data:

```
Age: 42
Smoker: Yes
Exercise: Rarely
Diet: High sugar
```

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: React 18, Vite
- **OCR**: Tesseract.js
- **Styling**: CSS with glassmorphism design

## License

MIT
