export function buildTree(persons, sortOrder = 'alpha') {
  const approved = persons.filter(p => p.status === 'approved');

  const generations = {};
  approved.forEach(person => {
    const gen = person.generation || 0;
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
      return dateA - dateB; // eldest first
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
    1: 'Generación 1 - Hijos',
    2: 'Generación 2 - Nietos',
    3: 'Generación 3 - Bisnietos',
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
        !p.parentIds &&
        p.id !== santiago.id &&
        !processed.has(p.id)
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
    const wifeGroups = {};
    const ungrouped = [];

    persons.forEach(person => {
      if (person.parentIds) {
        const parentIds = person.parentIds.split(',').map(s => s.trim());
        const motherWifeNumber = findMotherWifeNumber(parentIds, allPersons);

        if (motherWifeNumber) {
          const key = `wife_${motherWifeNumber}`;
          if (!wifeGroups[key]) wifeGroups[key] = { wifeNumber: motherWifeNumber, children: [] };
          wifeGroups[key].children.push(person);
        } else {
          ungrouped.push(person);
        }
      } else {
        ungrouped.push(person);
      }
    });

    Object.keys(wifeGroups).sort().forEach(key => {
      const { wifeNumber, children } = wifeGroups[key];
      const wife = allPersons.find(p => p.wifeNumber === wifeNumber && p.generation === 0);

      groups.push({
        type: 'wife_line',
        label: wife
          ? `Hijos de Esposa ${wifeNumber}: ${wife.firstName} ${wife.paternalLastName}`
          : `Línea Esposa ${wifeNumber}`,
        wife,
        children: sortPersons(children, sortOrder)
      });
    });

    if (ungrouped.length > 0) {
      groups.push({
        type: 'other',
        label: 'Otros miembros',
        persons: sortPersons(ungrouped, sortOrder)
      });
    }
  }

  return groups;
}

function findMotherWifeNumber(parentIds, allPersons) {
  for (const parentId of parentIds) {
    const mother = allPersons.find(p => p.id === parentId && p.gender === 'F');
    if (mother && mother.wifeNumber) {
      return mother.wifeNumber;
    }
  }
  return null;
}

export function buildFamilyMap(persons) {
  const map = {};
  persons.forEach(p => { map[p.id] = p; });
  return map;
}

export function getChildren(personId, persons) {
  return persons.filter(p =>
    p.parentIds && p.parentIds.split(',').map(s => s.trim()).includes(personId)
  );
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

export function computeStats(persons) {
  const approved = persons.filter(p => p.status === 'approved');
  const total = approved.length;
  const alive = approved.filter(p => isPersonAlive(p)).length;
  const deceased = total - alive;

  const generations = {};
  approved.forEach(p => {
    const gen = p.generation || 0;
    generations[gen] = (generations[gen] || 0) + 1;
  });

  return { total, alive, deceased, generations, approved };
}
