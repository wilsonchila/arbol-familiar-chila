import { useState, useCallback } from 'react';
import { fetchAllPersons, addPerson, updatePerson, deletePerson, fetchSuggestions, addSuggestion, updateSuggestionStatus } from '../services/sheetsService';
import { isAdmin } from '../services/validationService';
import { generateId } from '../utils/formatters';

export function useFamilyData(token, user) {
  const [persons, setPersons] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPersons = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllPersons(token);
      setPersons(data);
    } catch (err) {
      const errorMsg = err.message || 'Error al cargar los datos';
      setError(errorMsg);
      console.error('loadPersons error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadSuggestions = useCallback(async () => {
    if (!token || !isAdmin(user?.email)) return;
    try {
      const data = await fetchSuggestions(token);
      setSuggestions(data);
    } catch (err) {
      console.error('Error loading suggestions:', err);
    }
  }, [token, user]);

  const createPerson = useCallback(async (personData) => {
    if (!token) return false;
    setLoading(true);
    setError(null);
    try {
      const newPerson = {
        ...personData,
        id: generateId(),
        createdBy: user?.email || '',
        createdAt: new Date().toISOString(),
        status: isAdmin(user?.email) ? 'approved' : 'suggested'
      };

      if (isAdmin(user?.email)) {
        await addPerson(newPerson, token);
        setPersons(prev => [...prev, newPerson]);
      } else {
        await addSuggestion({
          id: generateId(),
          suggestedBy: user?.email,
          personData: newPerson,
          status: 'pending',
          createdAt: new Date().toISOString()
        }, token);
      }
      return true;
    } catch (err) {
      setError('Error al guardar la persona');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  const editPerson = useCallback(async (personId, updatedFields) => {
    if (!token || !isAdmin(user?.email)) return false;
    setLoading(true);
    setError(null);
    try {
      await updatePerson(personId, updatedFields, token);
      setPersons(prev =>
        prev.map(p => p.id === personId ? { ...p, ...updatedFields } : p)
      );
      return true;
    } catch (err) {
      setError('Error al actualizar la persona');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  const removePerson = useCallback(async (personId) => {
    if (!token || !isAdmin(user?.email)) return false;
    setLoading(true);
    setError(null);
    try {
      await deletePerson(personId, token);
      setPersons(prev => prev.filter(p => p.id !== personId));
      return true;
    } catch (err) {
      setError('Error al eliminar la persona');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  const approveSuggestion = useCallback(async (suggestionId) => {
    if (!token || !isAdmin(user?.email)) return false;
    try {
      const suggestion = suggestions.find(s => s.id === suggestionId);
      if (!suggestion) return false;

      let personData;
      try {
        personData = typeof suggestion.personData === 'string'
          ? JSON.parse(suggestion.personData)
          : suggestion.personData;
      } catch (e) {
        personData = suggestion.personData;
      }

      personData.status = 'approved';
      await addPerson(personData, token);
      await updateSuggestionStatus(suggestionId, 'approved', user.email, token);
      setPersons(prev => [...prev, personData]);
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      return true;
    } catch (err) {
      console.error('Error approving suggestion:', err);
      return false;
    }
  }, [token, user, suggestions]);

  const rejectSuggestion = useCallback(async (suggestionId) => {
    if (!token || !isAdmin(user?.email)) return false;
    try {
      await updateSuggestionStatus(suggestionId, 'rejected', user.email, token);
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      return true;
    } catch (err) {
      console.error('Error rejecting suggestion:', err);
      return false;
    }
  }, [token, user]);

  return {
    persons,
    suggestions,
    loading,
    error,
    loadPersons,
    loadSuggestions,
    createPerson,
    editPerson,
    removePerson,
    approveSuggestion,
    rejectSuggestion
  };
}
