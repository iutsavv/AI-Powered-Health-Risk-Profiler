/**
 * Health Risk Analysis Service - Backend Server
 * Enhanced with JSON schema validation, pipeline processing, and comprehensive error handling
 */

import express from 'express';
import cors from 'cors';
import { parseSurvey, CORE_FIELDS, EXPECTED_FIELDS } from './services/surveyParser.js';
import { extractFactors } from './services/factorExtractor.js';
import { classifyRisk } from './services/riskClassifier.js';
import { generateRecommendations } from './services/recommendationEngine.js';
import { checkProfileCompleteness, validateInput, validateAnswerRanges, validateOcrText } from './services/guardrails.js';
import { validateSchema, SCHEMAS, createErrorResponse, createSuccessResponse } from './services/schemaValidator.js';
import { runAnalysisPipeline, runPipelineStep } from './services/pipeline.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for production and development
const corsOptions = {
    origin: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',')
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.1.0',
        features: ['schema_validation', 'pipeline_processing', 'ocr_support', 'guardrails']
    });
});

/**
 * Main analysis endpoint - uses the full pipeline
 */
app.post('/api/analyze', asyncHandler(async (req, res) => {
    const { input, isOcr = false, options = {} } = req.body;

    // Run the full pipeline
    const pipelineResult = await runAnalysisPipeline(input, {
        isOcr,
        validateSchemas: options.validateSchemas !== false,
        stopOnWarning: options.stopOnWarning || false
    });

    if (!pipelineResult.success) {
        const statusCode = pipelineResult.error?.status === 'invalid_input' ? 400 : 200;
        return res.status(statusCode).json(pipelineResult.error);
    }

    res.json(pipelineResult.data);
}));

/**
 * Legacy analysis endpoint (for backwards compatibility)
 */
app.post('/api/analyze/legacy', asyncHandler(async (req, res) => {
    const { input, isOcr = false } = req.body;

    // Step 0: Validate raw input
    const inputValidation = validateInput(input);
    if (!inputValidation.isValid) {
        return res.status(400).json(createErrorResponse(inputValidation.status, inputValidation.reason));
    }

    // OCR text validation if applicable
    if (isOcr && typeof input === 'string') {
        const ocrValidation = validateOcrText(input);
        if (!ocrValidation.isValid) {
            return res.status(400).json(createErrorResponse('invalid_ocr', ocrValidation.reason));
        }
    }

    // Step 1: Parse Survey
    const parseResult = parseSurvey(input, isOcr);

    // Check guardrails
    const completenessCheck = checkProfileCompleteness(parseResult);
    if (!completenessCheck.isValid) {
        return res.json(createErrorResponse(
            completenessCheck.status,
            completenessCheck.reason,
            {
                missing_fields: completenessCheck.missing_fields || parseResult.missing_fields,
                partial_parse: {
                    answers: parseResult.answers,
                    confidence: parseResult.confidence
                }
            }
        ));
    }

    // Validate and correct answer ranges
    const rangeValidation = validateAnswerRanges(parseResult.answers);
    const answers = rangeValidation.correctedAnswers;

    // Step 2: Extract Factors
    const factorResult = extractFactors(answers);

    // Step 3: Classify Risk
    const riskResult = classifyRisk(factorResult.factors, answers);

    // Step 4: Generate Recommendations
    const recResult = generateRecommendations(factorResult.factors, riskResult.risk_level);

    // Combine all results
    const response = createSuccessResponse({
        answers,
        missing_fields: parseResult.missing_fields,
        parse_confidence: parseResult.confidence,
        corrections: rangeValidation.corrections,
        factors: factorResult.factors,
        factor_confidence: factorResult.confidence,
        risk_level: riskResult.risk_level,
        score: riskResult.score,
        rationale: riskResult.rationale,
        recommendations: recResult.recommendations,
        detailed_recommendations: recResult.detailed_recommendations,
        warnings: completenessCheck.warnings || []
    }, 'analysisResponse');

    res.json(response);
}));

/**
 * Step-by-step endpoints for debugging/testing
 */

// Step 1: Parse only
app.post('/api/analyze/parse', asyncHandler(async (req, res) => {
    const { input, isOcr = false } = req.body;

    const inputValidation = validateInput(input);
    if (!inputValidation.isValid) {
        return res.status(400).json(createErrorResponse(inputValidation.status, inputValidation.reason));
    }

    // OCR validation
    if (isOcr && typeof input === 'string') {
        const ocrValidation = validateOcrText(input);
        if (!ocrValidation.isValid) {
            return res.status(400).json(createErrorResponse('invalid_ocr', ocrValidation.reason));
        }
    }

    const result = parseSurvey(input, isOcr);

    // Validate schema
    const schemaValidation = validateSchema(result, SCHEMAS.parseResponse);

    res.json({
        ...result,
        schema_valid: schemaValidation.isValid,
        schema_errors: schemaValidation.errors
    });
}));

