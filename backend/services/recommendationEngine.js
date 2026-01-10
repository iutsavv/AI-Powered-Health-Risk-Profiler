/**
 * Recommendation Engine Service
 * Generates actionable, non-diagnostic guidance based on risk factors
 */

// Recommendation mappings for each factor
const RECOMMENDATIONS = {
    'smoking': {
        primary: 'Quit smoking',
        details: 'Consider nicotine replacement therapy or consult a healthcare provider for smoking cessation programs',
        priority: 1,
        icon: 'cigarette-off'
    },
    'poor diet': {
        primary: 'Improve your diet',
        details: 'Reduce sugar intake, increase vegetables and whole grains, limit processed foods',
        priority: 2,
        icon: 'apple'
    },
    'low exercise': {
        primary: 'Increase physical activity',
        details: 'Start with 30 minutes of walking daily, gradually increase intensity',
        priority: 3,
        icon: 'footprints'
    },
    'excessive alcohol': {
        primary: 'Reduce alcohol consumption',
        details: 'Limit to moderate drinking or consider abstaining. Seek support if needed',
        priority: 2,
        icon: 'wine-off'
    },
    'poor sleep': {
        primary: 'Improve sleep habits',
        details: 'Aim for 7-8 hours of quality sleep. Maintain consistent sleep schedule',
        priority: 4,
        icon: 'moon'
    },
    'high stress': {
        primary: 'Manage stress levels',
        details: 'Practice relaxation techniques, consider meditation or yoga, take regular breaks',
        priority: 4,
        icon: 'brain'
    },
    'obesity': {
        primary: 'Work towards healthy weight',
        details: 'Consult healthcare provider for personalized weight management plan',
        priority: 2,
        icon: 'scale'
    },
    'overweight': {
        primary: 'Consider weight management',
        details: 'Focus on balanced diet and regular exercise for gradual weight loss',
        priority: 5,
        icon: 'scale'
    },
    'advanced age': {
        primary: 'Regular health checkups',
        details: 'Schedule regular screenings and preventive care appointments',
        priority: 6,
        icon: 'stethoscope'
    }
};

// General wellness recommendations
const GENERAL_RECOMMENDATIONS = [
    {
        primary: 'Stay hydrated',
        details: 'Drink at least 8 glasses of water daily',
        priority: 7,
        icon: 'droplet'
    },
    {
        primary: 'Regular health checkups',
        details: 'Schedule annual wellness visits with your healthcare provider',
        priority: 8,
        icon: 'calendar-check'
    }
];

/**
 * Generate recommendations based on risk factors
 * @param {string[]} factors - Extracted risk factors
 * @param {string} riskLevel - Calculated risk level
 * @returns {object} Recommendations with details
 */
export function generateRecommendations(factors, riskLevel) {
    const recommendations = [];
    const detailedRecommendations = [];

    // Add factor-specific recommendations
    for (const factor of factors) {
        const rec = RECOMMENDATIONS[factor];
        if (rec) {
            recommendations.push(rec.primary);
            detailedRecommendations.push({
                ...rec,
                factor
            });
        }
    }

    // Sort by priority
    detailedRecommendations.sort((a, b) => a.priority - b.priority);

    // Add general recommendations for high risk
    if (riskLevel === 'high' || riskLevel === 'very high') {
        for (const rec of GENERAL_RECOMMENDATIONS) {
            if (!recommendations.includes(rec.primary)) {
                recommendations.push(rec.primary);
                detailedRecommendations.push(rec);
            }
        }
    }

    // Limit to top 5 recommendations for focus
    const topRecommendations = detailedRecommendations.slice(0, 5);

    return {
        recommendations: topRecommendations.map(r => r.primary),
        detailed_recommendations: topRecommendations
    };
}

export { RECOMMENDATIONS };
