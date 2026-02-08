import React, { useState, useEffect } from 'react';
import { getPlayers, getTeams, getPositions } from '../services/api';
import { formatPrice } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';
import PlayerDetailModal from '../components/PlayerDetailModal';
import PlayerComparison from '../components/PlayerComparison';

function Players() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [filters, setFilters] = useState({
    team: '',
    position: '',
    search: '',
    sortBy: 'total_points',
    sortOrder: 'desc'
  });
  const [compareMode, setCompareMode] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadPlayers();
  }, [filters, pagination.page]);

  const loadData = async () => {
    try {
      const [teamsRes, positionsRes] = await Promise.all([
        getTeams(),
        getPositions()
      ]);
      setTeams(teamsRes.data.teams);
      setPositions(positionsRes.data.positions);
      loadPlayers();
    } catch (error) {
      console.error('Data load error:', error);
      setLoading(false);
    }
  };

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const response = await getPlayers({
        ...filters,
        page: pagination.page,
        pageSize: pagination.pageSize
      });
      
      let sortedPlayers = [...response.data.players];
      const { sortBy, sortOrder } = filters;
      
      sortedPlayers.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
          return sortOrder === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
      
      setPlayers(sortedPlayers);
      setPagination(prev => ({ ...prev, total: response.data.total || sortedPlayers.length }));
    } catch (error) {
      console.error('Players load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player.id);
  };

  const handleCompareToggle = (player) => {
    if (compareList.find(p => p.id === player.id)) {
      setCompareList(compareList.filter(p => p.id !== player.id));
    } else {
      if (compareList.length < 4) {
        setCompareList([...compareList, player]);
      }
    }
  };

  const handleViewComparison = () => {
    setShowComparison(true);
    setCompareMode(false);
  };

  const handleSortChange = (sortBy) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getSortIcon = (column) => {
    if (filters.sortBy !== column) return '⇅';
    return filters.sortOrder === 'desc' ? '↓' : '↑';
  };

  const clearFilters = () => {
    setFilters({
      team: '',
      position: '',
      search: '',
      sortBy: 'total_points',
      sortOrder: 'desc'
    });
  };

  // Show comparison view if active
  if (showComparison && compareList.length > 1) {
    return (
      <PlayerComparison 
        players={compareList}
        onClose={() => setShowComparison(false)}
      />
    );
  }

  if (loading && players.length === 0) return <LoadingSpinner />;

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Player Browser</h1>
          <div className="flex gap-2">
            {compareList.length > 1 && !compareMode && (
              <button 
                onClick={handleViewComparison}
                className="btn btn-success"
              >
                View Comparison ({compareList.length})
              </button>
            )}
            <button 
              onClick={() => setCompareMode(!compareMode)}
              className={`btn ${compareMode ? 'btn-primary' : 'btn-secondary'}`}
            >
              {compareMode ? 'Exit Compare' : 'Compare Players'}
            </button>
            {(filters.team || filters.position || filters.search) && (
              <button onClick={clearFilters} className="btn btn-secondary">
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="filters">
          <div className="filter-group">
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-input"
              placeholder="Player name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="filter-group">
            <label className="form-label">Team</label>
            <select
              className="form-select"
              value={filters.team}
              onChange={(e) => setFilters({ ...filters, team: e.target.value })}
            >
              <option value="">All Teams</option>
              {teams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="form-label">Position</label>
            <select
              className="form-select"
              value={filters.position}
              onChange={(e) => setFilters({ ...filters, position: e.target.value })}
            >
              <option value="">All Positions</option>
              {positions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Compare Mode Notice */}
        {compareMode && (
          <div className="alert alert-info">
            Select up to 4 players to compare ({compareList.length}/4 selected)
            {compareList.length > 1 && (
              <button 
                onClick={handleViewComparison}
                className="btn btn-primary"
                style={{ marginLeft: '1rem' }}
              >
                View Comparison
              </button>
            )}
          </div>
        )}

        {/* Players Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                {compareMode && <th>Compare</th>}
                <th onClick={() => handleSortChange('name')} style={{ cursor: 'pointer' }}>
                  Name {getSortIcon('name')}
                </th>
                <th onClick={() => handleSortChange('team')} style={{ cursor: 'pointer' }}>
                  Team {getSortIcon('team')}
                </th>
                <th onClick={() => handleSortChange('position')} style={{ cursor: 'pointer' }}>
                  Position {getSortIcon('position')}
                </th>
                <th onClick={() => handleSortChange('price')} style={{ cursor: 'pointer' }}>
                  Price {getSortIcon('price')}
                </th>
                <th onClick={() => handleSortChange('total_points')} style={{ cursor: 'pointer' }}>
                  Points {getSortIcon('total_points')}
                </th>
                <th>Ownership</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => {
                const isComparing = compareList.find(p => p.id === player.id);
                return (
                  <tr 
                    key={player.id}
                    style={{ 
                      background: isComparing ? '#e6f7ff' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => !compareMode && handlePlayerClick(player)}
                  >
                    {compareMode && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={!!isComparing}
                          onChange={() => handleCompareToggle(player)}
                          disabled={!isComparing && compareList.length >= 4}
                        />
                      </td>
                    )}
                    <td><strong>{player.name}</strong></td>
                    <td>{player.team}</td>
                    <td>{player.position}</td>
                    <td><strong>{formatPrice(player.price)}</strong></td>
                    <td><strong>{player.total_points || 0}</strong></td>
                    <td>{player.ownership_percentage || 0}%</td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayerClick(player);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                      >
                        View Stats
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {players.length === 0 && !loading && (
          <div className="alert alert-info">No players found with current filters</div>
        )}

        {/* Pagination */}
        {pagination.total > pagination.pageSize && (
          <div className="flex-between mt-3">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              className="btn btn-secondary"
              disabled={pagination.page === 1}
            >
              Previous
            </button>
            <span>Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}</span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              className="btn btn-secondary"
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          playerId={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}

export default Players;