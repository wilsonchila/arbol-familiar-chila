function findParentByName(parentName, allPersons) {
  if (!parentName) return null;
  const normalizedName = parentName.toLowerCase().trim();
  return allPersons.find(p => {
    const fullName = `${p.firstName || ''} ${p.paternalLastName || ''} ${p.maternalLastName || ''}`.toLowerCase().trim();
    return fullName === normalizedName;
  });
}

export function buildTree(persons, sortOrder = 'alpha') {
  const approved = persons.filter(p => p.status === 'approved');

  approved.forEach(person => {
    if (!person.parentIds && (person.fatherName || person.motherName)) {
      const parentIds = [];
      const father = findParentByName(person.fatherName, approved);
      const mother = findParentByName(person.motherName, approved);
      if (father) parentIds.push(father.id);
      if (mother) parentIds.push(mother.id);
      if (parentIds.length > 0) {
        person.parentIds = parentIds.join(',');
      }
    }
  });

  const memo = {};
  const generations = {};
  approved.forEach(person => {
    const gen = computeGeneration(person, approved, memo);
    if (!generations[gen]) generations[gen] = [];
    generations[gen].push(person);
  });

  const sortedGenerations = Object.keys(generations)
    .map(Number)
    .sort((a, b) => a - b)
    .map(gen => ({
      number: gen,
      label: getGenerationLabel(gen),
      persons: groupByFamilyLine(generations[gen], approved, gen, sortOrder)
    }));

  return sortedGenerations;
}

