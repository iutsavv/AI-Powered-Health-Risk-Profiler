/**
 * JSON Schema Definitions and Validators
 * Ensures API responses adhere to defined schemas
 */

// Response schemas for each step
export const SCHEMAS = {
    // Step 1: Parse Response Schema
    parseResponse: {
        required: ['answers', 'missing_fields', 'confidence'],
        properties: {
            answers: { type: 'object' },
            missing_fields: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'number', min: 0, max: 1 }
        }
    },

    // Step 2: Factor Response Schema
    factorResponse: {
        required: ['factors', 'confidence'],
        properties: {
            factors: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'number', min: 0, max: 1 }
        }
    },

    // Step 3: Risk Response Schema
    riskResponse: {
        required: ['risk_level', 'score', 'rationale'],
        properties: {
            risk_level: { type: 'string', enum: ['low', 'moderate', 'high', 'very high'] },
            score: { type: 'number', min: 0, max: 100 },
            rationale: { type: 'array', items: { type: 'string' } }
        }
    },

    // Step 4: Full Analysis Response Schema
    analysisResponse: {
        required: ['status', 'risk_level', 'score', 'factors', 'recommendations'],
        properties: {
            status: { type: 'string' },
            answers: { type: 'object' },
            missing_fields: { type: 'array' },
            parse_confidence: { type: 'number' },
            factors: { type: 'array' },
            factor_confidence: { type: 'number' },
            risk_level: { type: 'string' },
            score: { type: 'number' },
            rationale: { type: 'array' },
            recommendations: { type: 'array' },
            detailed_recommendations: { type: 'array' },
            warnings: { type: 'array' }
        }
    },

    // Guardrail/Error Response Schema
    errorResponse: {
        required: ['status', 'reason'],
        properties: {
            status: { type: 'string' },
            reason: { type: 'string' },
            missing_fields: { type: 'array', optional: true },
            partial_parse: { type: 'object', optional: true }
        }
    },

    // Input Answer Schema
    inputAnswers: {
        properties: {
            age: { type: 'number', min: 0, max: 150 },
            smoker: { type: 'boolean' },
            exercise: { type: 'string', enum: ['rarely', 'sometimes', 'regularly'] },
            diet: { type: 'string' },
            alcohol: { type: 'string', enum: ['rarely', 'moderate', 'heavy'] },
            sleep: { type: 'number', min: 0, max: 24 },
            stress: { type: 'string', enum: ['low', 'moderate', 'high'] },
            bmi: { type: 'number', min: 10, max: 100 }
        }
    }
};

/**
 * Validate a value against a property schema
 */
function validateProperty(value, propSchema, propName) {
    const errors = [];

    if (value === undefined || value === null) {
        return errors; // Optional properties can be undefined
    }

    // Type checking
    if (propSchema.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (propSchema.type !== actualType) {
            errors.push(`${propName}: expected ${propSchema.type}, got ${actualType}`);
            return errors;
        }
    }

    // Enum validation
    if (propSchema.enum && !propSchema.enum.includes(value)) {
        errors.push(`${propName}: value "${value}" not in allowed values [${propSchema.enum.join(', ')}]`);
    }

    // Number range validation
    if (propSchema.type === 'number') {
        if (propSchema.min !== undefined && value < propSchema.min) {
            errors.push(`${propName}: value ${value} is below minimum ${propSchema.min}`);
        }
        if (propSchema.max !== undefined && value > propSchema.max) {
            errors.push(`${propName}: value ${value} exceeds maximum ${propSchema.max}`);
        }
    }

    // Array items validation
    if (propSchema.type === 'array' && propSchema.items && Array.isArray(value)) {
        value.forEach((item, index) => {
            const itemErrors = validateProperty(item, propSchema.items, `${propName}[${index}]`);
            errors.push(...itemErrors);
        });
    }

    return errors;
}

/**
 * Validate an object against a schema
 * @param {object} data - Data to validate
 * @param {object} schema - Schema to validate against
 * @returns {object} Validation result with isValid and errors
 */
export function validateSchema(data, schema) {
    const errors = [];

    // Check required fields
    if (schema.required) {
        for (const field of schema.required) {
            if (data[field] === undefined) {
                errors.push(`Missing required field: ${field}`);
            }
        }
    }

    // Validate each property
    if (schema.properties) {
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
            const propErrors = validateProperty(data[propName], propSchema, propName);
            errors.push(...propErrors);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Wrap response to ensure schema compliance
 * Adds any missing required fields with defaults
 */
export function ensureSchemaCompliance(data, schemaName) {
    const schema = SCHEMAS[schemaName];
    if (!schema) return data;

    const result = { ...data };

    // Ensure required fields have at least null values
    if (schema.required) {
        for (const field of schema.required) {
            if (result[field] === undefined) {
                const propSchema = schema.properties?.[field];
                if (propSchema) {
                    switch (propSchema.type) {
                        case 'array': result[field] = []; break;
                        case 'object': result[field] = {}; break;
                        case 'number': result[field] = 0; break;
                        case 'string': result[field] = ''; break;
                        default: result[field] = null;
                    }
                }
            }
        }
    }

    return result;
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(status, reason, extras = {}) {
    return {
        status,
        reason,
        timestamp: new Date().toISOString(),
        ...extras
    };
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse(data, schemaName = null) {
    const response = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        ...data
    };

    if (schemaName) {
        return ensureSchemaCompliance(response, schemaName);
    }

    return response;
}
