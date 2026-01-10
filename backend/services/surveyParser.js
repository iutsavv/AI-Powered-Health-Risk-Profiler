/**
 * Survey Parser Service
 * Parses text and OCR inputs into structured survey data
 */

// Expected survey fields
const EXPECTED_FIELDS = ['age', 'smoker', 'exercise', 'diet', 'alcohol', 'sleep', 'stress', 'bmi'];
const CORE_FIELDS = ['age', 'smoker', 'exercise', 'diet'];

// Normalize boolean values
function normalizeBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        if (['yes', 'true', 'y', '1', 'yeah', 'yep'].includes(lower)) return true;
        if (['no', 'false', 'n', '0', 'nope', 'never'].includes(lower)) return false;
    }
    return null;
}

// Normalize exercise level
function normalizeExercise(value) {
    if (!value) return null;
    const lower = String(value).toLowerCase().trim();

    if (['never', 'none', 'rarely', 'sedentary', 'no'].includes(lower)) return 'rarely';
    if (['sometimes', 'occasional', 'moderate', '1-2 times', '1-2x', 'weekly'].includes(lower)) return 'sometimes';
    if (['often', 'regular', 'regularly', 'frequent', '3-4 times', '3-4x', 'daily'].includes(lower)) return 'regularly';

    return lower;
}

// Normalize diet type
function normalizeDiet(value) {
    if (!value) return null;
    const lower = String(value).toLowerCase().trim();

    if (lower.includes('high sugar') || lower.includes('junk') || lower.includes('fast food') || lower.includes('unhealthy')) {
        return 'high sugar';
    }
    if (lower.includes('balanced') || lower.includes('normal') || lower.includes('mixed')) {
        return 'balanced';
    }
    if (lower.includes('healthy') || lower.includes('vegetable') || lower.includes('fruit') || lower.includes('whole')) {
        return 'healthy';
    }

    return lower;
}

// Parse JSON input
function parseJsonInput(input) {
    const answers = {};
    const rawAnswers = typeof input === 'string' ? JSON.parse(input) : input;

    // Normalize each field
    if (rawAnswers.age !== undefined) {
        answers.age = parseInt(rawAnswers.age, 10) || null;
    }

    if (rawAnswers.smoker !== undefined) {
        answers.smoker = normalizeBoolean(rawAnswers.smoker);
    }

    if (rawAnswers.exercise !== undefined) {
        answers.exercise = normalizeExercise(rawAnswers.exercise);
    }

    if (rawAnswers.diet !== undefined) {
        answers.diet = normalizeDiet(rawAnswers.diet);
    }

    if (rawAnswers.alcohol !== undefined) {
        const val = String(rawAnswers.alcohol).toLowerCase();
        if (val.includes('heavy') || val.includes('frequent')) answers.alcohol = 'heavy';
        else if (val.includes('moderate') || val.includes('social')) answers.alcohol = 'moderate';
        else if (val.includes('rarely') || val.includes('never') || val.includes('none')) answers.alcohol = 'rarely';
        else answers.alcohol = val;
    }

    if (rawAnswers.sleep !== undefined) {
        answers.sleep = parseInt(rawAnswers.sleep, 10) || rawAnswers.sleep;
    }

    if (rawAnswers.stress !== undefined) {
        answers.stress = String(rawAnswers.stress).toLowerCase();
    }

    if (rawAnswers.bmi !== undefined) {
        answers.bmi = parseFloat(rawAnswers.bmi) || null;
    }

    return answers;
}

// Parse OCR text input
function parseOcrText(text) {
    const answers = {};
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    for (const line of lines) {
        const lower = line.toLowerCase();

        // Parse age
        const ageMatch = lower.match(/age[:\s]+(\d+)/);
        if (ageMatch) {
            answers.age = parseInt(ageMatch[1], 10);
        }

        // Parse smoker
        if (lower.includes('smoker') || lower.includes('smoking')) {
            const value = line.split(/[:\s]+/).pop();
            answers.smoker = normalizeBoolean(value);
        }

        // Parse exercise
        if (lower.includes('exercise') || lower.includes('activity') || lower.includes('workout')) {
            const value = line.split(/[:\s]+/).pop();
            answers.exercise = normalizeExercise(value);
        }

        // Parse diet
        if (lower.includes('diet') || lower.includes('eating') || lower.includes('food')) {
            const parts = line.split(/[:\s]+/);
            const value = parts.slice(1).join(' ');
            answers.diet = normalizeDiet(value) || normalizeDiet(parts.pop());
        }

        // Parse alcohol
        if (lower.includes('alcohol') || lower.includes('drinking')) {
            const value = line.split(/[:\s]+/).pop();
            answers.alcohol = value.toLowerCase();
        }

        // Parse sleep
        const sleepMatch = lower.match(/sleep[:\s]+(\d+)/);
        if (sleepMatch) {
            answers.sleep = parseInt(sleepMatch[1], 10);
        }

        // Parse stress
        if (lower.includes('stress')) {
            const value = line.split(/[:\s]+/).pop();
            answers.stress = value.toLowerCase();
        }

        // Parse BMI
        const bmiMatch = lower.match(/bmi[:\s]+([\d.]+)/);
        if (bmiMatch) {
            answers.bmi = parseFloat(bmiMatch[1]);
        }
    }

    return answers;
}

// Calculate confidence score based on data quality
function calculateConfidence(answers, isOcr = false) {
    let confidence = 1.0;
    const parsedFields = Object.keys(answers).filter(k => answers[k] !== null && answers[k] !== undefined);

    // OCR parsing has inherent uncertainty
    if (isOcr) confidence -= 0.1;

    // Check field completeness
    const coreFieldsPresent = CORE_FIELDS.filter(f => parsedFields.includes(f)).length;
    confidence -= (CORE_FIELDS.length - coreFieldsPresent) * 0.05;

    // Check for any null values that couldn't be parsed
    const nullCount = Object.values(answers).filter(v => v === null).length;
    confidence -= nullCount * 0.02;

    return Math.max(0, Math.min(1, parseFloat(confidence.toFixed(2))));
}

// Get missing fields
function getMissingFields(answers) {
    const missing = [];

    for (const field of CORE_FIELDS) {
        if (answers[field] === undefined || answers[field] === null) {
            missing.push(field);
        }
    }

    return missing;
}

/**
 * Main parse function
 * @param {string|object} input - Survey input (JSON string, object, or OCR text)
 * @param {boolean} isOcr - Whether input is from OCR
 * @returns {object} Parsed survey data with confidence and missing fields
 */
export function parseSurvey(input, isOcr = false) {
    let answers;

    try {
        if (isOcr) {
            answers = parseOcrText(input);
        } else if (typeof input === 'string') {
            // Try JSON parse first
            try {
                answers = parseJsonInput(input);
            } catch {
                // Fallback to OCR-style parsing
                answers = parseOcrText(input);
            }
        } else {
            answers = parseJsonInput(input);
        }
    } catch (error) {
        return {
            answers: {},
            missing_fields: CORE_FIELDS,
            confidence: 0,
            error: 'Failed to parse input: ' + error.message
        };
    }

    const missingFields = getMissingFields(answers);
    const confidence = calculateConfidence(answers, isOcr);

    return {
        answers,
        missing_fields: missingFields,
        confidence
    };
}

export { EXPECTED_FIELDS, CORE_FIELDS };
