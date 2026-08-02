import { CONFIG, FIELDS_ARRAY } from '../config';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const PEOPLE_RANGE = `'${CONFIG.SHEET_NAME}'!A:V`;
const SUGGESTIONS_RANGE = `'${CONFIG.SUGGESTIONS_SHEET}'!A:G`;

async function getAccessToken() {
  const tokenClient = window.google?.accounts?.oauth2?.getToken;
  return new Promise((resolve) => {
    if (tokenClient) {
      tokenClient(resolve);
    } else {
      resolve(null);
    }
  });
}

export async function fetchAllPersons(token) {
  try {
    const url = `${SHEETS_API}/${CONFIG.SHEET_ID}/values/${PEOPLE_RANGE}`;
    console.log('Fetching from:', url);
    console.log('Token exists:', !!token);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', errorData);
      throw new Error(`Error ${response.status}: ${errorData.error?.message || 'Error fetching data'}`);
    }

    const data = await response.json();
    console.log('Data received:', data);
    const rows = data.values || [];

    if (rows.length <= 1) return [];

    return rows.slice(1).map(row => {
      const person = {};
      FIELDS_ARRAY.forEach((field, index) => {
        person[field] = row[index] || '';
      });
      person.isAlive = person.isAlive === 'true' || person.isAlive === true || person.isAlive === 'TRUE';
      person.generation = parseInt(person.generation) || 0;
      return person;
    }).filter(p => p.id);
  } catch (error) {
    console.error('Error fetching persons:', error);
    throw error;
  }
}

export async function addPerson(person, token) {
  try {
    const url = `${SHEETS_API}/${CONFIG.SHEET_ID}/values/${PEOPLE_RANGE}:append?valueInputOption=USER_ENTERED`;
    const upperFields = ['firstName', 'paternalLastName', 'maternalLastName', 'address', 'notes', 'fatherName', 'motherName'];
    const row = FIELDS_ARRAY.map(field => {
      if (field === 'isAlive') return person[field] ? 'true' : 'false';
      if (field === 'generation') return String(person[field] || 0);
      let value = person[field] || '';
      if (upperFields.includes(field) && typeof value === 'string') {
        value = value.toUpperCase();
      }
      return value;
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [row] })
    });

    if (!response.ok) throw new Error('Error adding person');
    return true;
  } catch (error) {
    console.error('Error adding person:', error);
    throw error;
  }
}

export async function updatePerson(personId, updatedFields, token) {
  try {
    const allData = await fetchAllPersons(token);
    const rowIndex = allData.findIndex(p => p.id === personId);
    if (rowIndex === -1) throw new Error('Person not found');

    const rowNum = rowIndex + 2;
    const updates = [];

    for (const [field, value] of Object.entries(updatedFields)) {
      const colIndex = FIELDS_ARRAY.indexOf(field);
      if (colIndex === -1) continue;

      const colLetter = String.fromCharCode(65 + colIndex);
      let cellValue = value;
      if (field === 'isAlive') cellValue = value ? 'true' : 'false';
      if (field === 'generation') cellValue = String(value || 0);
      const upperFields = ['firstName', 'paternalLastName', 'maternalLastName', 'address', 'notes', 'fatherName', 'motherName'];
      if (upperFields.includes(field) && typeof cellValue === 'string') {
        cellValue = cellValue.toUpperCase();
      }

      updates.push({
        range: `'${CONFIG.SHEET_NAME}'!${colLetter}${rowNum}`,
        values: [[cellValue || '']]
      });
    }

    if (updates.length === 0) return true;

    const url = `${SHEETS_API}/${CONFIG.SHEET_ID}/values:batchUpdate`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: updates
      })
    });

    if (!response.ok) throw new Error('Error updating person');
    return true;
  } catch (error) {
    console.error('Error updating person:', error);
    throw error;
  }
}

