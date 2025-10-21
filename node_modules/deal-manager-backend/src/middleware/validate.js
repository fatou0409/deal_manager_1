// backend/src/middleware/validate.js
import validator from "validator";

// ✅ Fonctions helper APRÈS l'import

function isEmpty(value) {
  return value === undefined || value === null || value === "";
}

function isRequiredInvalid(value, rules) {
  return rules.required && isEmpty(value);
}

function validateEmail(value) {
  if (!validator.isEmail(String(value))) {
    return { error: "Email invalide" };
  }
  return { value: String(value) };
}

function validateString(value, rules) {
  value = String(value);
  if (rules.minLength && value.length < rules.minLength) {
    return { error: `Trop court (min. ${rules.minLength})` };
  }
  if (rules.maxLength && value.length > rules.maxLength) {
    return { error: `Trop long (max. ${rules.maxLength})` };
  }
  // Sanitize: remove HTML
  value = validator.stripLow(validator.escape(value));
  return { value };
}

function validateInt(value, rules) {
  if (!validator.isInt(String(value))) {
    return { error: "Doit être un nombre entier" };
  }
  value = parseInt(value, 10);
  if (rules.min !== undefined && value < rules.min) {
    return { error: `Doit être ≥ ${rules.min}` };
  }
  if (rules.max !== undefined && value > rules.max) {
    return { error: `Doit être ≤ ${rules.max}` };
  }
  return { value };
}

export function validate(fields, schema) {
  const errors = {};
  const clean = {};
  const typeValidators = {
    email: validateEmail,
    string: validateString,
    int: validateInt,
  };
  
  for (const key in schema) {
    const rules = schema[key];
    let value = fields[key];
    
    if (isRequiredInvalid(value, rules)) {
      errors[key] = "Champ requis";
      continue;
    }
    
    if (isEmpty(value)) {
      clean[key] = value;
      continue;
    }
    
    const validatorFn = typeValidators[rules.type] || ((v) => ({ value: v }));
    const result = validatorFn(value, rules);
    
    if (result.error) {
      errors[key] = result.error;
    } else {
      clean[key] = result.value;
    }
  }
  
  return { errors, clean };
}