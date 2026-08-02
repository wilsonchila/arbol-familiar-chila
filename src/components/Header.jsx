import { useState } from 'react';
import { isAdmin } from '../services/validationService';
import '../styles/main.css';

export default function Header({ user, stats, suggestionsCount, onShowSuggestions, onShowChat, onSignOut, onRefresh, roleOverride, onRoleChange }) {
  const admin = isAdmin(user?.email);
  const [filteredList, setFilteredList] = useState(null);

  const handleClick = (type) => {
    setFilteredList(type);
  };

  const handleClose = () => setFilteredList(null);

  const getList = () => {
    if (!filteredList) return [];
    return stats.approved.filter(p => {
      if (filteredList === 'total') return true;
      if (filteredList === 'alive') return p.isAlive === true || p.isAlive === 'true' || p.isAlive === 'TRUE';
      if (filteredList === 'deceased') return !(p.isAlive === true || p.isAlive === 'true' || p.isAlive === 'TRUE');
      return false;
    });
  };

  const list = getList();
  const labels = { total: 'Todos los Miembros', alive: 'Miembros Vivos', deceased: 'Miembros Fallecidos' };

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-brand">
          <span className="brand-icon">👴</span>
          <h1>Familiares de Santiago Chila</h1>
        </div>
      </div>

      <div className="header-center">
        <div className="stats-bar">
          <div className="stat-item clickable" onClick={() => handleClick('total')}>
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Miembros</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item clickable" onClick={() => handleClick('alive')}>
            <span className="stat-value stat-alive">{stats.alive}</span>
            <span className="stat-label">Vivos</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item clickable" onClick={() => handleClick('deceased')}>
            <span className="stat-value stat-deceased">{stats.deceased}</span>
            <span className="stat-label">Fallecidos</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <button className="chat-toggle-btn" onClick={onShowChat} title="Chat familiar">
          &#128172;
        </button>

        {admin && suggestionsCount > 0 && (
          <button className="suggestions-btn" onClick={onShowSuggestions}>
            <span className="badge">{suggestionsCount}</span>
            Sugerencias
          </button>
        )}

        <button className="refresh-btn" onClick={onRefresh} title="Recargar datos">
          🔄
        </button>

        <div className="user-info">
          {user?.picture && (
            <img src={user.picture} alt={user.name} className="user-avatar" />
          )}
          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            <span className="user-email">{user?.email}</span>
            <div className="role-selector">
              <select
                className="role-select"
                value={roleOverride || (admin ? 'admin' : 'user')}
                onChange={(e) => onRoleChange(e.target.value === (admin ? 'admin' : 'user') ? null : e.target.value)}
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="user">Usuario</option>
              </select>
              <span className={`role-badge ${roleOverride || (admin ? 'admin' : 'user')}`}>
                {roleOverride || (admin ? 'admin' : 'user')}
              </span>
            </div>
          </div>
        </div>

        <button className="signout-btn" onClick={onSignOut}>
          Cerrar sesión
        </button>
      </div>

      {filteredList && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-list" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {labels[filteredList]}
                <span className="modal-count">({list.length})</span>
              </h3>
              <button className="close-btn" onClick={handleClose}>&#10005;</button>
            </div>
            <ul className="persons-name-list">
              {list
                .sort((a, b) => {
                  const nameA = `${a.firstName || ''} ${a.paternalLastName || ''}`.toLowerCase();
                  const nameB = `${b.firstName || ''} ${b.paternalLastName || ''}`.toLowerCase();
                  return nameA.localeCompare(nameB);
                })
                .map(p => (
                  <li key={p.id}>
                    {p.firstName || ''} {p.paternalLastName || ''} {p.maternalLastName || ''}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
