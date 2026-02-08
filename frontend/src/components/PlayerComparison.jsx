import React, { useState, useEffect } from 'react';
import { getPlayer } from '../services/api';
import { formatPrice } from '../utils/formatters';
import LoadingSpinner from './LoadingSpinner';

function PlayerComparison({ players, onClose }) {
  const [detailedPlayers, setDetailedPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayerDetails();
  }, [players]);

  const loadPlayerDetails = async () => {
    try {
      const details = await Promise.all(
        players.map(p => getPlayer(p.id))
      );
      setDetailedPlayers(details.map(d => d.data.player));
    } catch (error) {
      console.error('Load comparison error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="container">
      <LoadingSpinner />
    </div>
  );

  // Get all unique gameweeks
  const allGameweeks = new Map();
  detailedPlayers.forEach(player => {
    player.gameweek_stats?.forEach(gw => {
      if (!allGameweeks.has(gw.gameweek_id)) {
        allGameweeks.set(gw.gameweek_id, gw.gameweek?.round_number);
      }
    });
  });
  const sortedGameweeks = Array.from(allGameweeks.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Player Comparison ({detailedPlayers.length})</h1>
          <button onClick={onClose} className="btn btn-secondary">
            Back to Players
          </button>
        </div>

        {/* Player Names */}
        <div className="comparison-players">
          {detailedPlayers.map(player => (
            <div key={player.id} className="comparison-player-card">
              <h3>{player.name}</h3>
              <div className="flex gap-1" style={{ justifyContent: 'center' }}>
                <span className="badge badge-primary">{player.team}</span>
                <span className="badge badge-secondary">{player.position}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Key Stats Comparison */}
        <h2 className="mt-4 mb-2">📊 Overview</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Stat</th>
                {detailedPlayers.map(player => (
                  <th key={player.id}>{player.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Price</strong></td>
                {detailedPlayers.map(p => (
                  <td key={p.id}><strong>{formatPrice(p.price)}</strong></td>
                ))}
              </tr>
              <tr>
                <td><strong>Total Points</strong></td>
                {detailedPlayers.map(p => {
                  const max = Math.max(...detailedPlayers.map(pl => pl.total_points || 0));
                  const isMax = (p.total_points || 0) === max;
                  return (
                    <td key={p.id}>
                      <strong style={{ color: isMax ? '#51cf66' : '#333' }}>
                        {p.total_points || 0}
                        {isMax && ' 🏆'}
                      </strong>
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td><strong>Avg Points</strong></td>
                {detailedPlayers.map(p => (
                  <td key={p.id}><strong>{p.form || '0.0'}</strong></td>
                ))}
              </tr>
              <tr>
                <td><strong>Ownership</strong></td>
                {detailedPlayers.map(p => (
                  <td key={p.id}>{p.ownership_percentage || 0}%</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Attacking Stats */}
        <h2 className="mt-4 mb-2">⚡ Attacking</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Stat</th>
                {detailedPlayers.map(player => (
                  <th key={player.id}>{player.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Appearances</strong></td>
                {detailedPlayers.map(p => (
                  <td key={p.id}>{p.stats?.appearances || 0}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Tries</strong></td>
                {detailedPlayers.map(p => {
                  const max = Math.max(...detailedPlayers.map(pl => pl.stats?.tries || 0));
                  const isMax = (p.stats?.tries || 0) === max && max > 0;
                  return (
                    <td key={p.id}>
                      <strong style={{ color: isMax ? '#51cf66' : '#333' }}>
                        {p.stats?.tries || 0}
                        {isMax && ' 🏆'}
                      </strong>
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td><strong>Try Assists</strong></td>
                {detailedPlayers.map(p => (
                  <td key={p.id}>{p.stats?.try_assists || 0}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Goals</strong></td>
                {detailedPlayers.map(p => {
                  const max = Math.max(...detailedPlayers.map(pl => pl.stats?.goals || 0));
                  const isMax = (p.stats?.goals || 0) === max && max > 0;
                  return (
                    <td key={p.id}>
                      <strong style={{ color: isMax ? '#51cf66' : '#333' }}>
                        {p.stats?.goals || 0}
                        {isMax && ' 🏆'}
                      </strong>
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td><strong>Clean Breaks</strong></td>
                {detailedPlayers.map(p => (
                  <td key={p.id}>{p.stats?.clean_breaks || 0}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Tackle Busts</strong></td>
                {detailedPlayers.map(p => (
                  <td key={p.id}>{p.stats?.tackle_busts || 0}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Offloads</strong></td>
                {detailedPlayers.map(p => (
                  <td key={p.id}>{p.stats?.offloads || 0}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Running Stats */}
        <h2 className="mt-4 mb-2">🏃 Running</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="comparison-table">
            <tbody>
              <tr>
                <td><strong>Total Metres</strong></td>
                {detailedPlayers.map(p => {
                  const max = Math.max(...detailedPlayers.map(pl => pl.stats?.metres || 0));
                  const isMax = (p.stats?.metres || 0) === max && max > 0;
                  return (
                    <td key={p.id}>
                      <strong style={{ color: isMax ? '#51cf66' : '#333' }}>
                        {p.stats?.metres || 0}m
                        {isMax && ' 🏆'}
                      </strong>
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td><strong>Carries</strong></td>
                {detailedPlayers.map(p => (
                  <td key={p.id}>{p.stats?.carries || 0}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Avg per Carry</strong></td>
                {detailedPlayers.map(p => {
                  const avg = p.stats?.carries > 0 
                    ? (p.stats.metres / p.stats.carries).toFixed(1) 
                    : 0;
                  return <td key={p.id}>{avg}m</td>;
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Defensive Stats */}
        <h2 className="mt-4 mb-2">🛡️ Defense</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="comparison-table">
            <tbody>
              <tr>
                <td><strong>Tackles</strong></td>
                {detailedPlayers.map(p => {
                  const max = Math.max(...detailedPlayers.map(pl => pl.stats?.tackles || 0));
                  const isMax = (p.stats?.tackles || 0) === max && max > 0;
                  return (
                    <td key={p.id}>
                      <strong style={{ color: isMax ? '#51cf66' : '#333' }}>
                        {p.stats?.tackles || 0}
                        {isMax && ' 🏆'}
                      </strong>
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td><strong>Avg per Game</strong></td>
                {detailedPlayers.map(p => {
                  const avg = p.stats?.appearances > 0 
                    ? (p.stats.tackles / p.stats.appearances).toFixed(1) 
                    : 0;
                  return <td key={p.id}>{avg}</td>;
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Week by Week Points */}
        <h2 className="mt-4 mb-2">📈 Week by Week Points</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Gameweek</th>
                {detailedPlayers.map(player => (
                  <th key={player.id}>{player.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedGameweeks.map(([gwId, gwNum]) => {
                const gwPoints = detailedPlayers.map(p => {
                  const gw = p.gameweek_stats?.find(g => g.gameweek_id === gwId);
                  return gw?.points || 0;
                });
                const maxPoints = Math.max(...gwPoints);

                return (
                  <tr key={gwId}>
                    <td><strong>GW {gwNum}</strong></td>
                    {detailedPlayers.map((p, idx) => {
                      const gw = p.gameweek_stats?.find(g => g.gameweek_id === gwId);
                      const points = gw?.points || 0;
                      const isMax = points === maxPoints && points > 0;
                      const played = gw?.played;

                      return (
                        <td key={p.id}>
                          {played ? (
                            <strong style={{ color: isMax ? '#51cf66' : '#333' }}>
                              {points}
                              {isMax && ' 🏆'}
                            </strong>
                          ) : (
                            <span style={{ color: '#999' }}>DNP</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Total Comparison Summary */}
        <div className="alert alert-info mt-4">
          <strong>🏆 Best Overall:</strong> {
            detailedPlayers.reduce((best, p) => 
              (p.total_points || 0) > (best.total_points || 0) ? p : best
            ).name
          } ({detailedPlayers.reduce((best, p) => 
              (p.total_points || 0) > (best.total_points || 0) ? p : best
            ).total_points || 0} points)
        </div>
      </div>
    </div>
  );
}

export default PlayerComparison;