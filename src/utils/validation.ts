// Form validation utilities

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationErrors {
  [key: string]: string;
}

export class FormValidator {
  static validateField(value: any, rules: ValidationRule): string | null {
    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return 'This field is required';
    }

    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && !value.trim())) {
      return null;
    }

    // String validations
    if (typeof value === 'string') {
      // Min length
      if (rules.minLength && value.length < rules.minLength) {
        return `Must be at least ${rules.minLength} characters long`;
      }

      // Max length
      if (rules.maxLength && value.length > rules.maxLength) {
        return `Must be no more than ${rules.maxLength} characters long`;
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        return 'Invalid format';
      }
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  }

  static validateForm(data: Record<string, any>, rules: Record<string, ValidationRule>): ValidationErrors {
    const errors: ValidationErrors = {};

    Object.keys(rules).forEach(field => {
      const error = this.validateField(data[field], rules[field]);
      if (error) {
        errors[field] = error;
      }
    });

    return errors;
  }

  // Common validation patterns
  static patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[1-9][\d]{0,15}$/,
    url: /^https?:\/\/.+/,
    indianPhone: /^[6-9]\d{9}$/,
    pincode: /^\d{6}$/
  };

  // Common validation rules
  static rules = {
    email: {
      required: true,
      pattern: FormValidator.patterns.email,
      custom: (value: string) => {
        if (value && !FormValidator.patterns.email.test(value)) {
          return 'Please enter a valid email address';
        }
        return null;
      }
    },

    password: {
      required: true,
      minLength: 6,
      custom: (value: string) => {
        if (value && value.length < 6) {
          return 'Password must be at least 6 characters long';
        }
        if (value && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }
        return null;
      }
    },

    confirmPassword: (originalPassword: string) => ({
      required: true,
      custom: (value: string) => {
        if (value !== originalPassword) {
          return 'Passwords do not match';
        }
        return null;
      }
    }),

    phone: {
      pattern: FormValidator.patterns.indianPhone,
      custom: (value: string) => {
        if (value && !FormValidator.patterns.indianPhone.test(value)) {
          return 'Please enter a valid 10-digit mobile number';
        }
        return null;
      }
    },

    name: {
      required: true,
      minLength: 2,
      maxLength: 50,
      custom: (value: string) => {
        if (value && !/^[a-zA-Z\s]+$/.test(value)) {
          return 'Name can only contain letters and spaces';
        }
        return null;
      }
    },

    date: {
      required: true,
      custom: (value: string) => {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return 'Please enter a valid date';
        }
        return null;
      }
    },

    futureDate: {
      required: true,
      custom: (value: string) => {
        const date = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (isNaN(date.getTime())) {
          return 'Please enter a valid date';
        }
        if (date < today) {
          return 'Date cannot be in the past';
        }
        return null;
      }
    },

    budget: {
      required: true,
      custom: (value: string | number) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num) || num <= 0) {
          return 'Please enter a valid budget amount';
        }
        if (num > 10000000) {
          return 'Budget amount seems too high';
        }
        return null;
      }
    },

    travelers: {
      required: true,
      custom: (value: string | number) => {
        const num = typeof value === 'string' ? parseInt(value) : value;
        if (isNaN(num) || num < 1) {
          return 'Number of travelers must be at least 1';
        }
        if (num > 50) {
          return 'Number of travelers cannot exceed 50';
        }
        return null;
      }
    }
  };
}

// Trip planner specific validations
export const validateTripPlan = (formData: FormData) => {
  const data = {
    title: formData.get('title')?.toString() || '',
    startDate: formData.get('startDate')?.toString() || '',
    endDate: formData.get('endDate')?.toString() || '',
    budget: formData.get('budget')?.toString() || '',
    travelers: formData.get('travelers')?.toString() || ''
  };

  const rules = {
    title: { required: true, minLength: 3, maxLength: 100 },
    startDate: FormValidator.rules.futureDate,
    endDate: {
      required: true,
      custom: (value: string) => {
        const startDate = new Date(data.startDate);
        const endDate = new Date(value);
        
        if (isNaN(endDate.getTime())) {
          return 'Please enter a valid end date';
        }
        if (endDate <= startDate) {
          return 'End date must be after start date';
        }
        
        // Check if trip is too long (more than 1 year)
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 365) {
          return 'Trip duration cannot exceed 1 year';
        }
        
        return null;
      }
    },
    budget: FormValidator.rules.budget,
    travelers: FormValidator.rules.travelers
  };

  return FormValidator.validateForm(data, rules);
};

export default FormValidator;






















