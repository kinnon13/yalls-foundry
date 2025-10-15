/**
 * Dynamic Attributes System
 * 
 * Flexible attribute management for listings - supports any product type
 * with dynamic fields, variants, and search capabilities.
 */

export type AttributeType = 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date';

export interface AttributeDefinition {
  key: string;
  label: string;
  type: AttributeType;
  required?: boolean;
  options?: string[]; // For select/multiselect
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  searchable?: boolean;
  filterable?: boolean;
}

export interface DynamicAttributes {
  [key: string]: any;
}

/**
 * Common attribute sets for different product categories
 */
export const categoryAttributes: Record<string, AttributeDefinition[]> = {
  // Horse marketplace
  horses: [
    { key: 'breed', label: 'Breed', type: 'select', required: true, filterable: true, searchable: true },
    { key: 'age', label: 'Age', type: 'number', validation: { min: 0, max: 50 }, filterable: true },
    { key: 'gender', label: 'Gender', type: 'select', options: ['Mare', 'Stallion', 'Gelding'], filterable: true },
    { key: 'color', label: 'Color', type: 'select', filterable: true },
    { key: 'height', label: 'Height (hands)', type: 'number', validation: { min: 10, max: 20 } },
    { key: 'discipline', label: 'Discipline', type: 'multiselect', filterable: true },
    { key: 'registered', label: 'Registered', type: 'boolean', filterable: true },
    { key: 'papers', label: 'Has Papers', type: 'boolean' },
  ],
  
  // Physical products
  physical: [
    { key: 'brand', label: 'Brand', type: 'text', searchable: true },
    { key: 'model', label: 'Model', type: 'text', searchable: true },
    { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Like New', 'Good', 'Fair'], filterable: true },
    { key: 'weight', label: 'Weight', type: 'number' },
    { key: 'dimensions', label: 'Dimensions', type: 'text' },
    { key: 'material', label: 'Material', type: 'text', filterable: true },
  ],
  
  // Services
  services: [
    { key: 'duration', label: 'Duration', type: 'text', required: true },
    { key: 'location', label: 'Location', type: 'text', searchable: true },
    { key: 'availability', label: 'Availability', type: 'multiselect' },
    { key: 'certification', label: 'Certifications', type: 'multiselect' },
    { key: 'experience_years', label: 'Years of Experience', type: 'number' },
  ],
  
  // Digital products
  digital: [
    { key: 'format', label: 'Format', type: 'select', filterable: true },
    { key: 'file_size', label: 'File Size', type: 'text' },
    { key: 'license_type', label: 'License Type', type: 'select', required: true },
    { key: 'compatibility', label: 'Compatibility', type: 'multiselect' },
  ],
};

/**
 * Validate attributes against definitions
 */
export function validateAttributes(
  attributes: DynamicAttributes,
  definitions: AttributeDefinition[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const def of definitions) {
    const value = attributes[def.key];

    // Check required
    if (def.required && (value === undefined || value === null || value === '')) {
      errors.push(`${def.label} is required`);
      continue;
    }

    if (value === undefined || value === null) continue;

    // Type validation
    switch (def.type) {
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`${def.label} must be a number`);
        } else if (def.validation) {
          if (def.validation.min !== undefined && value < def.validation.min) {
            errors.push(`${def.label} must be at least ${def.validation.min}`);
          }
          if (def.validation.max !== undefined && value > def.validation.max) {
            errors.push(`${def.label} must be at most ${def.validation.max}`);
          }
        }
        break;

      case 'select':
        if (def.options && !def.options.includes(value)) {
          errors.push(`${def.label} must be one of: ${def.options.join(', ')}`);
        }
        break;

      case 'multiselect':
        if (!Array.isArray(value)) {
          errors.push(`${def.label} must be an array`);
        } else if (def.options) {
          const invalid = value.filter(v => !def.options!.includes(v));
          if (invalid.length > 0) {
            errors.push(`${def.label} contains invalid options: ${invalid.join(', ')}`);
          }
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${def.label} must be true or false`);
        }
        break;

      case 'text':
        if (typeof value !== 'string') {
          errors.push(`${def.label} must be text`);
        } else if (def.validation?.pattern) {
          const regex = new RegExp(def.validation.pattern);
          if (!regex.test(value)) {
            errors.push(`${def.label} format is invalid`);
          }
        }
        break;
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Build search query from attributes
 */
export function buildAttributeQuery(
  filters: DynamicAttributes,
  definitions: AttributeDefinition[]
): string {
  const searchableAttrs = definitions
    .filter(def => def.searchable && filters[def.key])
    .map(def => filters[def.key])
    .filter(Boolean)
    .join(' ');

  return searchableAttrs;
}

/**
 * Extract filterable attributes for faceted search
 */
export function extractFilterableAttributes(
  attributes: DynamicAttributes,
  definitions: AttributeDefinition[]
): Record<string, any> {
  const filterable: Record<string, any> = {};

  for (const def of definitions.filter(d => d.filterable)) {
    if (attributes[def.key] !== undefined) {
      filterable[def.key] = attributes[def.key];
    }
  }

  return filterable;
}

/**
 * Generate variant combinations from options
 */
export function generateVariantCombinations(
  variantOptions: Record<string, string[]>
): Array<Record<string, string>> {
  const keys = Object.keys(variantOptions);
  
  if (keys.length === 0) return [];
  if (keys.length === 1) {
    return variantOptions[keys[0]].map(val => ({ [keys[0]]: val }));
  }

  // Recursive combination generation
  function combine(index: number): Array<Record<string, string>> {
    if (index === keys.length) return [{}];

    const key = keys[index];
    const values = variantOptions[key];
    const rest = combine(index + 1);

    const result: Array<Record<string, string>> = [];
    for (const value of values) {
      for (const combo of rest) {
        result.push({ [key]: value, ...combo });
      }
    }

    return result;
  }

  return combine(0);
}