// Step 2: Extract factors
app.post('/api/analyze/factors', asyncHandler(async (req, res) => {
    const { answers } = req.body;

    if (!answers || typeof answers !== 'object') {
        return res.status(400).json(createErrorResponse('invalid_input', 'answers must be an object'));
    }

    const result = extractFactors(answers);

    const schemaValidation = validateSchema(result, SCHEMAS.factorResponse);

    res.json({
        ...result,
        schema_valid: schemaValidation.isValid,
        schema_errors: schemaValidation.errors
    });
}));

// Step 3: Classify risk
app.post('/api/analyze/risk', asyncHandler(async (req, res) => {
    const { factors, answers } = req.body;

    if (!Array.isArray(factors)) {
        return res.status(400).json(createErrorResponse('invalid_input', 'factors must be an array'));
    }

    const result = classifyRisk(factors, answers || {});

    const schemaValidation = validateSchema(result, SCHEMAS.riskResponse);

    res.json({
        ...result,
        schema_valid: schemaValidation.isValid,
        schema_errors: schemaValidation.errors
    });
}));

// Step 4: Get recommendations
app.post('/api/analyze/recommendations', asyncHandler(async (req, res) => {
    const { factors, riskLevel } = req.body;

    if (!Array.isArray(factors)) {
        return res.status(400).json(createErrorResponse('invalid_input', 'factors must be an array'));
    }

    const result = generateRecommendations(factors, riskLevel || 'low');

    res.json({
        ...result,
        status: 'ok'
    });
}));

// Validate input against schema
app.post('/api/validate', (req, res) => {
    const { data, schema } = req.body;

    const schemaObj = SCHEMAS[schema];
    if (!schemaObj) {
        return res.status(400).json(createErrorResponse('invalid_schema', `Unknown schema: ${schema}`));
    }

    const result = validateSchema(data, schemaObj);
    res.json({
        isValid: result.isValid,
        errors: result.errors
    });
});

// Get schemas
app.get('/api/schemas', (req, res) => {
    res.json({
        available_schemas: Object.keys(SCHEMAS),
        schemas: SCHEMAS
    });
});

// Get expected fields
app.get('/api/fields', (req, res) => {
    res.json({
        core_fields: CORE_FIELDS,
        all_fields: EXPECTED_FIELDS,
        field_descriptions: {
            age: { type: 'number', description: 'Age in years', range: '0-150' },
            smoker: { type: 'boolean', description: 'Whether the person smokes' },
            exercise: { type: 'string', description: 'Exercise frequency', values: ['rarely', 'sometimes', 'regularly'] },
            diet: { type: 'string', description: 'Diet quality', values: ['high sugar', 'balanced', 'healthy'] },
            alcohol: { type: 'string', description: 'Alcohol consumption', values: ['rarely', 'moderate', 'heavy'] },
            sleep: { type: 'number', description: 'Sleep hours per night', range: '0-24' },
            stress: { type: 'string', description: 'Stress level', values: ['low', 'moderate', 'high'] },
            bmi: { type: 'number', description: 'Body Mass Index', range: '10-100' }
        }
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json(createErrorResponse(
        'internal_error',
        process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    ));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json(createErrorResponse('not_found', `Endpoint ${req.method} ${req.path} not found`));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🏥 Health Risk Analysis API v1.1.0`);
    console.log(`   Running on http://localhost:${PORT}\n`);
    console.log(`📊 Endpoints:`);
    console.log(`   POST /api/analyze              - Full analysis (pipeline)`);
    console.log(`   POST /api/analyze/legacy       - Legacy single-pass analysis`);
    console.log(`   POST /api/analyze/parse        - Step 1: Parse survey`);
    console.log(`   POST /api/analyze/factors      - Step 2: Extract factors`);
    console.log(`   POST /api/analyze/risk         - Step 3: Classify risk`);
    console.log(`   POST /api/analyze/recommendations - Step 4: Get recommendations`);
    console.log(`   POST /api/validate             - Validate data against schema`);
    console.log(`   GET  /api/schemas              - Get available schemas`);
    console.log(`   GET  /api/fields               - Get expected fields`);
    console.log(`   GET  /api/health               - Health check\n`);
});
