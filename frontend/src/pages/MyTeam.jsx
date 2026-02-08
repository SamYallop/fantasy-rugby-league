import React, { useState, useEffect } from 'react';
import { getMyTeam, selectTeam, getPlayers, getCurrentGameweek } from '../services/api';
import { formatPrice } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';

function MyTeam() {
  const [team, setTeam] = useState(null);
  const [gameweek, setGameweek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState(null);
  
  // Team structure
  const [starters, setStarters] = useState({
    fullback: null,
    winger1: null,
    winger2: null,
    centre1: null,
    centre2: null,
    halfback1: null,
    halfback2: null,
    prop1: null,
    prop2: null,
    hooker: null,
    secondrow1: null,
    secondrow2: null,
    loose: null
  });
  const [bench, setBench] = useState([null, null, null, null]);
  const [captain, setCaptain] = useState(null);

  const positionSlots = [
    { key: 'fullback', label: 'Full Back', position: 'Full Back' },
    { key: 'winger1', label: 'Winger', position: 'Winger' },
    { key: 'winger2', label: 'Winger', position: 'Winger' },
    { key: 'centre1', label: 'Centre', position: 'Centre' },
    { key: 'centre2', label: 'Centre', position: 'Centre' },
    { key: 'halfback1', label: 'Half Back', position: ['Stand Off', 'Scrum Half'] },
    { key: 'halfback2', label: 'Half Back', position: ['Stand Off', 'Scrum Half'] },
    { key: 'prop1', label: 'Prop', position: 'Prop' },
    { key: 'prop2', label: 'Prop', position: 'Prop' },
    { key: 'hooker', label: 'Hooker', position: 'Hooker' },
    { key: 'secondrow1', label: 'Second Row', position: 'Second Row' },
    { key: 'secondrow2', label: 'Second Row', position: 'Second Row' },
    { key: 'loose', label: 'Loose Forward', position: 'Loose Forward' }
  ];

  useEffect(() => {
    loadTeam();
  }, []);

  useEffect(() => {
    if (selectedSlot) {
      loadPlayersForPosition(selectedSlot.position);
    }
  }, [selectedSlot, searchTerm]);

  const loadTeam = async () => {
    try {
      const [teamRes, gwRes] = await Promise.all([
        getMyTeam(),
        getCurrentGameweek()
      ]);
      
      setGameweek(gwRes.data.gameweek);
      
      if (teamRes.data.team) {
        setTeam(teamRes.data.team);
        loadExistingTeam(teamRes.data.team);
      } else {
        setEditMode(true); // No team, go straight to edit mode
      }
    } catch (error) {
      console.error('Team load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingTeam = (teamData) => {
    const startersData = teamData.starters?.filter(Boolean) || [];
    const benchData = teamData.bench?.filter(Boolean) || [];
    
    // Map existing players to position slots
    const newStarters = { ...starters };
    positionSlots.forEach((slot, idx) => {
      if (startersData[idx]) {
        newStarters[slot.key] = startersData[idx];
      }
    });
    
    setStarters(newStarters);
    setBench(benchData.length === 4 ? benchData : [null, null, null, null]);
    setCaptain(teamData.captain_id);
  };

const loadPlayersForPosition = async (position) => {
    try {
      // BENCH: Load ALL players when position is null/undefined
      if (!position || position === null) {
        console.log('Loading ALL players for bench');
        const response = await getPlayers({ pageSize: 500 });
        
        // Filter out already selected players
        const selectedPlayerIds = [
          ...Object.values(starters).filter(Boolean).map(p => p.id),
          ...bench.filter(Boolean).map(p => p.id)
        ];
        
        const filtered = response.data.players.filter(p => !selectedPlayerIds.includes(p.id));
        console.log('Bench players available:', filtered.length);
        setAvailablePlayers(filtered);
        return;
      }

      // SPECIFIC POSITIONS: Load players for that position(s)
      const positions = Array.isArray(position) ? position : [position];
      const allPlayers = [];
      
      for (const pos of positions) {
        console.log('Loading position:', pos);
        const response = await getPlayers({ 
          position: pos,
          pageSize: 200 
        });
        console.log('Found', response.data.players.length, 'players for', pos);
        allPlayers.push(...response.data.players);
      }
      
      // Remove duplicates and already selected players
      const selectedPlayerIds = [
        ...Object.values(starters).filter(Boolean).map(p => p.id),
        ...bench.filter(Boolean).map(p => p.id)
      ];
      
      const uniquePlayers = Array.from(
        new Map(allPlayers.map(p => [p.id, p])).values()
      );
      
      const filtered = uniquePlayers.filter(p => !selectedPlayerIds.includes(p.id));
      console.log('Filtered players:', filtered.length);
      setAvailablePlayers(filtered);
    } catch (error) {
      console.error('Players load error:', error);
      setAvailablePlayers([]);
    }
  };

  const handleSlotClick = (slotKey, position, isBench = false, benchIndex = null) => {
    if (!editMode) return;
    
    setSelectedSlot({ 
      key: slotKey, 
      position, 
      isBench, 
      benchIndex 
    });
    setSearchTerm('');
  };

  const handlePlayerSelect = (player) => {
    if (!selectedSlot) return;

    if (selectedSlot.isBench) {
      const newBench = [...bench];
      newBench[selectedSlot.benchIndex] = player;
      setBench(newBench);
    } else {
      setStarters({ ...starters, [selectedSlot.key]: player });
    }
    
    setSelectedSlot(null);
    setAvailablePlayers([]);
  };

  const handleRemovePlayer = (slotKey, isBench = false, benchIndex = null) => {
    if (!editMode) return;
    
    if (isBench) {
      const newBench = [...bench];
      newBench[benchIndex] = null;
      setBench(newBench);
    } else {
      setStarters({ ...starters, [slotKey]: null });
      if (starters[slotKey]?.id === captain) {
        setCaptain(null);
      }
    }
  };

  const handleSaveTeam = async () => {
    setMessage(null);

    // Validate team
    const startersList = Object.values(starters).filter(Boolean);
    const benchList = bench.filter(Boolean);
    
    if (startersList.length !== 13) {
      setMessage({ type: 'error', text: 'Please select all 13 starters' });
      return;
    }
    
    if (benchList.length !== 4) {
      setMessage({ type: 'error', text: 'Please select all 4 bench players' });
      return;
    }
    
    if (!captain) {
      setMessage({ type: 'error', text: 'Please select a captain' });
      return;
    }

    try {
      const starterIds = positionSlots.map(slot => starters[slot.key]?.id);
      const benchIds = bench.map(p => p?.id);
      
      await selectTeam(starterIds, benchIds, captain);
      setMessage({ type: 'success', text: 'Team saved successfully!' });
      setEditMode(false);
      
      // Reload team to get fresh data
      setTimeout(() => {
        loadTeam();
        setMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save team' });
    }
  };

  // Calculate team stats
  const selectedPlayers = [...Object.values(starters).filter(Boolean), ...bench.filter(Boolean)];
  const selectedCount = selectedPlayers.length;
  const totalCost = selectedPlayers.reduce((sum, p) => sum + (p.price || 0), 0);
  const remaining = 1000000 - totalCost;

  // Calculate total points
  const totalPoints = Object.values(starters)
    .filter(Boolean)
    .reduce((sum, p) => sum + (p.total_points || 0), 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container">
      <div className="card">
        {/* Header */}
        <div className="card-header">
          <h1 className="card-title">{team?.team_name || 'My Team'}</h1>
          {!editMode && team && (
            <button 
              onClick={() => setEditMode(true)}
              className="btn btn-primary"
            >
              Edit Team
            </button>
          )}
        </div>

        {/* Messages */}
        {message && (
          <div className={`alert alert-${message.type}`} style={{ marginBottom: '1rem' }}>
            {message.text}
          </div>
        )}

        {/* Budget Display */}
        {editMode ? (
          <div className="budget-display">
            <div className="budget-item">
              <span>Selected:</span>
              <strong>{selectedCount} / 17</strong>
            </div>
            <div className="budget-item">
              <span>Spent:</span>
              <strong>{formatPrice(totalCost)}</strong>
            </div>
            <div className="budget-item">
              <span>Remaining:</span>
              <strong style={{ color: remaining < 0 ? '#ff6b6b' : '#00d4ff' }}>
                {formatPrice(remaining)}
              </strong>
            </div>
          </div>
        ) : team && (
          <div className="budget-display">
            <div className="budget-item">
              <span>Team Value:</span>
              <strong>{formatPrice(totalCost)}</strong>
            </div>
            <div className="budget-item">
              <span>Total Points:</span>
              <strong style={{ color: '#00d4ff', fontSize: '1.25rem' }}>{totalPoints}</strong>
            </div>
          </div>
        )}

        <div className="team-grid">
          {/* Starting XIII */}
          <div>
            <h2 className="mb-2">Starting XIII</h2>
            <div className="pitch">
              {positionSlots.map((slot) => {
                const player = starters[slot.key];
                return (
                  <div 
                    key={slot.key}
                    className={`player-slot ${editMode ? 'editable' : ''} ${selectedSlot?.key === slot.key ? 'selecting' : ''}`}
                    onClick={() => handleSlotClick(slot.key, slot.position)}
                    style={{ 
                      marginBottom: '0.5rem',
                      cursor: editMode ? 'pointer' : 'default',
                      position: 'relative'
                    }}
                  >
                    {player ? (
                      <>
                        <div className="player-name">
                          {player.name}
                          {captain === player.id && <span className="captain-badge">C</span>}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                          {player.team} • {formatPrice(player.price)}
                        </div>
                        {/* ADDED: Player Points Display */}
                        {!editMode && (
                          <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                            <strong style={{ color: '#00d4ff' }}>
                              {player.total_points || 0} pts
                            </strong>
                            {player.last_gw_points !== undefined && (
                              <span style={{ color: '#888', marginLeft: '0.5rem' }}>
                                (Last: {player.last_gw_points})
                              </span>
                            )}
                          </div>
                        )}
                        {editMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePlayer(slot.key);
                            }}
                            style={{
                              position: 'absolute',
                              top: '0.25rem',
                              right: '0.25rem',
                              background: '#ff6b6b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              cursor: 'pointer',
                              fontSize: '1rem',
                              lineHeight: 1
                            }}
                          >
                            ×
                          </button>
                        )}
                      </>
                    ) : (
                      <div style={{ color: '#999', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                          {editMode ? 'Click to select' : 'Empty'}
                        </div>
                        <div style={{ fontSize: '0.8rem' }}>{slot.label}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Captain Selection */}
            {editMode && Object.values(starters).filter(Boolean).length === 13 && (
              <div className="mt-3">
                <label className="form-label">Select Captain (2x points)</label>
                <select 
                  className="form-select"
                  value={captain || ''}
                  onChange={(e) => setCaptain(e.target.value)}
                >
                  <option value="">Choose captain...</option>
                  {Object.values(starters).filter(Boolean).map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.position})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Bench & Player Selection */}
          <div>
            {/* Bench */}
            <h2 className="mb-2">Bench</h2>
            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '2rem' }}>
              {bench.map((player, idx) => (
                <div
                  key={idx}
                  className={`player-slot ${editMode ? 'editable' : ''} ${selectedSlot?.benchIndex === idx ? 'selecting' : ''}`}
                  onClick={() => handleSlotClick(`bench${idx}`, null, true, idx)}
                  style={{ 
                    cursor: editMode ? 'pointer' : 'default',
                    position: 'relative'
                  }}
                >
                  {player ? (
                    <>
                      <div className="player-name">{player.name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        {player.team} • {player.position} • {formatPrice(player.price)}
                      </div>
                      {/* ADDED: Bench Player Points Display */}
                      {!editMode && (
                        <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                          <strong style={{ color: '#00d4ff' }}>
                            {player.total_points || 0} pts
                          </strong>
                          {player.last_gw_points !== undefined && (
                            <span style={{ color: '#888', marginLeft: '0.5rem' }}>
                              (Last: {player.last_gw_points})
                            </span>
                          )}
                        </div>
                      )}
                      {editMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePlayer(null, true, idx);
                          }}
                          style={{
                            position: 'absolute',
                            top: '0.25rem',
                            right: '0.25rem',
                            background: '#ff6b6b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            lineHeight: 1
                          }}
                        >
                          ×
                        </button>
                      )}
                    </>
                  ) : (
                    <div style={{ color: '#999', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.9rem' }}>
                        {editMode ? 'Click to select' : 'Empty'}
                      </div>
                      <div style={{ fontSize: '0.8rem' }}>Bench {idx + 1}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Player Selection Panel */}
            {selectedSlot && editMode && (
              <div className="card" style={{ background: '#f8f9fa', margin: 0 }}>
                <h3 className="mb-2">
                  Select {selectedSlot.isBench ? 'Any Player' : 
                    Array.isArray(selectedSlot.position) ? selectedSlot.position.join(' / ') : selectedSlot.position}
                </h3>
                
                <input
                  type="text"
                  className="form-input mb-2"
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {availablePlayers.length > 0 ? (
                    availablePlayers
                      .filter(p => 
                        !searchTerm || 
                        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.team.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map(player => (
                        <div
                          key={player.id}
                          className="player-card"
                          onClick={() => handlePlayerSelect(player)}
                          style={{ marginBottom: '0.5rem', cursor: 'pointer' }}
                        >
                          <div className="player-name">{player.name}</div>
                          <div className="player-info">
                            <span>{player.team}</span>
                            <span>{player.position}</span>
                          </div>
                          <div className="player-info">
                            <span><strong>Points:</strong> {player.total_points || 0}</span>
                          </div>
                          <div className="player-price">{formatPrice(player.price)}</div>
                        </div>
                      ))
                  ) : (
                    <div className="alert alert-info">Loading players...</div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedSlot(null);
                    setAvailablePlayers([]);
                  }}
                  className="btn btn-secondary mt-2"
                  style={{ width: '100%' }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Save Button */}
            {editMode && !selectedSlot && (
              <button
                onClick={handleSaveTeam}
                className="btn btn-success"
                style={{ width: '100%' }}
                disabled={selectedCount !== 17 || !captain || remaining < 0}
              >
                Save Team
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyTeam;
