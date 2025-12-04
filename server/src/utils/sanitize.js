import validator from "validator";

export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  let sanitized = validator.escape(input);
  sanitized = sanitized.trim();

  return sanitized;
};
