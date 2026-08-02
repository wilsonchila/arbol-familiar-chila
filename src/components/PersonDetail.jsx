import { getPersonFullName } from '../utils/treeBuilder';
import { formatDisplayDate, calculateAge } from '../utils/formatters';
import { isAdmin, isEditor } from '../services/validationService';
import '../styles/main.css';

export default function PersonDetail({ person, user, roleOverride, onEdit, onDelete, onSuggestEdit, onClose }) {
  const admin = isAdmin(user?.email, roleOverride);
  const editor = isEditor(user?.email, roleOverride, user?.name);
  const fullName = getPersonFullName(person);
  const age = calculateAge(person.birthDate, person.deathDate);
  const initials = (person.firstName?.[0] || '') + (person.paternalLastName?.[0] || '');

  return (
    <div className="person-detail-overlay">
      <div className="person-detail-container">
        <div className="detail-header">
          <button className="close-btn" onClick={onClose}>&#10005;</button>
        </div>

        <div className="detail-content">
          <div className="detail-photo-section">
            {person.photoUrl ? (
              <img src={person.photoUrl} alt={fullName} className="detail-photo" />
            ) : (
              <div className="detail-avatar">
                {initials.toUpperCase()}
              </div>
            )}
          </div>

          <div className="detail-name-section">
            <h2 className="detail-fullname">{fullName}</h2>
            {!person.isAlive && <span className="detail-deceased-badge">Fallecido</span>}
          </div>

          <div className="detail-info-grid">
            {person.birthDate && (
              <div className="detail-field">
                <span className="field-label">Fecha de Nacimiento</span>
                <span className="field-value">{formatDisplayDate(person.birthDate)}</span>
              </div>
            )}
            {person.deathDate && (
              <div className="detail-field">
                <span className="field-label">Fecha de Fallecimiento</span>
                <span className="field-value">{formatDisplayDate(person.deathDate)}</span>
              </div>
            )}
            {age !== null && (
              <div className="detail-field">
                <span className="field-label">Edad</span>
                <span className="field-value">{age} años</span>
              </div>
            )}
            {person.gender && (
              <div className="detail-field">
                <span className="field-label">Género</span>
                <span className="field-value">{person.gender === 'M' ? 'Masculino' : 'Femenino'}</span>
              </div>
            )}
            {person.fatherName && (
              <div className="detail-field">
                <span className="field-label">Padre</span>
                <span className="field-value">{person.fatherName}</span>
              </div>
            )}
            {person.motherName && (
              <div className="detail-field">
                <span className="field-label">Madre</span>
                <span className="field-value">{person.motherName}</span>
              </div>
            )}
            {person.email && (
              <div className="detail-field">
                <span className="field-label">Email</span>
                <span className="field-value">{person.email}</span>
              </div>
            )}
            {person.phone && (
              <div className="detail-field">
                <span className="field-label">Teléfono</span>
                <span className="field-value">{person.phone}</span>
              </div>
            )}
            {person.address && (
              <div className="detail-field full-width">
                <span className="field-label">Dirección</span>
                <span className="field-value">{person.address}</span>
              </div>
            )}
            {person.notes && (
              <div className="detail-field full-width">
                <span className="field-label">Notas</span>
                <span className="field-value">{person.notes}</span>
              </div>
            )}
          </div>
        </div>

        <div className="detail-actions">
          {admin && (
            <button className="action-btn delete-btn" onClick={() => { onDelete(person.id); onClose(); }}>
              🗑️ Eliminar
            </button>
          )}
          {editor && (
            <button className="action-btn edit-btn" onClick={() => { onEdit(person); onClose(); }}>
              ✏️ Editar
            </button>
          )}
          {!admin && !editor && (
            <button className="action-btn suggest-btn" onClick={() => { onSuggestEdit(person); onClose(); }}>
              💡 Sugerir edición
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
