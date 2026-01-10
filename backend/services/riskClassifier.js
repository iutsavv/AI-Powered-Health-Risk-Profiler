/**
 * Risk Classifier Service
 * Computes risk level using scoring logic
 */

// Scoring weights for each factor
const FACTOR_SCORES = {
    'smoking': 25,
    'poor diet': 18,
    'low exercise': 15,
    'excessive alcohol': 20,
    'poor sleep': 10,
    'high stress': 12,
    'obesity': 20,
    'overweight': 10,
    'advanced age': 8,
    'middle age': 4
};

// Age-based base risk adjustments
function getAgeBaseRisk(age) {
    if (age === undefined || age === null) return 0;
    if (age < 30) return 0;
    if (age < 40) return 5;
    if (age < 50) return 10;
    if (age < 60) return 15;
    if (age < 70) return 20;
    return 25;
}

// Generate human-readable rationale
function generateRationale(factors, answers) {
    const rationale = [];

    for (const factor of factors) {
        switch (factor) {
            case 'smoking':
                rationale.push('smoking');
                break;
            case 'poor diet':
                rationale.push(answers.diet ? `${answers.diet} diet` : 'poor dietary habits');
                break;
            case 'low exercise':
                rationale.push(answers.exercise === 'rarely' ? 'low physical activity' : 'sedentary lifestyle');
                break;
            case 'excessive alcohol':
                rationale.push('high alcohol consumption');
                break;
            case 'poor sleep':
                if (typeof answers.sleep === 'number') {
                    rationale.push(`inadequate sleep (${answers.sleep} hours)`);
                } else {
                    rationale.push('poor sleep quality');
                }
                break;
            case 'high stress':
                rationale.push('chronic stress');
                break;
            case 'obesity':
                rationale.push(answers.bmi ? `obesity (BMI: ${answers.bmi})` : 'obesity');
                break;
            case 'overweight':
                rationale.push(answers.bmi ? `overweight (BMI: ${answers.bmi})` : 'overweight');
                break;
            case 'advanced age':
                rationale.push(`age factor (${answers.age} years)`);
                break;
            case 'middle age':
                // Don't include middle age in rationale as it's less significant
                break;
            default:
                rationale.push(factor);
        }
    }

    return rationale;
}

// Determine risk level from score
function getRiskLevel(score) {
    if (score < 25) return 'low';
    if (score < 50) return 'moderate';
    if (score < 75) return 'high';
    return 'very high';
}

/**
 * Classify risk based on factors and answers
 * @param {string[]} factors - Extracted risk factors
 * @param {object} answers - Original survey answers
 * @returns {object} Risk classification with score and rationale
 */
export function classifyRisk(factors, answers = {}) {
    let score = 0;

    // Add base risk from age
    score += getAgeBaseRisk(answers.age);

    // Add factor-based scores
    for (const factor of factors) {
        const factorScore = FACTOR_SCORES[factor] || 0;
        score += factorScore;
    }

    // Cap score at 100
    score = Math.min(100, score);

    const riskLevel = getRiskLevel(score);
    const rationale = generateRationale(factors, answers);

    return {
        risk_level: riskLevel,
        score: Math.round(score),
        rationale
    };
}

export { FACTOR_SCORES };
