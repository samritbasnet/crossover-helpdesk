// components/User/EmailPreferences.js - Email notification preferences component
import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import './EmailPreferences.css';

const EmailPreferences = () => {
  const [preferences, setPreferences] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setPreferences(response.user?.email_notifications || 'all');
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setMessage('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (newPreference) => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email_notifications: newPreference })
      });

      const data = await response.json();

      if (data.success) {
        setPreferences(newPreference);
        setMessage('Email preferences updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      setMessage('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="email-preferences">
        <h3>Email Notifications</h3>
        <div className="loading">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="email-preferences">
      <h3>📧 Email Notifications</h3>
      <p className="description">
        Choose how often you'd like to receive email notifications about your tickets.
      </p>

      <div className="preference-options">
        <label className={`preference-option ${preferences === 'all' ? 'selected' : ''}`}>
          <input
            type="radio"
            name="email_notifications"
            value="all"
            checked={preferences === 'all'}
            onChange={(e) => handlePreferenceChange(e.target.value)}
            disabled={saving}
          />
          <div className="option-content">
            <div className="option-title">🔔 All Notifications</div>
            <div className="option-description">
              Get notified about all ticket activities (creation, updates, assignments, resolution)
            </div>
          </div>
        </label>

        <label className={`preference-option ${preferences === 'important' ? 'selected' : ''}`}>
          <input
            type="radio"
            name="email_notifications"
            value="important"
            checked={preferences === 'important'}
            onChange={(e) => handlePreferenceChange(e.target.value)}
            disabled={saving}
          />
          <div className="option-content">
            <div className="option-title">⚡ Important Only</div>
            <div className="option-description">
              Only get notified about important events (ticket resolution and assignments)
            </div>
          </div>
        </label>

        <label className={`preference-option ${preferences === 'none' ? 'selected' : ''}`}>
          <input
            type="radio"
            name="email_notifications"
            value="none"
            checked={preferences === 'none'}
            onChange={(e) => handlePreferenceChange(e.target.value)}
            disabled={saving}
          />
          <div className="option-content">
            <div className="option-title">🔕 No Notifications</div>
            <div className="option-description">
              Don't send me any email notifications (you can still check updates in the dashboard)
            </div>
          </div>
        </label>
      </div>

      {saving && (
        <div className="saving-indicator">
          <div className="spinner"></div>
          Updating preferences...
        </div>
      )}

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="info-note">
        <strong>Note:</strong> Changes take effect immediately. You can update these preferences anytime.
      </div>
    </div>
  );
};

export default EmailPreferences;
