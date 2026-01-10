/**
 * Guardrails Service
 * Handles validation, exit conditions, and edge case handling for incomplete/invalid data
 */

import { CORE_FIELDS } from './surveyParser.js';

// Configuration constants
const CONFIG = {
    MIN_CONFIDENCE: 0.3,
    MAX_MISSING_PERCENTAGE: 0.5,
    AGE_MIN: 0,
    AGE_MAX: 150,
    BMI_MIN: 10,
    BMI_MAX: 100,
    SLEEP_MIN: 0,
    SLEEP_MAX: 24
};

/**
 * Check if profile is complete enough to process
 */
export function checkProfileCompleteness(parseResult) {
    const { answers, missing_fields, confidence } = parseResult;

    // Check for parsing errors
    if (parseResult.error) {
        return {
            isValid: false,
            status: 'parse_error',
            reason: parseResult.error
        };
    }

    // Check confidence threshold
    if (confidence < CONFIG.MIN_CONFIDENCE) {
        return {
            isValid: false,
            status: 'low_confidence',
            reason: `Confidence too low (${(confidence * 100).toFixed(0)}%). Cannot reliably process input.`
        };
    }

    // Check missing fields percentage
    const missingPercentage = missing_fields.length / CORE_FIELDS.length;

    if (missingPercentage > CONFIG.MAX_MISSING_PERCENTAGE) {
        return {
            isValid: false,
            status: 'incomplete_profile',
            reason: `>${Math.round(CONFIG.MAX_MISSING_PERCENTAGE * 100)}% fields missing`,
            missing_fields
        };
    }

    // Check if we have at least some meaningful data
    const answeredFields = Object.keys(answers).filter(
        k => answers[k] !== null && answers[k] !== undefined
    );

    if (answeredFields.length === 0) {
        return {
            isValid: false,
            status: 'no_data',
            reason: 'No valid survey data found'
        };
    }

    // Profile is valid
    return {
        isValid: true,
        status: 'ok',
        warnings: generateWarnings(parseResult)
    };
}

/**
 * Generate warnings for partially complete data
 */
function generateWarnings(parseResult) {
    const warnings = [];
    const { missing_fields, confidence, answers } = parseResult;

    if (missing_fields && missing_fields.length > 0) {
        warnings.push({
            type: 'missing_fields',
            message: `Some fields are missing: ${missing_fields.join(', ')}. Results may be less accurate.`,
            fields: missing_fields
        });
    }

    if (confidence < 0.8) {
        warnings.push({
            type: 'low_confidence',
            message: 'Some answers could not be parsed with high confidence.',
            confidence
        });
    }

    // Check for edge case values
    if (answers) {
        if (answers.age !== undefined && (answers.age < 18 || answers.age > 100)) {
            warnings.push({
                type: 'unusual_value',
                message: `Age value (${answers.age}) is outside typical range (18-100).`,
                field: 'age'
            });
        }

        if (answers.bmi !== undefined && (answers.bmi < 15 || answers.bmi > 50)) {
            warnings.push({
                type: 'unusual_value',
                message: `BMI value (${answers.bmi}) is outside typical range (15-50).`,
                field: 'bmi'
            });
        }
    }

    return warnings;
}

/**
 * Validate input before processing
 */
export function validateInput(input) {
    // Null/undefined check
    if (input === null || input === undefined) {
        return {
            isValid: false,
            status: 'invalid_input',
            reason: 'Input is null or undefined'
        };
    }

    // Empty string check
    if (typeof input === 'string') {
        const trimmed = input.trim();
        if (trimmed.length === 0) {
            return {
                isValid: false,
                status: 'empty_input',
                reason: 'Input is empty'
            };
        }

        // Check for obviously invalid JSON
        if (trimmed.startsWith('{')) {
            try {
                JSON.parse(trimmed);
            } catch (e) {
                return {
                    isValid: false,
                    status: 'invalid_json',
                    reason: `Invalid JSON format: ${e.message}`
                };
            }
        }
    }

    // Empty object check
    if (typeof input === 'object' && !Array.isArray(input)) {
        if (Object.keys(input).length === 0) {
            return {
                isValid: false,
                status: 'empty_input',
                reason: 'Input object is empty'
            };
        }
    }

    // Array check (not valid input type)
    if (Array.isArray(input)) {
        return {
            isValid: false,
            status: 'invalid_input',
            reason: 'Input cannot be an array. Expected object or string.'
        };
    }

    return { isValid: true };
}

/**
 * Validate and correct answer ranges (edge case handling)
 */
