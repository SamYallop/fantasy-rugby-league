import React, { useState, useEffect } from 'react';
import {
  getAllUsers,
  resetUserPassword,
  getAllPlayersAdmin,
  updatePlayerPrice,
  getScoringSystem,
  updateScoringSystem,
  getGameweeks,
  createGameweek,
  setCurrentGameweek
} from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function Admin() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [scoring, setScoring] = useState([]);
  const [gameweeks, setGameweeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [usersRes, playersRes, scoringRes, gameweeksRes] = await Promise.all([
          getAllUsers(),              // FIXED: was getUsers()
          getAllPlayersAdmin(1),      // FIXED: was getPlayers()
          getScoringSystem(),         // FIXED: was getScoring()
          getGameweeks()
        ]);
        
        console.log('Users response:', usersRes.data);
        console.log('Players response:', playersRes.data);
        console.log('Scoring response:', scoringRes.data);
        console.log('Gameweeks response:', gameweeksRes.data);
        
        setUsers(usersRes.data.users || usersRes.data || []);
        setPlayers(playersRes.data.players || playersRes.data || []);
        setScoring(scoringRes.data.scoring || scoringRes.data || []);
        setGameweeks(gameweeksRes.data.gameweeks || gameweeksRes.data || []);
      } catch (error) {
        console.error('Load error:', error);
        setMessage({ type: 'error', text: 'Failed to load admin data: ' + error.message });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter new password for user:');
    if (!newPassword) return;

    try {
      await resetUserPassword(userId, newPassword);
      setMessage({ type: 'success', text: 'Password reset successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reset password' });
    }
  };

  const handleUpdatePrice = async (playerId, newPrice) => {
    try {
      await updatePlayerPrice(playerId, parseInt(newPrice));
      setMessage({ type: 'success', text: 'Price updated successfully' });
      
      // Update the local state
      setPlayers(players.map(p => 
        p.id === playerId ? { ...p, price: parseInt(newPrice) } : p
      ));
    } catch (error) {
      console.error('Update price error:', error);
      setMessage({ type: 'error', text: 'Failed to update price' });
    }
  };

  const handleUpdateScoring = async () => {
    try {
      await updateScoringSystem(scoring);
      setMessage({ type: 'success', text: 'Scoring system updated successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update scoring' });
    }
  };

  const handleScoringChange = (statName, value) => {
    setScoring(scoring.map(s => 
      s.stat_name === statName ? { ...s, points_value: parseFloat(value) } : s
    ));
  };

  const handleCreateGameweek = async () => {
    const roundNumber = prompt('Enter round number:');
    const deadline = prompt('Enter deadline (YYYY-MM-DD HH:MM):');
    
    if (!roundNumber || !deadline) return;

    try {
      await createGameweek(parseInt(roundNumber), deadline);
      setMessage({ type: 'success', text: 'Gameweek created successfully' });
      const gameweeksRes = await getGameweeks();
      setGameweeks(gameweeksRes.data.gameweeks || gameweeksRes.data || []);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create gameweek' });
    }
  };

  const handleSetCurrent = async (gameweekId) => {
    if (!window.confirm('Set this as the current gameweek?')) return;

    try {
      await setCurrentGameweek(gameweekId);
      setMessage({ type: 'success', text: 'Current gameweek updated' });
      const gameweeksRes = await getGameweeks();
      setGameweeks(gameweeksRes.data.gameweeks || gameweeksRes.data || []);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update gameweek' });
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">⚙️ Admin Panel</h1>
        </div>

        {message && (
          <div className={`alert alert-${message.type}`} style={{ marginBottom: '1rem' }}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-3" style={{ borderBottom: '2px solid #e0e0e0', paddingBottom: '1rem' }}>
          <button
            onClick={() => setActiveTab('users')}
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`btn ${activeTab === 'players' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Players ({players.length})
          </button>
          <button
            onClick={() => setActiveTab('scoring')}
            className={`btn ${activeTab === 'scoring' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Scoring ({scoring.length})
          </button>
          <button
            onClick={() => setActiveTab('gameweeks')}
            className={`btn ${activeTab === 'gameweeks' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Gameweeks ({gameweeks.length})
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <h2 className="mb-2">Users</h2>
                {users.length === 0 ? (
                  <div className="alert alert-info">No users found. Check browser console for errors.</div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Team Name</th>
                        <th>Admin</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id}>
                          <td>{user.username}</td>
                          <td>{user.team_name || 'No team'}</td>
                          <td>
                            {user.is_admin && <span className="badge badge-danger">Admin</span>}
                          </td>
                          <td>{new Date(user.created_at).toLocaleDateString()}</td>
                          <td>
                            <button
                              onClick={() => handleResetPassword(user.id)}
                              className="btn btn-secondary"
                              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            >
                              Reset Password
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Players Tab */}
            {activeTab === 'players' && (
              <div>
                <div className="flex-between mb-2">
                  <h2>Player Prices</h2>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search players..."
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    style={{ width: '300px' }}
                  />
                </div>

                {players.length === 0 ? (
                  <div className="alert alert-info">No players found. Check browser console for errors.</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Team</th>
                          <th>Position</th>
                          <th>Price</th>
                          <th>Total Points</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {players
                          .filter(p => 
                            !playerSearch || 
                            p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
                            p.team.toLowerCase().includes(playerSearch.toLowerCase()) ||
                            p.position.toLowerCase().includes(playerSearch.toLowerCase())
                          )
                          .map(player => (
                            <tr key={player.id}>
                              <td><strong>{player.name}</strong></td>
                              <td>{player.team}</td>
                              <td>{player.position}</td>
                              <td>{player.price}k</td>
                              <td><strong>{player.total_points || 0}</strong></td>
                              <td>
                                <button
                                  onClick={() => {
                                    const newPrice = prompt(`Enter new price for ${player.name} (current: ${player.price}k):`, player.price);
                                    if (newPrice) handleUpdatePrice(player.id, newPrice);
                                  }}
                                  className="btn btn-secondary"
                                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                >
                                  Edit Price
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Scoring Tab */}
            {activeTab === 'scoring' && (
              <div>
                <h2 className="mb-2">Scoring System</h2>
                {scoring.length === 0 ? (
                  <div className="alert alert-info">No scoring rules found. Check browser console for errors.</div>
                ) : (
                  <>
                    <div className="team-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                      {scoring.map(stat => (
                        <div key={stat.stat_name} className="card" style={{ margin: 0, padding: '1rem' }}>
                          <label className="form-label" style={{ marginBottom: '0.5rem' }}>{stat.stat_name}</label>
                          <input
                            type="number"
                            step="0.1"
                            className="form-input"
                            value={stat.points_value}
                            onChange={(e) => handleScoringChange(stat.stat_name, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={handleUpdateScoring}
                      className="btn btn-success mt-3"
                      style={{ width: '200px' }}
                    >
                      Save Scoring System
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Gameweeks Tab */}
            {activeTab === 'gameweeks' && (
              <div>
                <div className="flex-between mb-2">
                  <h2>Gameweeks</h2>
                  <button onClick={handleCreateGameweek} className="btn btn-primary">
                    Create Gameweek
                  </button>
                </div>
                {gameweeks.length === 0 ? (
                  <div className="alert alert-info">No gameweeks found. Click "Create Gameweek" to add one.</div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Round</th>
                        <th>Deadline</th>
                        <th>Current</th>
                        <th>Finished</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gameweeks.map(gw => (
                        <tr key={gw.id}>
                          <td><strong>Round {gw.round_number}</strong></td>
                          <td>{new Date(gw.deadline).toLocaleString()}</td>
                          <td>
                            {gw.is_current && <span className="badge badge-success">Current</span>}
                          </td>
                          <td>
                            {gw.is_finished && <span className="badge badge-danger">Finished</span>}
                          </td>
                          <td>
                            {!gw.is_current && (
                              <button
                                onClick={() => handleSetCurrent(gw.id)}
                                className="btn btn-secondary"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                              >
                                Set Current
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Admin;
