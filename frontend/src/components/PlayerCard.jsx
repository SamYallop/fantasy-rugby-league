import React from 'react';
import { formatPrice } from '../utils/formatters';

function PlayerCard({ player, onClick, selected, showStats = false }) {
  return (
    <div 
      className={`player-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="player-name">{player.name}</div>
      <div className="player-info">
        <span>{player.team}</span>
        <span>{player.position}</span>
      </div>
      {showStats && (
        <div className="player-info">
          <span>Points: {player.total_points || 0}</span>
          {player.ownership_percentage && (
            <span>Owned: {player.ownership_percentage}%</span>
          )}
        </div>
      )}
      <div className="player-price">{formatPrice(player.price)}</div>
    </div>
  );
}

export default PlayerCard;