export function validateAnswerRanges(answers) {
    const corrections = [];
    const correctedAnswers = { ...answers };

    // Age validation
    if (correctedAnswers.age !== undefined && correctedAnswers.age !== null) {
        if (typeof correctedAnswers.age !== 'number') {
            correctedAnswers.age = parseInt(correctedAnswers.age, 10) || null;
            if (correctedAnswers.age !== null) {
                corrections.push({ field: 'age', action: 'type_conversion', original: answers.age });
            }
        }
        if (correctedAnswers.age !== null) {
            if (correctedAnswers.age < CONFIG.AGE_MIN) {
                corrections.push({ field: 'age', action: 'clamped_to_min', original: correctedAnswers.age });
                correctedAnswers.age = CONFIG.AGE_MIN;
            } else if (correctedAnswers.age > CONFIG.AGE_MAX) {
                corrections.push({ field: 'age', action: 'clamped_to_max', original: correctedAnswers.age });
                correctedAnswers.age = CONFIG.AGE_MAX;
            }
        }
    }

    // BMI validation
    if (correctedAnswers.bmi !== undefined && correctedAnswers.bmi !== null) {
        if (typeof correctedAnswers.bmi !== 'number') {
            correctedAnswers.bmi = parseFloat(correctedAnswers.bmi) || null;
            if (correctedAnswers.bmi !== null) {
                corrections.push({ field: 'bmi', action: 'type_conversion', original: answers.bmi });
            }
        }
        if (correctedAnswers.bmi !== null) {
            if (correctedAnswers.bmi < CONFIG.BMI_MIN) {
                corrections.push({ field: 'bmi', action: 'clamped_to_min', original: correctedAnswers.bmi });
                correctedAnswers.bmi = CONFIG.BMI_MIN;
            } else if (correctedAnswers.bmi > CONFIG.BMI_MAX) {
                corrections.push({ field: 'bmi', action: 'clamped_to_max', original: correctedAnswers.bmi });
                correctedAnswers.bmi = CONFIG.BMI_MAX;
            }
        }
    }

    // Sleep validation
    if (correctedAnswers.sleep !== undefined && correctedAnswers.sleep !== null) {
        if (typeof correctedAnswers.sleep === 'number') {
            if (correctedAnswers.sleep < CONFIG.SLEEP_MIN) {
                corrections.push({ field: 'sleep', action: 'clamped_to_min', original: correctedAnswers.sleep });
                correctedAnswers.sleep = CONFIG.SLEEP_MIN;
            } else if (correctedAnswers.sleep > CONFIG.SLEEP_MAX) {
                corrections.push({ field: 'sleep', action: 'clamped_to_max', original: correctedAnswers.sleep });
                correctedAnswers.sleep = CONFIG.SLEEP_MAX;
            }
        }
    }

    // Normalize boolean smoker if string
    if (correctedAnswers.smoker !== undefined && typeof correctedAnswers.smoker === 'string') {
        const lower = correctedAnswers.smoker.toLowerCase();
        if (['yes', 'true', '1', 'y'].includes(lower)) {
            correctedAnswers.smoker = true;
            corrections.push({ field: 'smoker', action: 'normalized_to_boolean', original: answers.smoker });
        } else if (['no', 'false', '0', 'n'].includes(lower)) {
            correctedAnswers.smoker = false;
            corrections.push({ field: 'smoker', action: 'normalized_to_boolean', original: answers.smoker });
        }
    }

    return {
        isValid: corrections.length === 0,
        correctedAnswers,
        corrections
    };
}

/**
 * Validate OCR text quality
 */
export function validateOcrText(text) {
    const warnings = [];

    if (!text || typeof text !== 'string') {
        return {
            isValid: false,
            reason: 'OCR text is empty or invalid'
        };
    }

    const trimmed = text.trim();

    // Check minimum length
    if (trimmed.length < 10) {
        return {
            isValid: false,
            reason: 'OCR text is too short to contain valid survey data'
        };
    }

    // Check for common OCR artifacts
    const artifactPatterns = [
        /[^\x00-\x7F]{5,}/,  // Many non-ASCII characters in a row
        /(.)\1{5,}/,         // Same character repeated many times
    ];

    for (const pattern of artifactPatterns) {
        if (pattern.test(trimmed)) {
            warnings.push({
                type: 'ocr_artifacts',
                message: 'OCR text may contain recognition artifacts'
            });
            break;
        }
    }

    // Check for recognizable survey keywords
    const surveyKeywords = ['age', 'smoker', 'smoking', 'exercise', 'diet', 'sleep', 'stress'];
    const foundKeywords = surveyKeywords.filter(kw => trimmed.toLowerCase().includes(kw));

    if (foundKeywords.length === 0) {
        warnings.push({
            type: 'no_survey_keywords',
            message: 'OCR text does not contain recognizable survey fields'
        });
    }

    return {
        isValid: true,
        warnings,
        keywordsFound: foundKeywords
    };
}

export { CONFIG };
