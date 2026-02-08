import React, { useState, useEffect } from 'react';
import { getMyLeagues, createLeague, joinLeague, getLeagueStandings, getOverallStandings } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function Leagues() {
  const [leagues, setLeagues] = useState([]);
  const [overallStandings, setOverallStandings] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [leagueStandings, setLeagueStandings] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedLeague) {
      loadLeagueStandings(selectedLeague.id);
    }
  }, [selectedLeague]);

  const loadData = async () => {
    try {
      const [leaguesRes, overallRes] = await Promise.all([
        getMyLeagues(),
        getOverallStandings(1)
      ]);

      setLeagues(leaguesRes.data.leagues);
      setOverallStandings(overallRes.data.standings);
      
      if (leaguesRes.data.leagues.length > 0) {
        setSelectedLeague(leaguesRes.data.leagues[0]);
      }
    } catch (error) {
      console.error('Leagues load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeagueStandings = async (leagueId) => {
    try {
      const response = await getLeagueStandings(leagueId);
      setLeagueStandings(response.data.standings);
    } catch (error) {
      console.error('League standings error:', error);
    }
  };

  const handleCreateLeague = async (e) => {
    e.preventDefault();
    setMessage(null);

    try {
      const response = await createLeague(newLeagueName);
      setMessage({ type: 'success', text: `League created! Code: ${response.data.league.code}` });
      setNewLeagueName('');
      setShowCreateModal(false);
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to create league' });
    }
  };

  const handleJoinLeague = async (e) => {
    e.preventDefault();
    setMessage(null);

    try {
      await joinLeague(joinCode);
      setMessage({ type: 'success', text: 'Successfully joined league!' });
      setJoinCode('');
      setShowJoinModal(false);
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to join league' });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Leagues</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              Create League
            </button>
            <button onClick={() => setShowJoinModal(true)} className="btn btn-success">
              Join League
            </button>
          </div>
        </div>

        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Overall Standings */}
        <div className="mb-4">
          <h2 className="mb-2">Overall Standings</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Manager</th>
                <th>GW Points</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {overallStandings.slice(0, 20).map((team) => (
                <tr key={team.userId}>
                  <td><strong>#{team.rank}</strong></td>
                  <td>{team.teamName}</td>
                  <td>{team.username}</td>
                  <td>{team.gameweekPoints}</td>
                  <td><strong>{team.totalPoints}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* My Leagues */}
        {leagues.length > 0 && (
          <div>
            <h2 className="mb-2">My Leagues</h2>
            
            <div className="flex gap-2 mb-2" style={{ flexWrap: 'wrap' }}>
              {leagues.map(league => (
                <button
                  key={league.id}
                  onClick={() => setSelectedLeague(league)}
                  className={`btn ${selectedLeague?.id === league.id ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {league.name}
                </button>
              ))}
            </div>

            {selectedLeague && (
              <div className="card" style={{ background: '#f8f9fa' }}>
                <div className="flex-between mb-2">
                  <h3>{selectedLeague.name}</h3>
                  <span className="badge badge-primary">
                    Code: {selectedLeague.code}
                  </span>
                </div>

                {leagueStandings.length > 0 ? (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Team</th>
                        <th>Manager</th>
                        <th>GW Points</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leagueStandings.map((team) => (
                        <tr key={team.userId}>
                          <td><strong>#{team.rank}</strong></td>
                          <td>{team.teamName}</td>
                          <td>{team.username}</td>
                          <td>{team.gameweekPoints}</td>
                          <td><strong>{team.totalPoints}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="alert alert-info">No standings available yet</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create League Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '90%' }}>
            <h2 className="mb-3">Create New League</h2>
            <form onSubmit={handleCreateLeague}>
              <div className="form-group">
                <label className="form-label">League Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newLeagueName}
                  onChange={(e) => setNewLeagueName(e.target.value)}
                  required
                  minLength={3}
                  placeholder="e.g., Work League"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">Create</button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewLeagueName('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join League Modal */}
      {showJoinModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '90%' }}>
            <h2 className="mb-3">Join League</h2>
            <form onSubmit={handleJoinLeague}>
              <div className="form-group">
                <label className="form-label">League Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  required
                  placeholder="Enter 8-character code"
                  maxLength={8}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-success">Join</button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinCode('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leagues;