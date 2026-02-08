import React, { useState, useEffect } from 'react';
import { getAvailableTransfers, makeTransfer, getTransferHistory, getPlayers, getMyTeam } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PlayerCard from '../components/PlayerCard';

function Transfers() {
  const [transfersInfo, setTransfersInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [playerOut, setPlayerOut] = useState(null);
  const [playerIn, setPlayerIn] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (playerOut) {
      loadPlayers();
    }
  }, [search, playerOut]);

  const loadData = async () => {
    try {
      const [transfersRes, historyRes, teamRes] = await Promise.all([
        getAvailableTransfers(),
        getTransferHistory(),
        getMyTeam()
      ]);

      setTransfersInfo(transfersRes.data);
      setHistory(historyRes.data.transfers);
      setMyTeam(teamRes.data.team);
    } catch (error) {
      console.error('Transfers load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayers = async () => {
    if (!playerOut) return;

    try {
      const response = await getPlayers({
        position: playerOut.position,
        search: search
      });
      setPlayers(response.data.players);
    } catch (error) {
      console.error('Players load error:', error);
    }
  };

  const handleMakeTransfer = async () => {
    if (!playerOut || !playerIn) {
      setMessage({ type: 'error', text: 'Please select both players' });
      return;
    }

    setMessage(null);

    try {
      await makeTransfer(playerOut.id, playerIn.id);
      setMessage({ type: 'success', text: 'Transfer completed successfully!' });
      
      // Reset and reload
      setPlayerOut(null);
      setPlayerIn(null);
      setPlayers([]);
      loadData();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Transfer failed' 
      });
    }
  };

  const myTeamPlayers = myTeam ? [
    ...(myTeam.starters || []).filter(Boolean),
    ...(myTeam.bench || []).filter(Boolean)
  ] : [];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Transfers</h1>
          {transfersInfo && (
            <div className="flex gap-2">
              {transfersInfo.unlimited ? (
                <span className="badge badge-success">Unlimited Transfers</span>
              ) : transfersInfo.deadline_passed ? (
                <span className="badge badge-danger">Deadline Passed</span>
              ) : (
                <>
                  <span className="badge badge-primary">
                    {transfersInfo.available} / {transfersInfo.max} Available
                  </span>
                  <span className="badge badge-warning">
                    {transfersInfo.used} Used
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Transfer Interface */}
        {transfersInfo && !transfersInfo.deadline_passed && transfersInfo.available > 0 ? (
          <div>
            <h2 className="mb-2">Make a Transfer</h2>
            
            <div className="team-grid">
              {/* Player Out */}
              <div className="card" style={{ margin: 0 }}>
                <h3 style={{ marginBottom: '1rem' }}>Player Out</h3>
                {playerOut ? (
                  <div>
                    <PlayerCard player={playerOut} showStats={true} />
                    <button 
                      onClick={() => {
                        setPlayerOut(null);
                        setPlayerIn(null);
                        setPlayers([]);
                      }}
                      className="btn btn-secondary mt-2"
                      style={{ width: '100%' }}
                    >
                      Change Selection
                    </button>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: '#666', marginBottom: '1rem' }}>Select a player from your team:</p>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {myTeamPlayers.map(player => (
                        <div 
                          key={player.id}
                          onClick={() => setPlayerOut(player)}
                          style={{ marginBottom: '0.5rem', cursor: 'pointer' }}
                        >
                          <PlayerCard player={player} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Player In */}
              <div className="card" style={{ margin: 0 }}>
                <h3 style={{ marginBottom: '1rem' }}>Player In</h3>
                {playerOut ? (
                  <div>
                    {playerIn ? (
                      <div>
                        <PlayerCard player={playerIn} showStats={true} />
                        <div className="mt-2">
                          <div className="stat-box">
                            <div className="stat-label">Transfer Cost</div>
                            <div className="stat-value">
                              £{((playerIn.price - playerOut.price) / 1000).toFixed(2)}M
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={handleMakeTransfer}
                          className="btn btn-success mt-2"
                          style={{ width: '100%' }}
                        >
                          Confirm Transfer
                        </button>
                        <button 
                          onClick={() => setPlayerIn(null)}
                          className="btn btn-secondary mt-1"
                          style={{ width: '100%' }}
                        >
                          Change Selection
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="text"
                          className="form-input mb-2"
                          placeholder="Search players..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                        <p style={{ color: '#666', marginBottom: '1rem' }}>
                          Showing {playerOut.position}s:
                        </p>
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                          {players.filter(p => p.id !== playerOut.id).map(player => (
                            <div 
                              key={player.id}
                              onClick={() => setPlayerIn(player)}
                              style={{ marginBottom: '0.5rem', cursor: 'pointer' }}
                            >
                              <PlayerCard player={player} showStats={true} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="alert alert-info">
                    Select a player to transfer out first
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="alert alert-warning">
            {transfersInfo?.deadline_passed 
              ? 'Transfer deadline has passed for this gameweek'
              : 'No transfers available'}
          </div>
        )}

        {/* Transfer History */}
        <div className="mt-4">
          <h2 className="mb-2">Transfer History</h2>
          {history.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Gameweek</th>
                  <th>Out</th>
                  <th>In</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((transfer, idx) => (
                  <tr key={idx}>
                    <td>GW {transfer.gameweek?.round_number}</td>
                    <td>
                      {transfer.player_out?.name}
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        {transfer.player_out?.team} - {transfer.player_out?.position}
                      </div>
                    </td>
                    <td>
                      {transfer.player_in?.name}
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        {transfer.player_in?.team} - {transfer.player_in?.position}
                      </div>
                    </td>
                    <td>{new Date(transfer.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="alert alert-info">No transfers made yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Transfers;