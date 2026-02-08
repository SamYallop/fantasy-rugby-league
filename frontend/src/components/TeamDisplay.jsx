import React from 'react';

function TeamDisplay({ team, captain }) {
  if (!team || team.length === 0) {
    return <div className="alert alert-info">No team selected yet</div>;
  }

  return (
    <div className="pitch">
      <div className="pitch-lines"></div>
      
      {/* Full Back */}
      <div className="position-row">
        {team.filter(p => p?.position === 'Full Back').map(player => (
          <div key={player.id} className="player-slot">
            <div className="player-name">
              {player.name}
              {captain === player.id && <span className="captain-badge">C</span>}
            </div>
            <div style={{fontSize: '0.85rem', color: '#666'}}>{player.position}</div>
          </div>
        ))}
      </div>

      {/* Wingers & Centres */}
      <div className="position-row">
        {team.filter(p => p?.position === 'Winger' || p?.position === 'Centre').map(player => (
          <div key={player.id} className="player-slot">
            <div className="player-name">
              {player.name}
              {captain === player.id && <span className="captain-badge">C</span>}
            </div>
            <div style={{fontSize: '0.85rem', color: '#666'}}>{player.position}</div>
          </div>
        ))}
      </div>

      {/* Half Backs */}
      <div className="position-row">
        {team.filter(p => p?.position === 'Stand Off' || p?.position === 'Scrum Half').map(player => (
          <div key={player.id} className="player-slot">
            <div className="player-name">
              {player.name}
              {captain === player.id && <span className="captain-badge">C</span>}
            </div>
            <div style={{fontSize: '0.85rem', color: '#666'}}>{player.position}</div>
          </div>
        ))}
      </div>

      {/* Props & Hooker */}
      <div className="position-row">
        {team.filter(p => p?.position === 'Prop' || p?.position === 'Hooker').map(player => (
          <div key={player.id} className="player-slot">
            <div className="player-name">
              {player.name}
              {captain === player.id && <span className="captain-badge">C</span>}
            </div>
            <div style={{fontSize: '0.85rem', color: '#666'}}>{player.position}</div>
          </div>
        ))}
      </div>

      {/* Back Row */}
      <div className="position-row">
        {team.filter(p => p?.position === 'Second Row' || p?.position === 'Loose Forward').map(player => (
          <div key={player.id} className="player-slot">
            <div className="player-name">
              {player.name}
              {captain === player.id && <span className="captain-badge">C</span>}
            </div>
            <div style={{fontSize: '0.85rem', color: '#666'}}>{player.position}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeamDisplay;