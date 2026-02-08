import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navigation({ user, onLogout }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          🏉 Fantasy Rugby League
        </div>

        <ul className="nav-links">
          <li><Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link></li>
          <li><Link to="/my-team" className={isActive('/my-team')}>My Team</Link></li>
          <li><Link to="/transfers" className={isActive('/transfers')}>Transfers</Link></li>
          <li><Link to="/players" className={isActive('/players')}>Players</Link></li>
          <li><Link to="/leagues" className={isActive('/leagues')}>Leagues</Link></li>
          {user.isAdmin && (
            <li><Link to="/admin" className={isActive('/admin')}>Admin</Link></li>
          )}
        </ul>

        <div className="nav-user">
          <div className="user-info">
            <div>
              {user.username}
              {user.isAdmin && <span className="admin-badge">ADMIN</span>}
            </div>
            <div className="user-team">{user.teamName}</div>
          </div>
          <button onClick={onLogout} className="btn btn-secondary">Logout</button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;