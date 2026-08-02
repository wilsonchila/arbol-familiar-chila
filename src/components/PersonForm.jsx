import { useState, useEffect } from 'react';
import { generateId } from '../utils/formatters';
import { hasChilaLastName, isAdmin } from '../services/validationService';
import '../styles/form.css';

export default function PersonForm({ persons, editingPerson, user, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    firstName: '',
    paternalLastName: '',
    maternalLastName: '',
    birthDate: '',
    deathDate: '',
    gender: 'M',
    email: '',
    phone: '',
    address: '',
    photoUrl: '',
    isAlive: true,
    notes: '',
    parentIds: '',
    fatherName: '',
    motherName: '',
    generation: 0,
    wifeNumber: ''
  });

  const [validationError, setValidationError] = useState('');
  const admin = isAdmin(user?.email);

  useEffect(() => {
    if (editingPerson) {
      const father = editingPerson.fatherName || '';
      const mother = editingPerson.motherName || '';
      setFormData({ ...editingPerson, fatherName: father, motherName: mother });
    } else {
      setFormData({
        firstName: '',
        paternalLastName: '',
        maternalLastName: '',
        birthDate: '',
        deathDate: '',
        gender: 'M',
        email: '',
        phone: '',
        address: '',
        photoUrl: '',
        isAlive: true,
        notes: '',
        parentIds: '',
        fatherName: '',
        motherName: '',
        generation: 0,
        wifeNumber: ''
      });
    }
  }, [editingPerson]);

  const upperFields = ['firstName', 'paternalLastName', 'maternalLastName', 'address', 'notes', 'fatherName', 'motherName'];

  const findParentGeneration = (parentName) => {
    if (!parentName) return null;
    const normalizedName = parentName.toLowerCase().trim();
    const parent = persons.find(p => {
      const fullName = `${p.firstName || ''} ${p.paternalLastName || ''} ${p.maternalLastName || ''}`.toLowerCase().trim();
      return fullName === normalizedName;
    });
    return parent ? (parent.generation || 0) : null;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;
    if (upperFields.includes(name) && typeof finalValue === 'string') {
      finalValue = finalValue.toUpperCase();
    }

    const newState = { ...formData, [name]: finalValue };

    if (name === 'fatherName' || name === 'motherName') {
      const fatherGen = findParentGeneration(name === 'fatherName' ? finalValue : newState.fatherName);
      const motherGen = findParentGeneration(name === 'motherName' ? finalValue : newState.motherName);
      const parentGen = Math.max(fatherGen ?? -1, motherGen ?? -1);
      if (parentGen >= 0) {
        newState.generation = parentGen + 1;
      }
    }

    setFormData(newState);
    setValidationError('');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > 3 * 1024 * 1024) {
      setValidationError('La imagen es muy grande. Maximo 3MB.');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const maxSize = 300;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL('image/jpeg', 0.6);
      setFormData(prev => ({ ...prev, photoUrl: base64 }));
    };
    img.src = URL.createObjectURL(file);
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setValidationError('El nombre es obligatorio');
      return false;
    }
    if (!formData.paternalLastName.trim()) {
      setValidationError('El apellido paterno es obligatorio');
      return false;
    }

    if (!admin) {
      const testPerson = {
        ...formData,
        paternalLastName: formData.paternalLastName,
        maternalLastName: formData.maternalLastName,
      };

      if (!hasChilaLastName(testPerson)) {
        setValidationError('La persona debe tener al menos un apellido "Chila"');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const personData = {
      ...formData,
      id: editingPerson?.id || generateId(),
      status: admin ? 'approved' : 'suggested'
    };

    onSave(personData);
  };

  return (
    <div className="person-form-overlay">
      <div className="person-form-container">
        <div className="form-header">
          <h2>{editingPerson ? 'Editar Miembro' : 'Agregar Miembro'}</h2>
          <button className="close-btn" onClick={onCancel}>&#10005;</button>
        </div>

        {!admin && (
          <div className="suggestion-notice">
            <span className="notice-icon">&#128161;</span>
            <span>Tu sugerencia sera revisada por el administrador antes de ser publicada.</span>
          </div>
        )}

        {validationError && (
          <div className="validation-error">
            <span className="error-icon">&#9888;</span>
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="person-form">
          <div className="form-section">
            <h3>Informacion Basica</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">Nombre(s) *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="paternalLastName">Apellido Paterno *</label>
                <input
                  type="text"
                  id="paternalLastName"
                  name="paternalLastName"
                  value={formData.paternalLastName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="maternalLastName">Apellido Materno</label>
                <input
                  type="text"
                  id="maternalLastName"
                  name="maternalLastName"
                  value={formData.maternalLastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender">Genero *</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="isAlive"
                    checked={formData.isAlive}
                    onChange={handleChange}
                  />
                  Vivo
                </label>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Fechas</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="birthDate">Fecha de Nacimiento</label>
                <input
                  type="date"
                  id="birthDate"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="deathDate">Fecha de Fallecimiento</label>
                <input
                  type="date"
                  id="deathDate"
                  name="deathDate"
                  value={formData.deathDate}
                  onChange={handleChange}
                  disabled={formData.isAlive}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Padres</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fatherName">Nombre del Padre</label>
                <input
                  type="text"
                  id="fatherName"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  placeholder="Nombre completo del padre"
                />
              </div>
              <div className="form-group">
                <label htmlFor="motherName">Nombre de la Madre</label>
                <input
                  type="text"
                  id="motherName"
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleChange}
                  placeholder="Nombre completo de la madre"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Contacto</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Telefono</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="address">Direccion</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Foto del Miembro</label>
                {formData.photoUrl && (
                  <div className="photo-preview">
                    <img src={formData.photoUrl} alt="Vista previa" />
                    <button type="button" className="remove-photo-btn" onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}>
                      Quitar foto
                    </button>
                  </div>
                )}
                <div className="photo-upload-area">
                  <input
                    type="file"
                    id="photoInput"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePhotoUpload}
                  />
                  <button
                    type="button"
                    className="upload-photo-btn"
                    onClick={() => document.getElementById('photoInput')?.click()}
                  >
                    {formData.photoUrl ? 'Cambiar foto' : 'Subir foto desde el PC'}
                  </button>
                  <span className="photo-hint">Maximo 3MB. Se comprime automaticamente.</span>
                </div>
                <input
                  type="text"
                  name="photoUrl"
                  value={formData.photoUrl}
                  onChange={handleChange}
                  placeholder="O pega una URL de imagen..."
                  className="photo-url-input"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Generacion</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="generation">Generacion</label>
                <select
                  id="generation"
                  name="generation"
                  value={formData.generation}
                  onChange={handleChange}
                >
                  {[0, 1, 2, 3, 4, 5].map(gen => (
                    <option key={gen} value={gen}>Generacion {gen}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Notas</h3>
            <div className="form-group full-width">
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Informacion adicional..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="save-btn">
              {editingPerson ? 'Guardar Cambios' : (admin ? 'Agregar Miembro' : 'Enviar Sugerencia')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
