/**
 * Analysis Pipeline
 * Orchestrates the chained processing of survey data with validation at each step
 */

import { parseSurvey } from './surveyParser.js';
import { extractFactors } from './factorExtractor.js';
import { classifyRisk } from './riskClassifier.js';
import { generateRecommendations } from './recommendationEngine.js';
import { checkProfileCompleteness, validateInput, validateAnswerRanges } from './guardrails.js';
import { validateSchema, SCHEMAS, createErrorResponse, createSuccessResponse } from './schemaValidator.js';

/**
 * Pipeline step result wrapper
 */
class StepResult {
    constructor(step, success, data, error = null) {
        this.step = step;
        this.success = success;
        this.data = data;
        this.error = error;
        this.timestamp = new Date().toISOString();
    }

    static success(step, data) {
        return new StepResult(step, true, data);
    }

    static failure(step, error, partialData = null) {
        return new StepResult(step, false, partialData, error);
    }
}

/**
 * Run the complete analysis pipeline with validation at each step
 */
export async function runAnalysisPipeline(input, options = {}) {
    const { isOcr = false, validateSchemas = true, stopOnWarning = false } = options;

    const pipelineResult = {
        success: false,
        steps: [],
        data: null,
        error: null
    };

    try {
        // Step 0: Input Validation
        const inputValidation = validateInput(input);
        if (!inputValidation.isValid) {
            pipelineResult.steps.push(StepResult.failure('input_validation', inputValidation.reason));
            pipelineResult.error = createErrorResponse(inputValidation.status, inputValidation.reason);
            return pipelineResult;
        }
        pipelineResult.steps.push(StepResult.success('input_validation', { valid: true }));

        // Step 1: Parse Survey
        const parseResult = parseSurvey(input, isOcr);

        if (validateSchemas) {
            const parseValidation = validateSchema(parseResult, SCHEMAS.parseResponse);
            if (!parseValidation.isValid) {
                console.warn('Parse result schema validation warnings:', parseValidation.errors);
            }
        }

        // Check completeness guardrails
        const completenessCheck = checkProfileCompleteness(parseResult);
        if (!completenessCheck.isValid) {
            pipelineResult.steps.push(StepResult.failure('parse', completenessCheck.reason, parseResult));
            pipelineResult.error = createErrorResponse(
                completenessCheck.status,
                completenessCheck.reason,
                {
                    missing_fields: completenessCheck.missing_fields || parseResult.missing_fields,
                    partial_parse: {
                        answers: parseResult.answers,
                        confidence: parseResult.confidence
                    }
                }
            );
            return pipelineResult;
        }

        // Validate answer ranges
        const rangeValidation = validateAnswerRanges(parseResult.answers);
        if (!rangeValidation.isValid) {
            parseResult.answers = rangeValidation.correctedAnswers;
            parseResult.corrections = rangeValidation.corrections;
        }

        pipelineResult.steps.push(StepResult.success('parse', parseResult));

        // Step 2: Extract Factors
        const factorResult = extractFactors(parseResult.answers);

        if (validateSchemas) {
            const factorValidation = validateSchema(factorResult, SCHEMAS.factorResponse);
            if (!factorValidation.isValid) {
                console.warn('Factor result schema validation warnings:', factorValidation.errors);
            }
        }

        pipelineResult.steps.push(StepResult.success('factors', factorResult));

        // Step 3: Classify Risk
        const riskResult = classifyRisk(factorResult.factors, parseResult.answers);

        if (validateSchemas) {
            const riskValidation = validateSchema(riskResult, SCHEMAS.riskResponse);
            if (!riskValidation.isValid) {
                console.warn('Risk result schema validation warnings:', riskValidation.errors);
            }
        }

        pipelineResult.steps.push(StepResult.success('risk', riskResult));

        // Step 4: Generate Recommendations
        const recResult = generateRecommendations(factorResult.factors, riskResult.risk_level);
        pipelineResult.steps.push(StepResult.success('recommendations', recResult));

        // Compile final response
        const finalData = {
            // Parse results
            answers: parseResult.answers,
            missing_fields: parseResult.missing_fields,
            parse_confidence: parseResult.confidence,
            corrections: parseResult.corrections || [],

            // Factor results
            factors: factorResult.factors,
            factor_confidence: factorResult.confidence,
            factor_details: factorResult.factor_details,

            // Risk classification
            risk_level: riskResult.risk_level,
            score: riskResult.score,
            rationale: riskResult.rationale,

            // Recommendations
            recommendations: recResult.recommendations,
            detailed_recommendations: recResult.detailed_recommendations,

            // Metadata
            warnings: completenessCheck.warnings || [],
            pipeline_steps: pipelineResult.steps.length
        };

        pipelineResult.success = true;
        pipelineResult.data = createSuccessResponse(finalData, 'analysisResponse');

    } catch (error) {
        pipelineResult.error = createErrorResponse('pipeline_error', error.message);
        pipelineResult.steps.push(StepResult.failure('unknown', error.message));
    }

    return pipelineResult;
}

/**
 * Run a single step of the pipeline
 */
export function runPipelineStep(stepName, input, options = {}) {
    try {
        switch (stepName) {
            case 'parse': {
                const result = parseSurvey(input, options.isOcr || false);
                return StepResult.success('parse', result);
            }
            case 'factors': {
                const result = extractFactors(input);
                return StepResult.success('factors', result);
            }
            case 'risk': {
                const { factors, answers } = input;
                const result = classifyRisk(factors, answers);
                return StepResult.success('risk', result);
            }
            case 'recommendations': {
                const { factors, riskLevel } = input;
                const result = generateRecommendations(factors, riskLevel);
                return StepResult.success('recommendations', result);
            }
            default:
                return StepResult.failure(stepName, `Unknown pipeline step: ${stepName}`);
        }
    } catch (error) {
        return StepResult.failure(stepName, error.message);
    }
}
