import React from 'react';
import './AuthForm.css';

interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface UserProfileProps {
  user: User;
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getContactInfo = (): string => {
    if (user.email) {
      return user.email;
    } else if (user.phone) {
      return user.phone;
    }
    return '';
  };

  return (
    <div className="user-profile">
      <div className="user-avatar">
        {getInitials(user.name)}
      </div>
      <div className="user-info">
        <p className="user-name">{user.name}</p>
        <p className="user-contact">{getContactInfo()}</p>
      </div>
      <button className="logout-button" onClick={onLogout} title="Logout">
        Logout
      </button>
    </div>
  );
};

export default UserProfile; 