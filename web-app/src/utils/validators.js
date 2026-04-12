// Add login validation function
export const validateLoginForm = (formData) => {
  const errors = {};

  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!formData.password) {
    errors.password = 'Password is required';
  }

  if (!formData.role) {
    errors.role = 'Please select your login role';
  }

  return errors;
};

// Existing register validation function remains the same
export const validateRegisterForm = (formData) => {
  const errors = {};

  // Full Name validation
  if (!formData.fullName || formData.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
  } else if (formData.fullName.trim().length > 100) {
    errors.fullName = 'Full name must be less than 100 characters';
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Mobile Number validation
  const mobileRegex = /^[0-9]{10}$/;
  if (!formData.mobileNumber) {
    errors.mobileNumber = 'Mobile number is required';
  } else if (!mobileRegex.test(formData.mobileNumber)) {
    errors.mobileNumber = 'Please enter a valid 10-digit mobile number';
  }

  // Password validation
  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  } else if (formData.password.length > 50) {
    errors.password = 'Password must be less than 50 characters';
  }

  // Confirm Password validation
  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  // Role validation
  if (!formData.role) {
    errors.role = 'Please select a role';
  }

  // Gender validation - Required field
  if (!formData.gender || formData.gender === '') {
    errors.gender = 'Please select your gender';
  }

  // Date of Birth validation - Required field
  if (!formData.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required';
  } else {
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    const minAge = (formData.role === 'Merchant' || formData.role === 'DeliveryAgent') ? 18 : 13;
    if (age < minAge) {
      errors.dateOfBirth = `You must be at least ${minAge} years old to register as a ${formData.role}`;
    } else if (age > 120) {
      errors.dateOfBirth = 'Please enter a valid date of birth';
    }
  }

  return errors;
};