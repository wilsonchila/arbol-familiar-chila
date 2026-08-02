import { useState, useMemo } from 'react';
import GenerationGroup from './GenerationGroup';
import SearchBar from './SearchBar';
import PersonForm from './PersonForm';
import StatsBar from './StatsBar';
import { buildTree } from '../utils/treeBuilder';
import { isEditor } from '../services/validationService';
import '../styles/tree.css';

export default function FamilyTree({ persons, user, onEdit, onDelete, onAddPerson, onRefresh, roleOverride }) {
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [selectedGeneration, setSelectedGeneration] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [sortOrder, setSortOrder] = useState('alpha');
  const editor = isEditor(user?.email, roleOverride);

  const tree = useMemo(() => buildTree(persons, sortOrder), [persons, sortOrder]);

  const handleAddPerson = (generation) => {
    setSelectedGeneration(generation);
    setEditingPerson(null);
    setShowForm(true);
  };

  const handleEditPerson = (person) => {
    setEditingPerson(person);
    setSelectedGeneration(null);
    setShowForm(true);
  };

  const handleSavePerson = async (personData) => {
    if (editingPerson) {
      await onEdit(personData.id, personData);
    } else {
      await onAddPerson(personData);
    }
    setShowForm(false);
    setEditingPerson(null);
  };

  const handleSelectPerson = (person) => {
    setSelectedPerson(person);
    setEditingPerson(person);
    setShowForm(true);
  };

  return (
    <div className="family-tree-container">
      <div className="tree-toolbar">
        <SearchBar persons={persons} onSelectPerson={handleSelectPerson} />

        <div className="toolbar-actions">
          <div className="sort-buttons">
            <button
              className={`sort-btn ${sortOrder === 'alpha' ? 'active' : ''}`}
              onClick={() => setSortOrder('alpha')}
              title="Ordenar alfabéticamente"
            >
              A-Z
            </button>
            <button
              className={`sort-btn ${sortOrder === 'age' ? 'active' : ''}`}
              onClick={() => setSortOrder('age')}
              title="Ordenar por edad"
            >
              Edad
            </button>
          </div>
          <button
            className={`stats-toggle ${showStats ? 'active' : ''}`}
            onClick={() => setShowStats(!showStats)}
          >
            📊 Estadísticas
          </button>
          {editor && (
            <button className="add-root-btn" onClick={() => handleAddPerson(0)}>
              + Agregar Miembro
            </button>
          )}
        </div>
      </div>

      {showStats && <StatsBar persons={persons} />}

      <div className="tree-content">
        {tree.length === 0 ? (
          <div className="empty-tree">
            <div className="empty-icon">🌳</div>
            <h3>El árbol está vacío</h3>
            <p>Comienza agregando miembros de la familia Chila.</p>
            {editor && (
              <button className="add-first-btn" onClick={() => handleAddPerson(0)}>
                + Agregar Primer Miembro
              </button>
            )}
          </div>
        ) : (
          tree.map(generation => (
            <GenerationGroup
              key={generation.number}
              generation={generation}
              user={user}
              roleOverride={roleOverride}
              onEdit={handleEditPerson}
              onDelete={onDelete}
              onSuggestEdit={handleEditPerson}
              onAddPerson={handleAddPerson}
            />
          ))
        )}
      </div>

      {showForm && (
        <PersonForm
          persons={persons}
          editingPerson={editingPerson}
          user={user}
          onSave={handleSavePerson}
          onCancel={() => { setShowForm(false); setEditingPerson(null); }}
        />
      )}
    </div>
  );
}