export async function deletePerson(personId, token) {
  try {
    const allData = await fetchAllPersons(token);
    const rowIndex = allData.findIndex(p => p.id === personId);
    if (rowIndex === -1) throw new Error('Person not found');

    const rowNum = rowIndex + 2;
    const url = `${SHEETS_API}/${CONFIG.SHEET_ID}/values/'${CONFIG.SHEET_NAME}'!A${rowNum}:T${rowNum}:clear`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Error deleting person');
    return true;
  } catch (error) {
    console.error('Error deleting person:', error);
    throw error;
  }
}

export async function fetchSuggestions(token) {
  try {
    const url = `${SHEETS_API}/${CONFIG.SHEET_ID}/values/${SUGGESTIONS_RANGE}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Error fetching suggestions');

    const data = await response.json();
    const rows = data.values || [];

    if (rows.length <= 1) return [];

    return rows.slice(1).map(row => ({
      id: row[0] || '',
      suggestedBy: row[1] || '',
      personData: row[2] || '{}',
      status: row[3] || 'pending',
      createdAt: row[4] || '',
      reviewedBy: row[5] || '',
      reviewedAt: row[6] || ''
    })).filter(s => s.id);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    throw error;
  }
}

export async function addSuggestion(suggestion, token) {
  try {
    const url = `${SHEETS_API}/${CONFIG.SHEET_ID}/values/${SUGGESTIONS_RANGE}:append?valueInputOption=USER_ENTERED`;
    const row = [
      suggestion.id,
      suggestion.suggestedBy,
      JSON.stringify(suggestion.personData),
      suggestion.status,
      suggestion.createdAt,
      '',
      ''
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [row] })
    });

    if (!response.ok) throw new Error('Error adding suggestion');
    return true;
  } catch (error) {
    console.error('Error adding suggestion:', error);
    throw error;
  }
}

export async function updateSuggestionStatus(suggestionId, status, reviewerEmail, token) {
  try {
    const suggestions = await fetchSuggestions(token);
    const index = suggestions.findIndex(s => s.id === suggestionId);
    if (index === -1) throw new Error('Suggestion not found');

    const rowNum = index + 2;
    const url = `${SHEETS_API}/${CONFIG.SHEET_ID}/values:batchUpdate`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: `'${CONFIG.SUGGESTIONS_SHEET}'!D${rowNum}`, values: [[status]] },
          { range: `'${CONFIG.SUGGESTIONS_SHEET}'!F${rowNum}`, values: [[reviewerEmail]] },
          { range: `'${CONFIG.SUGGESTIONS_SHEET}'!G${rowNum}`, values: [[new Date().toISOString()]] }
        ]
      })
    });

    if (!response.ok) throw new Error('Error updating suggestion');
    return true;
  } catch (error) {
    console.error('Error updating suggestion:', error);
    throw error;
  }
}

// ============ CHAT ============
const CHAT_RANGE = `'${CONFIG.CHAT_SHEET}'!A:H`;

export async function fetchChatMessages(token) {
  try {
    const url = `${SHEETS_API}/${CONFIG.SHEET_ID}/values/${CHAT_RANGE}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Error fetching chat');
    const data = await response.json();
    const rows = data.values || [];
    if (rows.length <= 1) return [];
    return rows.slice(1).map(row => ({
      id: row[0] || '',
      userId: row[1] || '',
      userName: row[2] || '',
      userPhoto: row[3] || '',
      type: row[4] || 'text',
      content: row[5] || '',
      fileName: row[6] || '',
      createdAt: row[7] || ''
    })).filter(m => m.id);
  } catch (error) {
    console.error('Error fetching chat:', error);
    throw error;
  }
}

export async function sendChatMessage(message, token) {
  try {
    const url = `${SHEETS_API}/${CONFIG.SHEET_ID}/values/${CHAT_RANGE}:append?valueInputOption=USER_ENTERED`;
    const row = [
      message.id,
      message.userId,
      message.userName,
      message.userPhoto || '',
      message.type || 'text',
      message.content || '',
      message.fileName || '',
      message.createdAt || new Date().toISOString()
    ];
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [row] })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const detail = errData.error?.message || `HTTP ${response.status}`;
      throw new Error(detail);
    }
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}
