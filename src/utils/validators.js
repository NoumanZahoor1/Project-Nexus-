export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`
  }
  return null
}

export const validateEmail = (email) => {
  if (!email) return 'Email is required'
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(email)) return 'Please enter a valid email address'
  return null
}

export const validatePassword = (password) => {
  if (!password) return 'Password is required'
  if (password.length < 6) return 'Password must be at least 6 characters'
  return null
}

export const validateConfirmPassword = (password, confirm) => {
  if (!confirm) return 'Please confirm your password'
  if (password !== confirm) return 'Passwords do not match'
  return null
}

export const validateMinLength = (value, min, fieldName = 'This field') => {
  if (!value) return `${fieldName} is required`
  if (value.length < min) return `${fieldName} must be at least ${min} characters`
  return null
}

export const validateDate = (date, fieldName = 'Date') => {
  if (!date) return `${fieldName} is required`
  const d = new Date(date)
  if (isNaN(d.getTime())) return `${fieldName} must be a valid date`
  return null
}

export const validateEndDate = (startDate, endDate) => {
  if (!endDate) return 'End date is required'
  if (startDate && new Date(endDate) <= new Date(startDate)) {
    return 'End date must be after start date'
  }
  return null
}

export const hasErrors = (errors) => {
  return Object.values(errors).some(v => v !== null && v !== undefined && v !== '')
}
