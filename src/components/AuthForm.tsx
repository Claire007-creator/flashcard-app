import React, { useState, useEffect } from 'react';
import './AuthForm.css';

interface AuthFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: { id: string; email?: string; phone?: string; name: string }) => void;
  initialMode?: 'login' | 'register';
}

type AuthMode = 'login' | 'register';
type ContactMethod = 'email' | 'phone';

const AuthForm: React.FC<AuthFormProps> = ({ isOpen, onClose, onAuthSuccess, initialMode }) => {
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode || 'login');
  const [contactMethod, setContactMethod] = useState<ContactMethod>('email');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Update auth mode when initialMode prop changes
  useEffect(() => {
    if (initialMode) {
      setAuthMode(initialMode);
    }
  }, [initialMode]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const validateForm = (): string[] => {
    const newErrors: string[] = [];

    if (authMode === 'register' && !formData.name.trim()) {
      newErrors.push('Name is required');
    }

    if (contactMethod === 'email') {
      if (!formData.email.trim()) {
        newErrors.push('Email is required');
      } else if (!validateEmail(formData.email)) {
        newErrors.push('Please enter a valid email address');
      }
    } else {
      if (!formData.phone.trim()) {
        newErrors.push('Phone number is required');
      } else if (!validatePhone(formData.phone)) {
        newErrors.push('Please enter a valid phone number');
      }
    }

    if (!formData.password) {
      newErrors.push('Password is required');
    } else if (formData.password.length < 6) {
      newErrors.push('Password must be at least 6 characters');
    }

    if (authMode === 'register' && formData.password !== formData.confirmPassword) {
      newErrors.push('Passwords do not match');
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock authentication logic
      const user = {
        id: Date.now().toString(),
        name: formData.name || 'User',
        ...(contactMethod === 'email' ? { email: formData.email } : { phone: formData.phone })
      };

      // Save to localStorage for persistence
      localStorage.setItem('flashy_user', JSON.stringify(user));
      
      onAuthSuccess(user);
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
      });
    } catch (error) {
      setErrors(['Authentication failed. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const switchAuthMode = () => {
    setAuthMode(prev => prev === 'login' ? 'register' : 'login');
    setErrors([]);
  };

  const switchContactMethod = () => {
    setContactMethod(prev => prev === 'email' ? 'phone' : 'email');
    setErrors([]);
  };

  if (!isOpen) return null;

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <div className="auth-header">
          <h2>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <button className="auth-close-button" onClick={onClose}>×</button>
        </div>

        <div className="contact-method-toggle">
          <button
            type="button"
            className={`method-button ${contactMethod === 'email' ? 'active' : ''}`}
            onClick={() => setContactMethod('email')}
          >
            📧 Email
          </button>
          <button
            type="button"
            className={`method-button ${contactMethod === 'phone' ? 'active' : ''}`}
            onClick={() => setContactMethod('phone')}
          >
            📱 Phone
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {authMode === 'register' && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>
          )}

          {contactMethod === 'email' ? (
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
            />
          </div>

          {authMode === 'register' && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                required
              />
            </div>
          )}

          {errors.length > 0 && (
            <div className="auth-errors">
              {errors.map((error, index) => (
                <p key={index} className="error-message">{error}</p>
              ))}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button type="button" className="switch-button" onClick={switchAuthMode}>
              {authMode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm; 