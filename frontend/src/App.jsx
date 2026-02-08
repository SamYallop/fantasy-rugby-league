import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import MyTeam from './pages/MyTeam';
import Transfers from './pages/Transfers';
import Players from './pages/Players';
import Leagues from './pages/Leagues';
import Admin from './pages/Admin';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        {user && <Navigation user={user} onLogout={handleLogout} />}
        
        <Routes>
          <Route path="/login" element={
            user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
          } />
          
          <Route path="/signup" element={
            user ? <Navigate to="/dashboard" /> : <Signup onLogin={handleLogin} />
          } />
          
          <Route path="/dashboard" element={
            user ? <Dashboard user={user} /> : <Navigate to="/login" />
          } />
          
          <Route path="/my-team" element={
            user ? <MyTeam /> : <Navigate to="/login" />
          } />
          
          <Route path="/transfers" element={
            user ? <Transfers /> : <Navigate to="/login" />
          } />
          
          <Route path="/players" element={
            user ? <Players /> : <Navigate to="/login" />
          } />
          
          <Route path="/leagues" element={
            user ? <Leagues /> : <Navigate to="/login" />
          } />
          
          <Route path="/admin" element={
            user && user.isAdmin ? <Admin /> : <Navigate to="/dashboard" />
          } />
          
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;