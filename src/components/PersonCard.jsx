import { getPersonFullName, getPersonDisplayInfo } from '../utils/treeBuilder';
import { formatDisplayDate, calculateAge } from '../utils/formatters';
import { isAdmin, isEditor } from '../services/validationService';
import '../styles/tree.css';

export default function PersonCard({ person, user, roleOverride, onEdit, onDelete, onSuggestEdit, showRelationship }) {
  const admin = isAdmin(user?.email, roleOverride);
  const editor = isEditor(user?.email, roleOverride, user?.name);
  const fullName = getPersonFullName(person);
  const info = getPersonDisplayInfo(person);
  const age = calculateAge(person.birthDate, person.deathDate);

  const initials = (person.firstName?.[0] || '') + (person.paternalLastName?.[0] || '');

  return (
    <div id={`person-${person.id}`} className={`person-card ${!person.isAlive ? 'deceased' : ''}`}>
      {(person.fatherName || person.motherName) && (
        <div className="parents-info">
          {person.fatherName && <span className="parent-name">&#9794; {person.fatherName}</span>}
          {person.motherName && <span className="parent-name">&#9792; {person.motherName}</span>}
        </div>
      )}
      <div className="person-card-header">
        {person.photoUrl ? (
          <img src={person.photoUrl} alt={fullName} className="person-photo" />
        ) : (
          <div className="person-avatar">
            {initials.toUpperCase()}
          </div>
        )}

        <div className="person-main-info">
          <h3 className="person-name">{fullName}</h3>
          <div className="person-dates">
            {person.birthDate && (
              <span className="birth-date">
                {formatDisplayDate(person.birthDate)}
              </span>
            )}
            {person.birthDate && person.deathDate && (
              <span className="date-separator"> - </span>
            )}
            {person.deathDate && (
              <span className="death-date">
                {formatDisplayDate(person.deathDate)}
              </span>
            )}
            {age !== null && (
              <span className="age">({age} años)</span>
            )}
          </div>
          {showRelationship && info.relationship && (
            <span className="relationship-badge">{info.relationship}</span>
          )}
        </div>
      </div>

      <div className="person-card-details">
        {person.email && (
          <div className="detail-item">
            <span className="detail-icon">📧</span>
            <span>{person.email}</span>
          </div>
        )}
        {person.phone && (
          <div className="detail-item">
            <span className="detail-icon">📱</span>
            <span>{person.phone}</span>
          </div>
        )}
        {person.address && (
          <div className="detail-item">
            <span className="detail-icon">📍</span>
            <span>{person.address}</span>
          </div>
        )}
        {person.notes && (
          <div className="detail-item">
            <span className="detail-icon">📝</span>
            <span className="notes">{person.notes}</span>
          </div>
        )}
      </div>

      <div className="person-card-actions">
        {editor ? (
          <>
            <button className="action-btn edit-btn" onClick={() => onEdit(person)}>
              ✏️ Editar
            </button>
            {admin && (
              <button className="action-btn delete-btn" onClick={() => onDelete(person.id)}>
                🗑️ Eliminar
              </button>
            )}
          </>
        ) : (
          <button className="action-btn suggest-btn" onClick={() => onSuggestEdit(person)}>
            💡 Sugerir edición
          </button>
        )}
      </div>
    </div>
  );
}
