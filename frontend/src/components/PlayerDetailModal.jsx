import React, { useState, useEffect } from 'react';
import { getPlayer } from '../services/api';
import { formatPrice } from '../utils/formatters';
import LoadingSpinner from './LoadingSpinner';

function PlayerDetailModal({ playerId, onClose }) {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayerDetails();
  }, [playerId]);

  const loadPlayerDetails = async () => {
    try {
      const response = await getPlayer(playerId);
      setPlayer(response.data.player);
    } catch (error) {
      console.error('Player details error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <LoadingSpinner />
      </div>
    </div>
  );

  if (!player) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content player-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="player-detail-header">
          <h2>{player.name}</h2>
          <div className="player-detail-meta">
            <span className="badge badge-primary">{player.team}</span>
            <span className="badge badge-secondary">{player.position}</span>
          </div>
        </div>

        {/* Key Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Price</div>
            <div className="stat-value">{formatPrice(player.price)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Points</div>
            <div className="stat-value">{player.total_points || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ownership</div>
            <div className="stat-value">{player.ownership_percentage || 0}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Points</div>
            <div className="stat-value">{player.form || '0.0'}</div>
          </div>
        </div>

        {/* Season Statistics - Attacking */}
        {player.stats && (
          <>
            <div className="player-stats-section">
              <h3>⚡ Attacking Stats</h3>
              <div className="stats-grid-compact">
                <div className="stat-item">
                  <span className="stat-item-label">Appearances</span>
                  <strong className="stat-item-value">{player.stats.appearances || 0}</strong>
                </div>
                <div className="stat-item">
                  <span className="stat-item-label">Tries</span>
                  <strong className="stat-item-value">{player.stats.tries || 0}</strong>
                </div>
                <div className="stat-item">
                  <span className="stat-item-label">Try Assists</span>
                  <strong className="stat-item-value">{player.stats.try_assists || 0}</strong>
                </div>
                <div className="stat-item">
                  <span className="stat-item-label">Goals</span>
                  <strong className="stat-item-value">{player.stats.goals || 0}</strong>
                </div>
                <div className="stat-item">
                  <span className="stat-item-label">Clean Breaks</span>
                  <strong className="stat-item-value">{player.stats.clean_breaks || 0}</strong>
                </div>
                <div className="stat-item">
                  <span className="stat-item-label">Tackle Busts</span>
                  <strong className="stat-item-value">{player.stats.tackle_busts || 0}</strong>
                </div>
                <div className="stat-item">
                  <span className="stat-item-label">Offloads</span>
                  <strong className="stat-item-value">{player.stats.offloads || 0}</strong>
                </div>
                <div className="stat-item">
                  <span className="stat-item-label">40/20 Kicks</span>
                  <strong className="stat-item-value">{player.stats.forty_twenty || 0}</strong>
                </div>
              </div>
            </div>

            {/* Running Stats */}
            <div className="player-stats-section">
              <h3>🏃 Running Stats</h3>
              <div className="stats-grid-compact">
                <div className="stat-item">
                  <span className="stat-item-label">Metres</span>
                  <strong className="stat-item-value">{player.stats.metres || 0}m</strong>
                </div>
                <div className="stat-item">
                  <span className="stat-item-label">Carries</span>
                  <strong className="stat-item-value">{player.stats.carries || 0}</strong>
                </div>
                <div className="stat-item">
                  <span className="stat-item-label">Runs from DH</span>
                  <strong className="stat-item-value">{player.stats.runs_from_dummy_half || 0}</strong>
                </div>
                <div className="stat-item">
                  <span className="stat-item-label">Avg per Carry</span>
                  <strong className="stat-item-value">
                    {player.stats.carries > 0 
                      ? (player.stats.metres / player.stats.carries).toFixed(1) 
                      : 0}m
                  </strong>
                </div>
              </div>
            </div>

            {/* Defensive Stats */}
            <div className="player-stats-section">
              <h3>🛡️ Defensive Stats</h3>
              <div className="stats-grid-compact">
                <div className="stat-item">
                  <span className="stat-item-label">Tackles</span>
                  <strong className="stat-item-value">{player.stats.tackles || 0}</strong>
                </div>
                <div className="stat-item">
                  <span className="stat-item-label">Marker Tackles</span>
                  <strong className="stat-item-value">{player.stats.marker_tackles || 0}</strong>
                </div>
                <div className="stat-item">
                  <span className="stat-item-label">Avg per Game</span>
                  <strong className="stat-item-value">
                    {player.stats.appearances > 0 
                      ? (player.stats.tackles / player.stats.appearances).toFixed(1) 
                      : 0}
                  </strong>
                </div>
              </div>
            </div>

            {/* Discipline */}
            <div className="player-stats-section">
              <h3>📋 Discipline</h3>
              <div className="stats-grid-compact">
                <div className="stat-item">
                  <span className="stat-item-label">Errors</span>
                  <strong className="stat-item-value" style={{ color: player.stats.errors > 5 ? '#ff6b6b' : '#333' }}>
                    {player.stats.errors || 0}
                  </strong>
                </div>
                <div className="stat-item">
                  <span className="stat-item-label">Penalties</span>
                  <strong className="stat-item-value" style={{ color: player.stats.penalties > 5 ? '#ff6b6b' : '#333' }}>
                    {player.stats.penalties || 0}
                  </strong>
                </div>
                <div className="stat-item">
                  <span className="stat-item-label">Yellow Cards</span>
                  <strong className="stat-item-value" style={{ color: player.stats.yellow_cards > 0 ? '#fab005' : '#333' }}>
                    {player.stats.yellow_cards || 0}
                  </strong>
                </div>
                <div className="stat-item">
                  <span className="stat-item-label">Red Cards</span>
                  <strong className="stat-item-value" style={{ color: player.stats.red_cards > 0 ? '#ff6b6b' : '#333' }}>
                    {player.stats.red_cards || 0}
                  </strong>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Recent Form */}
        {player.gameweek_stats && player.gameweek_stats.length > 0 && (
          <div className="player-stats-section">
            <h3>📊 Recent Gameweeks</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>GW</th>
                    <th>Played</th>
                    <th>Points</th>
                    <th>Tries</th>
                    <th>Goals</th>
                    <th>Metres</th>
                    <th>Tackles</th>
                  </tr>
                </thead>
                <tbody>
                  {player.gameweek_stats.slice(0, 10).map((gw) => (
                    <tr key={gw.gameweek_id}>
                      <td><strong>GW{gw.gameweek?.round_number}</strong></td>
                      <td>{gw.played ? '✓' : '✗'}</td>
                      <td><strong>{gw.points || 0}</strong></td>
                      <td>{gw.tries || 0}</td>
                      <td>{gw.goals || 0}</td>
                      <td>{gw.metres || 0}m</td>
                      <td>{gw.tackles || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button onClick={onClose} className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem' }}>
          Close
        </button>
      </div>
    </div>
  );
}

export default PlayerDetailModal;