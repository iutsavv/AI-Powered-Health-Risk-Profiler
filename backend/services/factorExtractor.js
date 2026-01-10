/**
 * Factor Extractor Service
 * Converts survey answers into risk factors
 */

// Factor definitions with extraction rules
const FACTOR_RULES = {
    smoking: {
        check: (answers) => answers.smoker === true,
        label: 'smoking',
        weight: 1.0
    },
    poor_diet: {
        check: (answers) => {
            const diet = answers.diet?.toLowerCase();
            return diet === 'high sugar' || diet === 'junk' || diet === 'fast food' || diet === 'unhealthy';
        },
        label: 'poor diet',
        weight: 0.9
    },
    low_exercise: {
        check: (answers) => {
            const exercise = answers.exercise?.toLowerCase();
            return exercise === 'rarely' || exercise === 'never' || exercise === 'sedentary' || exercise === 'none';
        },
        label: 'low exercise',
        weight: 0.85
    },
    excessive_alcohol: {
        check: (answers) => {
            const alcohol = answers.alcohol?.toLowerCase();
            return alcohol === 'heavy' || alcohol === 'frequent' || alcohol === 'daily';
        },
        label: 'excessive alcohol',
        weight: 0.8
    },
    poor_sleep: {
        check: (answers) => {
            if (typeof answers.sleep === 'number') {
                return answers.sleep < 6 || answers.sleep > 9;
            }
            const sleep = answers.sleep?.toLowerCase();
            return sleep === 'poor' || sleep === 'bad' || sleep === 'irregular';
        },
        label: 'poor sleep',
        weight: 0.7
    },
    high_stress: {
        check: (answers) => {
            const stress = answers.stress?.toLowerCase();
            return stress === 'high' || stress === 'severe' || stress === 'chronic';
        },
        label: 'high stress',
        weight: 0.75
    },
    obesity: {
        check: (answers) => {
            if (typeof answers.bmi === 'number') {
                return answers.bmi >= 30;
            }
            return false;
        },
        label: 'obesity',
        weight: 0.85
    },
    overweight: {
        check: (answers) => {
            if (typeof answers.bmi === 'number') {
                return answers.bmi >= 25 && answers.bmi < 30;
            }
            return false;
        },
        label: 'overweight',
        weight: 0.6
    },
    advanced_age: {
        check: (answers) => {
            if (typeof answers.age === 'number') {
                return answers.age >= 60;
            }
            return false;
        },
        label: 'advanced age',
        weight: 0.5
    },
    middle_age: {
        check: (answers) => {
            if (typeof answers.age === 'number') {
                return answers.age >= 40 && answers.age < 60;
            }
            return false;
        },
        label: 'middle age',
        weight: 0.3
    }
};

// Calculate confidence based on data availability
function calculateFactorConfidence(answers, extractedFactors) {
    let confidence = 1.0;

    // Reduce confidence for each undefined/null core field
    const coreFields = ['smoker', 'diet', 'exercise'];
    for (const field of coreFields) {
        if (answers[field] === undefined || answers[field] === null) {
            confidence -= 0.1;
        }
    }

    // Higher confidence if we extracted more factors (more data available)
    if (extractedFactors.length === 0 && Object.keys(answers).length < 3) {
        confidence -= 0.2;
    }

    return Math.max(0, Math.min(1, parseFloat(confidence.toFixed(2))));
}

/**
 * Extract risk factors from survey answers
 * @param {object} answers - Parsed survey answers
 * @returns {object} Extracted factors with confidence
 */
export function extractFactors(answers) {
    const factors = [];
    const factorDetails = [];

    for (const [key, rule] of Object.entries(FACTOR_RULES)) {
        try {
            if (rule.check(answers)) {
                factors.push(rule.label);
                factorDetails.push({
                    id: key,
                    label: rule.label,
                    weight: rule.weight
                });
            }
        } catch (e) {
            // Skip factor if check fails
            continue;
        }
    }

    // Sort by weight (most significant first)
    factorDetails.sort((a, b) => b.weight - a.weight);
    const sortedFactors = factorDetails.map(f => f.label);

    const confidence = calculateFactorConfidence(answers, factors);

    return {
        factors: sortedFactors,
        factor_details: factorDetails,
        confidence
    };
}

export { FACTOR_RULES };
