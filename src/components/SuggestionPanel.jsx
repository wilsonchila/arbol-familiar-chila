import { useState, useEffect } from 'react';
import { fetchSuggestions, updateSuggestionStatus } from '../services/sheetsService';
import '../styles/main.css';

export default function SuggestionPanel({ user, token, onApprove, onReject, onClose }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  useEffect(() => {
    loadSuggestions();
  }, [token]);

  const loadSuggestions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchSuggestions(token);
      setSuggestions(data.filter(s => s.status === 'pending'));
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const parsePersonData = (data) => {
    try {
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
      return {};
    }
  };

  const handleApprove = async (suggestionId) => {
    const success = await onApprove(suggestionId);
    if (success) {
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      setSelectedSuggestion(null);
    }
  };

  const handleReject = async (suggestionId) => {
    const success = await onReject(suggestionId);
    if (success) {
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      setSelectedSuggestion(null);
    }
  };

  const getPersonName = (personData) => {
    const data = parsePersonData(personData);
    return `${data.firstName || ''} ${data.paternalLastName || ''}`.trim();
  };

  return (
    <div className="suggestion-panel-overlay">
      <div className="suggestion-panel">
        <div className="panel-header">
          <h2>Sugerencias Pendientes</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="loading">Cargando sugerencias...</div>
        ) : suggestions.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>No hay sugerencias pendientes</p>
          </div>
        ) : (
          <div className="suggestions-list">
            {suggestions.map(suggestion => {
              const personData = parsePersonData(suggestion.personData);
              const isSelected = selectedSuggestion?.id === suggestion.id;

              return (
                <div
                  key={suggestion.id}
                  className={`suggestion-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedSuggestion(suggestion)}
                >
                  <div className="suggestion-header">
                    <div className="suggestion-person">
                      <span className="person-icon">👤</span>
                      <span className="person-name">{getPersonName(suggestion.personData)}</span>
                    </div>
                    <span className="suggestion-date">
                      {new Date(suggestion.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="suggestion-meta">
                    <span className="suggested-by">
                      Por: {suggestion.suggestedBy}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="suggestion-details">
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="label">Nombre:</span>
                          <span className="value">{personData.firstName}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Apellido P:</span>
                          <span className="value">{personData.paternalLastName}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Apellido M:</span>
                          <span className="value">{personData.maternalLastName || '-'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Género:</span>
                          <span className="value">{personData.gender === 'M' ? 'Masculino' : 'Femenino'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Nacimiento:</span>
                          <span className="value">{personData.birthDate || '-'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Generación:</span>
                          <span className="value">{personData.generation}</span>
                        </div>
                        {personData.email && (
                          <div className="detail-item">
                            <span className="label">Email:</span>
                            <span className="value">{personData.email}</span>
                          </div>
                        )}
                        {personData.phone && (
                          <div className="detail-item">
                            <span className="label">Teléfono:</span>
                            <span className="value">{personData.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="suggestion-actions">
                        <button
                          className="approve-btn"
                          onClick={(e) => { e.stopPropagation(); handleApprove(suggestion.id); }}
                        >
                          ✅ Aprobar
                        </button>
                        <button
                          className="reject-btn"
                          onClick={(e) => { e.stopPropagation(); handleReject(suggestion.id); }}
                        >
                          ❌ Rechazar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
