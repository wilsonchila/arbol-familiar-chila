export function generateId() {
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

export function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

export function calculateAge(birthDate, deathDate) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const end = deathDate ? new Date(deathDate) : new Date();
  let age = end.getFullYear() - birth.getFullYear();
  const monthDiff = end.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function personToRow(person) {
  return [
    person.id,
    (person.firstName || '').toUpperCase(),
    (person.paternalLastName || '').toUpperCase(),
    (person.maternalLastName || '').toUpperCase(),
    person.birthDate || '',
    person.deathDate || '',
    person.gender,
    (person.email || '').toLowerCase(),
    person.phone || '',
    (person.address || '').toUpperCase(),
    person.photoUrl || '',
    person.isAlive ? 'true' : 'false',
    (person.notes || '').toUpperCase(),
    person.parentIds || '',
    person.spouseIds || '',
    String(person.generation || 0),
    person.wifeNumber || '',
    person.createdBy,
    person.createdAt,
    person.status,
    (person.fatherName || '').toUpperCase(),
    (person.motherName || '').toUpperCase()
  ];
}

export function rowToPerson(row) {
  if (!row || row.length < 20) return null;
  return {
    id: row[0],
    firstName: row[1],
    paternalLastName: row[2],
    maternalLastName: row[3],
    birthDate: row[4],
    deathDate: row[5],
    gender: row[6],
    email: row[7],
    phone: row[8],
    address: row[9],
    photoUrl: row[10],
    isAlive: row[11] === 'true',
    notes: row[12],
    parentIds: row[13],
    spouseIds: row[14],
    generation: parseInt(row[15]) || 0,
    wifeNumber: row[16],
    createdBy: row[17],
    createdAt: row[18],
    status: row[19],
    fatherName: row[20] || '',
    motherName: row[21] || ''
  };
}
