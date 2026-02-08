import React, { useState, useEffect } from 'react';
import { getCurrentGameweek, getOverallStandings, getMyLeagues } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function Dashboard({ user }) {
  const [gameweek, setGameweek] = useState(null);
  const [standings, setStandings] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [gwResponse, standingsResponse, leaguesResponse] = await Promise.all([
        getCurrentGameweek(),
        getOverallStandings(1),
        getMyLeagues()
      ]);

      setGameweek(gwResponse.data.gameweek);
      setStandings(standingsResponse.data.standings.slice(0, 10));
      setLeagues(leaguesResponse.data.leagues);
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container">
      <h1>Welcome back, {user.username}! 👋</h1>
      <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2rem' }}>Team: {user.teamName}</p>

      {/* Gameweek Info */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Current Gameweek</h2>
        </div>
        {gameweek ? (
          <div>
            <div className="stats-container">
              <div className="stat-box">
                <div className="stat-label">Round</div>
                <div className="stat-value">{gameweek.round_number === 0 ? 'Pre-Season' : gameweek.round_number}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Deadline</div>
                <div className="stat-value" style={{ fontSize: '1rem' }}>
                  {new Date(gameweek.deadline).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Status</div>
                <div className="stat-value" style={{ fontSize: '1rem' }}>
                  {gameweek.is_finished ? 'Finished' : new Date(gameweek.deadline) > new Date() ? 'Open' : 'Live'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="alert alert-info">No active gameweek</div>
        )}
      </div>

      {/* Top 10 Overall */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Overall Top 10</h2>
        </div>
        {standings.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Manager</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team) => (
                <tr key={team.userId}>
                  <td><strong>#{team.rank}</strong></td>
                  <td>{team.teamName}</td>
                  <td>{team.username}</td>
                  <td><strong>{team.totalPoints}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="alert alert-info">No standings available yet</div>
        )}
      </div>

      {/* My Leagues */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">My Leagues ({leagues.length})</h2>
        </div>
        {leagues.length > 0 ? (
          <div className="team-grid">
            {leagues.map((league) => (
              <div key={league.id} className="card" style={{ margin: 0 }}>
                <h3>{league.name}</h3>
                <p style={{ color: '#666' }}>Code: <strong>{league.code}</strong></p>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-info">
            You haven't joined any leagues yet. Go to the Leagues page to create or join one!
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;