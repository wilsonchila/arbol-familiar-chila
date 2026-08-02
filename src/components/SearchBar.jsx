import { useState, useMemo } from 'react';
import { getPersonFullName } from '../utils/treeBuilder';
import '../styles/main.css';

export default function SearchBar({ persons, onSelectPerson }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return persons.filter(p => {
      const name = getPersonFullName(p).toLowerCase();
      const email = (p.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    }).slice(0, 10);
  }, [query, persons]);

  const handleSelect = (person) => {
    setQuery('');
    setIsOpen(false);
    onSelectPerson(person);
  };

  return (
    <div className="search-bar">
      <div className="search-input-container">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por nombre o email..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <button className="search-clear" onClick={() => { setQuery(''); setIsOpen(false); }}>
            ✕
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="search-results">
          {results.map(person => (
            <div
              key={person.id}
              className="search-result-item"
              onClick={() => handleSelect(person)}
            >
              <div className="result-avatar">
                {(person.firstName?.[0] || '').toUpperCase()}
              </div>
              <div className="result-info">
                <span className="result-name">{getPersonFullName(person)}</span>
                <span className="result-email">{person.email || 'Sin email'}</span>
              </div>
              <span className="result-generation">Gen {person.generation}</span>
            </div>
          ))}
        </div>
      )}

      {isOpen && query && results.length === 0 && (
        <div className="search-results">
          <div className="search-no-results">
            No se encontraron resultados para "{query}"
          </div>
        </div>
      )}
    </div>
  );
}
