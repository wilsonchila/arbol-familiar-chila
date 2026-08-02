import { useState } from 'react';
import PersonCard from './PersonCard';
import '../styles/tree.css';

export default function GenerationGroup({ generation, user, roleOverride, onEdit, onDelete, onSuggestEdit, onAddPerson }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const countMembers = () => {
    let count = 0;
    generation.persons.forEach(group => {
      if (group.type === 'santiago') {
        count += 1;
        if (group.spouses) count += group.spouses.length;
        if (group.siblings) count += group.siblings.length;
      } else if (group.type === 'wife_line') {
        if (group.wife) count += 1;
        if (group.children) count += group.children.length;
      } else if (group.type === 'family') {
        count += group.children?.length || 0;
      } else if (group.type === 'other') {
        count += group.persons?.length || 0;
      }
    });
    console.log(`[GenGroup] Gen ${generation.number}: ${count} miembros`, generation.persons.map(g => `${g.type}(${g.children?.length || g.persons?.length || 0})`));
    return count;
  };

  return (
    <div className="generation-group">
      <div className="generation-header" onClick={toggleExpand}>
        <div className="generation-title">
          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>&#9654;</span>
          <h2>{generation.label}</h2>
          <span className="person-count">{countMembers()} miembros</span>
        </div>
        {user && (
          <button className="add-person-btn" onClick={(e) => { e.stopPropagation(); onAddPerson(generation.number); }}>
            + Agregar
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="generation-content">
          {generation.persons.map((group, groupIndex) => (
            <div key={groupIndex} className="family-group">
              {group.type === 'santiago' && (
                <div className="santiago-group">
                  <div className="group-label">
                    <span className="group-icon">&#128081;</span>
                    <span>{group.label}</span>
                  </div>
                  <div className="persons-list">
                    {group.persons.map(person => (
                      <PersonCard
                        key={person.id}
                        person={person}
                        user={user}
                        roleOverride={roleOverride}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onSuggestEdit={onSuggestEdit}
                      />
                    ))}
                  </div>

                  {group.spouses && group.spouses.length > 0 && (
                    <div className="spouses-section">
                      <div className="section-label">
                        <span className="section-icon">&#128141;</span>
                        <span>Esposas</span>
                      </div>
                      <div className="persons-list">
                        {group.spouses.map(spouse => (
                          <PersonCard
                            key={spouse.id}
                            person={spouse}
                            user={user}
                            roleOverride={roleOverride}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onSuggestEdit={onSuggestEdit}
                            showRelationship
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {group.siblings && group.siblings.length > 0 && (
                    <div className="siblings-section">
                      <div className="section-label">
                        <span className="section-icon">&#128101;</span>
                        <span>Hermanos</span>
                      </div>
                      <div className="persons-list">
                        {group.siblings.map(sibling => (
                          <PersonCard
                            key={sibling.id}
                            person={sibling}
                            user={user}
                            roleOverride={roleOverride}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onSuggestEdit={onSuggestEdit}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {group.type === 'wife_line' && (
                <div className="wife-line-group">
                  <div className="group-label">
                    <span className="group-icon">&#128106;</span>
                    <span>{group.label}</span>
                  </div>

                  {group.wife && (
                    <div className="wife-card">
                      <PersonCard
                        person={group.wife}
                        user={user}
                        roleOverride={roleOverride}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onSuggestEdit={onSuggestEdit}
                        showRelationship
                      />
                    </div>
                  )}

                  {group.children && group.children.length > 0 && (
                    <div className="children-section">
                      <div className="section-label">
                        <span className="section-icon">&#128118;</span>
                        <span>Hijos</span>
                      </div>
                      <div className="persons-list">
                        {group.children.map(child => (
                          <PersonCard
                            key={child.id}
                            person={child}
                            user={user}
                            roleOverride={roleOverride}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onSuggestEdit={onSuggestEdit}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {group.type === 'other' && (
                <div className="other-group">
                  <div className="group-label">
                    <span className="group-icon">&#128100;</span>
                    <span>{group.label}</span>
                  </div>
                  <div className="persons-list">
                    {group.persons.map(person => (
                      <PersonCard
                        key={person.id}
                        person={person}
                        user={user}
                        roleOverride={roleOverride}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onSuggestEdit={onSuggestEdit}
                      />
                    ))}
                  </div>
                </div>
              )}

              {group.type === 'family' && (
                <div className="family-line-group">
                  <div className="group-label">
                    <span className="group-icon">&#128106;</span>
                    <span>{group.label}</span>
                  </div>
                  <div className="persons-list">
                    {group.children.map(person => (
                      <PersonCard
                        key={person.id}
                        person={person}
                        user={user}
                        roleOverride={roleOverride}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onSuggestEdit={onSuggestEdit}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