function sortPersons(persons, sortOrder) {
  if (!persons || persons.length === 0) return persons;
  const sorted = [...persons];
  if (sortOrder === 'age') {
    sorted.sort((a, b) => {
      const dateA = a.birthDate ? new Date(a.birthDate) : new Date(0);
      const dateB = b.birthDate ? new Date(b.birthDate) : new Date(0);
      return dateA - dateB;
    });
  } else {
    sorted.sort((a, b) => {
      const nameA = `${a.firstName || ''} ${a.paternalLastName || ''}`.toLowerCase();
      const nameB = `${b.firstName || ''} ${b.paternalLastName || ''}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }
  return sorted;
}

function getGenerationLabel(gen) {
  const labels = {
    0: 'Generación 0',
    1: 'Generación 1 - Hijos / Sobrinos 1er grado',
    2: 'Generación 2 - Nietos / Sobrinos 2do grado',
    3: 'Generación 3 - Bisnietos / Sobrinos 3er grado',
    4: 'Generación 4 - Tataranietos',
    5: 'Generación 5 - Quinta Generación'
  };
  return labels[gen] || `Generación ${gen}`;
}

function groupByFamilyLine(persons, allPersons, genNumber, sortOrder) {
  const groups = [];
  const processed = new Set();

  if (genNumber === 0) {
    const santiago = persons.find(p =>
      p.firstName?.toLowerCase().includes('santiago') &&
      p.paternalLastName?.toLowerCase().includes('chila')
    );

    if (santiago) {
      const santiagoGroup = {
        type: 'santiago',
        label: 'Santiago Chila Chila',
        persons: [santiago]
      };

      const spouses = sortPersons(persons.filter(p =>
        p.wifeNumber && !processed.has(p.id) && p.id !== santiago.id
      ), sortOrder);
      if (spouses.length > 0) {
        santiagoGroup.spouses = spouses;
        spouses.forEach(s => processed.add(s.id));
      }

      const siblings = sortPersons(persons.filter(p =>
        !p.wifeNumber &&
        p.id !== santiago.id &&
        !processed.has(p.id) &&
        (p.parentIds || '').split(',').some(id => id.trim()) ||
        (!p.parentIds && (p.fatherName || p.motherName))
      ), sortOrder);

      if (siblings.length > 0) {
        santiagoGroup.siblings = siblings;
        siblings.forEach(s => processed.add(s.id));
      }

      processed.add(santiago.id);
      groups.push(santiagoGroup);
    }

    persons.forEach(person => {
      if (!processed.has(person.id)) {
        if (person.wifeNumber) {
          const existingWifeGroup = groups.find(g => g.type === 'wife_line' && g.wifeNumber === person.wifeNumber);
          if (!existingWifeGroup) {
            groups.push({
              type: 'wife_line',
              label: `Esposa ${person.wifeNumber}: ${person.firstName} ${person.paternalLastName}`,
              wife: person,
              wifeNumber: person.wifeNumber,
              children: []
            });
          }
        } else {
          const existingGroup = groups.find(g => g.type === 'other');
          if (existingGroup) {
            existingGroup.persons.push(person);
          } else {
            groups.push({
              type: 'other',
              label: 'Otros miembros',
              persons: [person]
            });
          }
        }
        processed.add(person.id);
      }
    });

    groups.forEach(g => {
      if (g.type === 'other') g.persons = sortPersons(g.persons, sortOrder);
    });
  } else {
    const parentGroups = {};

    persons.forEach(person => {
      const parentIds = person.parentIds ? person.parentIds.split(',').map(s => s.trim()).filter(Boolean) : [];

      if (parentIds.length > 0) {
        const mother = allPersons.find(p => parentIds.includes(p.id) && p.gender === 'F');
        const father = allPersons.find(p => parentIds.includes(p.id) && p.gender === 'M');
        const key = parentIds.sort().join('_');

        if (!parentGroups[key]) {
          parentGroups[key] = {
            father,
            mother,
            children: []
          };
        }
        parentGroups[key].children.push(person);
      } else {
        const key = 'ungrouped';
        if (!parentGroups[key]) {
          parentGroups[key] = { father: null, mother: null, children: [] };
        }
        parentGroups[key].children.push(person);
      }
    });

    Object.keys(parentGroups).sort().forEach(key => {
      const { father, mother, children } = parentGroups[key];

      let label = 'Otros miembros';
      if (father || mother) {
        const parentNames = [];
        if (father) parentNames.push(`${father.firstName} ${father.paternalLastName}`);
        if (mother) parentNames.push(`${mother.firstName} ${mother.paternalLastName}`);
        label = `Hijos de ${parentNames.join(' y ')}`;
      }

      groups.push({
        type: 'family',
        label,
        children: sortPersons(children, sortOrder)
      });
    });
  }

  return groups;
}

export function buildFamilyMap(persons) {
  const map = {};
  persons.forEach(p => { map[p.id] = p; });
  return map;
}

export function getChildren(personId, persons) {
  return persons.filter(p => {
    if (p.parentIds) {
      return p.parentIds.split(',').map(s => s.trim()).includes(personId);
    }
    return false;
  });
}

export function getSiblings(personId, persons) {
  const person = persons.find(p => p.id === personId);
  if (!person || !person.parentIds) return [];
  const parentIds = person.parentIds.split(',').map(s => s.trim());
  return persons.filter(p =>
    p.id !== personId &&
    p.parentIds &&
    parentIds.some(pid => p.parentIds.split(',').map(s => s.trim()).includes(pid))
  );
}

export function getNephews(personId, persons, degree = 1) {
  const siblings = getSiblings(personId, persons);
  let result = siblings;

  for (let i = 1; i < degree; i++) {
    const nextGeneration = [];
    result.forEach(person => {
      const children = getChildren(person.id, persons);
      nextGeneration.push(...children);
    });
    result = nextGeneration;
  }

  const nephews = [];
  result.forEach(sibling => {
    const children = getChildren(sibling.id, persons);
    nephews.push(...children);
  });

  return nephews;
}

export function getSpouses(personId, persons) {
  const person = persons.find(p => p.id === personId);
  if (!person || !person.spouseIds) return [];
  return person.spouseIds.split(',').map(s => s.trim()).map(id => persons.find(p => p.id === id)).filter(Boolean);
}

export function getPersonFullName(person) {
  if (!person) return '';
  let name = person.firstName || '';
  if (person.paternalLastName) name += ` ${person.paternalLastName}`;
  if (person.maternalLastName) name += ` ${person.maternalLastName}`;
  return name.trim();
}

export function getPersonDisplayInfo(person) {
  const fullName = getPersonFullName(person);
  const alive = person.isAlive ? 'Vivo' : (person.deathDate ? `Fallecido` : '');

  let relationship = '';
  if (person.wifeNumber) {
    relationship = `Esposa ${person.wifeNumber}`;
  }

  return { fullName, alive, relationship };
}

export function isPersonAlive(person) {
  return person.isAlive === true || person.isAlive === 'true' || person.isAlive === 'TRUE';
}

function findParentByNameLocal(parentName, allPersons) {
  if (!parentName) return null;
  const normalizedName = parentName.toLowerCase().trim();
  return allPersons.find(p => {
    const fullName = `${p.firstName || ''} ${p.paternalLastName || ''} ${p.maternalLastName || ''}`.toLowerCase().trim();
    return fullName === normalizedName;
  });
}

function computeGeneration(person, allPersons, memo = {}) {
  if (memo[person.id] !== undefined) return memo[person.id];

  const parentIds = person.parentIds ? person.parentIds.split(',').map(s => s.trim()).filter(Boolean) : [];

  if (parentIds.length > 0) {
    let maxParentGen = -1;
    for (const parentId of parentIds) {
      const parent = allPersons.find(p => p.id === parentId);
      if (parent) {
        const parentGen = computeGeneration(parent, allPersons, memo);
        if (parentGen > maxParentGen) maxParentGen = parentGen;
      }
    }
    if (maxParentGen >= 0) {
      memo[person.id] = maxParentGen + 1;
      return memo[person.id];
    }
  }

  if (person.fatherName || person.motherName) {
    const father = findParentByNameLocal(person.fatherName, allPersons);
    const mother = findParentByNameLocal(person.motherName, allPersons);
    let maxParentGen = -1;
    if (father) {
      const fGen = computeGeneration(father, allPersons, memo);
      if (fGen > maxParentGen) maxParentGen = fGen;
    }
    if (mother) {
      const mGen = computeGeneration(mother, allPersons, memo);
      if (mGen > maxParentGen) maxParentGen = mGen;
    }
    if (maxParentGen >= 0) {
      memo[person.id] = maxParentGen + 1;
      return memo[person.id];
    }
  }

  memo[person.id] = person.generation || 0;
  return memo[person.id];
}

export function computeStats(persons) {
  const approved = persons.filter(p => p.status === 'approved');
  const total = approved.length;
  const alive = approved.filter(p => isPersonAlive(p)).length;
  const deceased = total - alive;

  const memo = {};
  const generations = {};
  approved.forEach(p => {
    const gen = computeGeneration(p, approved, memo);
    generations[gen] = (generations[gen] || 0) + 1;
  });

  return { total, alive, deceased, generations, approved };
}
