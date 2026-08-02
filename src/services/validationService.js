import { CONFIG } from '../config';

export function isAdmin(userEmail, roleOverride) {
  if (roleOverride) return roleOverride === 'admin';
  if (!userEmail) return false;
  if (CONFIG.ADMIN_EMAILS?.length) {
    return CONFIG.ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail.toLowerCase());
  }
  return userEmail.toLowerCase() === CONFIG.ADMIN_EMAIL.toLowerCase();
}

export function isEditor(userEmail, roleOverride, userName) {
  if (roleOverride) return roleOverride === 'editor' || roleOverride === 'admin';
  if (isAdmin(userEmail)) return true;
  if (userName && userName.toLowerCase().includes('chila')) return true;
  if (!userEmail || !CONFIG.EDITOR_EMAILS?.length) return false;
  return CONFIG.EDITOR_EMAILS.some(email => email.toLowerCase() === userEmail.toLowerCase());
}

export function canAddPerson(userEmail, roleOverride) {
  return isAdmin(userEmail, roleOverride);
}

export function canEditorAddDirectly(personData, roleOverride, userEmail, userName) {
  if (isAdmin(userEmail, roleOverride)) return true;
  if (!isEditor(userEmail, roleOverride, userName)) return false;
  return hasChilaLastName(personData);
}

export function canEditPerson(userEmail, roleOverride, userName) {
  return isEditor(userEmail, roleOverride, userName);
}

export function canDeletePerson(userEmail, roleOverride) {
  return isAdmin(userEmail, roleOverride);
}

export function canSuggest(userEmail) {
  return !!userEmail;
}

export function canApproveSuggestions(userEmail, roleOverride) {
  return isAdmin(userEmail, roleOverride);
}

export function hasChilaLastName(person) {
  const paternal = (person.paternalLastName || '').toLowerCase();
  const maternal = (person.maternalLastName || '').toLowerCase();
  return paternal.includes('chila') || maternal.includes('chila');
}

export function isChildOfChila(person, allPersons) {
  if (!person.parentIds) return false;
  const parentIds = person.parentIds.split(',').map(s => s.trim());
  return parentIds.some(parentId => {
    const parent = allPersons.find(p => p.id === parentId);
    return parent && hasChilaLastName(parent);
  });
}

export function canSuggestPerson(person, allPersons) {
  if (hasChilaLastName(person)) return { allowed: true };
  if (isChildOfChila(person, allPersons)) return { allowed: true };
  return {
    allowed: false,
    reason: 'La persona debe tener al menos un apellido "Chila" o ser hijo/a de alguien con apellido Chila'
  };
}

export function getPermissionMessage(userEmail, userName) {
  if (isAdmin(userEmail)) {
    return {
      level: 'admin',
      message: 'Tienes permisos de administrador. Puedes agregar, editar y eliminar miembros directamente.'
    };
  }
  if (isEditor(userEmail, null, userName)) {
    return {
      level: 'editor',
      message: 'Tienes permisos de editor. Puedes agregar y editar miembros directamente.'
    };
  }
  return {
    level: 'user',
    message: 'Puedes sugerir nuevos miembros. Tus sugerencias serán revisadas por el administrador.'
  };
}
