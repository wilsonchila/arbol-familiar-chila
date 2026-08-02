import { useState } from 'react';
import { computeStats, isPersonAlive } from '../utils/treeBuilder';
import '../styles/main.css';

export default function StatsBar({ persons }) {
  const stats = computeStats(persons);
  const [filteredList, setFilteredList] = useState(null);

  const approved = persons.filter(p => p.status === 'approved');

  const handleClick = (type) => {
    let filtered;
    if (type === 'total') {
      filtered = approved;
    } else if (type === 'alive') {
      filtered = approved.filter(p => isPersonAlive(p));
    } else if (type === 'deceased') {
      filtered = approved.filter(p => !isPersonAlive(p));
    }
    setFilteredList({ type, list: filtered });
  };

  const handleClose = () => setFilteredList(null);

  return (
    <div className="stats-bar-detailed">
      <div className="stats-section">
        <h3>Resumen General</h3>
        <div className="stats-grid">
          <button className="stat-card clickable" onClick={() => handleClick('total')}>
            <div className="stat-number">{stats.total}</div>
            <div className="stat-description">Total Miembros</div>
          </button>
          <button className="stat-card alive clickable" onClick={() => handleClick('alive')}>
            <div className="stat-number">{stats.alive}</div>
            <div className="stat-description">Vivos</div>
          </button>
          <button className="stat-card deceased clickable" onClick={() => handleClick('deceased')}>
            <div className="stat-number">{stats.deceased}</div>
            <div className="stat-description">Fallecidos</div>
          </button>
        </div>
      </div>

      <div className="stats-section">
        <h3>Por Generación</h3>
        <div className="generation-stats">
          {Object.entries(stats.generations)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([gen, count]) => (
              <div key={gen} className="generation-stat">
                <span className="gen-label">Gen {gen}</span>
                <span className="gen-count">{count}</span>
                <div className="gen-bar">
                  <div
                    className="gen-bar-fill"
                    style={{ width: `${(count / stats.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {filteredList && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-list" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {filteredList.type === 'total' && 'Todos los Miembros'}
                {filteredList.type === 'alive' && 'Miembros Vivos'}
                {filteredList.type === 'deceased' && 'Miembros Fallecidos'}
                <span className="modal-count">({filteredList.list.length})</span>
              </h3>
              <button className="close-btn" onClick={handleClose}>&#10005;</button>
            </div>
            <ul className="persons-name-list">
              {filteredList.list
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
    </div>
  );
}
