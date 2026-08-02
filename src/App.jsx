import { useState, useEffect, useCallback } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useGoogleAuth } from './hooks/useGoogleAuth';
import { useFamilyData } from './hooks/useFamilyData';
import { computeStats } from './utils/treeBuilder';
import { isAdmin, isEditor, canEditorAddDirectly } from './services/validationService';
import { initEmailService, sendMemberAddedNotification } from './services/emailService';
import { CONFIG } from './config';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import FamilyTree from './components/FamilyTree';
import SuggestionPanel from './components/SuggestionPanel';
import ChatPanel from './components/ChatPanel';
import UnauthorizedModal from './components/UnauthorizedModal';
import './styles/main.css';

function AppContent() {
  const { user, token, loading: authLoading, signIn, signOut, isAuthenticated } = useGoogleAuth();
  const {
    persons,
    loading: dataLoading,
    error,
    loadPersons,
    loadSuggestions,
    createPerson,
    editPerson,
    removePerson,
    approveSuggestion,
    rejectSuggestion
  } = useFamilyData(token, user);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [unauthorizedMessage, setUnauthorizedMessage] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);
  const [roleOverride, setRoleOverride] = useState(null);
  const [emailStatus, setEmailStatus] = useState('');

  const stats = computeStats(persons);

  useEffect(() => {
    initEmailService();
  }, []);

  const loadData = useCallback(async () => {
    if (token) {
      await loadPersons();
      if (isAdmin(user?.email)) {
        await loadSuggestions();
      }
      setInitialLoad(false);
    }
  }, [token, user, loadPersons, loadSuggestions]);

  useEffect(() => {
    if (token && initialLoad) {
      loadData();
    }
  }, [token, initialLoad, loadData]);

  const handleRefresh = async () => {
    setInitialLoad(true);
    setError(null);
    await loadData();
  };

  const handleAddPerson = async (personData) => {
    const success = await createPerson(personData);
    if (success) {
      const memberName = `${personData.firstName || ''} ${personData.paternalLastName || ''} ${personData.maternalLastName || ''}`.trim();
      const role = roleOverride || (isAdmin(user?.email) ? 'admin' : isEditor(user?.email) ? 'editor' : 'usuario');
      const addsDirectly = canEditorAddDirectly(personData, roleOverride, user?.email);

      if (role !== 'admin') {
        const emailResult = await sendMemberAddedNotification(memberName, user?.name || user?.email, user?.email);
        if (emailResult.sent) {
          setEmailStatus('Notificacion enviada por correo');
          setTimeout(() => setEmailStatus(''), 4000);
        } else if (emailResult.reason === 'not_configured') {
          setEmailStatus('Miembro agregado. Email no configurado (revisa config.js)');
          setTimeout(() => setEmailStatus(''), 5000);
        } else {
          setEmailStatus('Miembro agregado. Error al enviar email: ' + emailResult.reason);
          setTimeout(() => setEmailStatus(''), 5000);
        }
      }

      if (!addsDirectly && !isAdmin(user?.email, roleOverride)) {
        setUnauthorizedMessage('Tu sugerencia ha sido enviada y esta pendiente de revision.');
        setTimeout(() => setUnauthorizedMessage(''), 3000);
      }
    }
    return success;
  };

  const handleEditPerson = async (personId, personData) => {
    return await editPerson(personId, personData);
  };

  const handleDeletePerson = async (personId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este miembro?')) {
      return await removePerson(personId);
    }
    return false;
  };

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Cargando autenticación...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <GoogleOAuthProvider clientId={CONFIG.GOOGLE_CLIENT_ID}>
      <LoginScreen />
    </GoogleOAuthProvider>;
  }

  return (
    <div className="app">
      <Header
        user={user}
        stats={stats}
        suggestionsCount={persons.filter(p => p.status === 'suggested').length}
        onShowSuggestions={() => setShowSuggestions(true)}
        onShowChat={() => setShowChat(true)}
        onSignOut={signOut}
        onRefresh={handleRefresh}
        roleOverride={roleOverride}
        onRoleChange={setRoleOverride}
      />

      <main className="main-content">
        {dataLoading && initialLoad ? (
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p>Cargando datos del árbol familiar...</p>
          </div>
        ) : error ? (
          <div className="error-screen">
            <div className="error-icon">⚠️</div>
            <h2>Error</h2>
            <p>{error}</p>
            <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
              <p>Posibles soluciones:</p>
              <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                <li>Verifica que la hoja de cálculo esté compartida con tu email</li>
                <li>Verifica que la API de Google Sheets esté habilitada</li>
                <li>Verifica que los scopes estén configurados correctamente</li>
              </ul>
            </div>
            <button onClick={handleRefresh} style={{ marginTop: '16px' }}>Reintentar</button>
          </div>
        ) : (
          <FamilyTree
            persons={persons}
            user={user}
            roleOverride={roleOverride}
            onEdit={handleEditPerson}
            onDelete={handleDeletePerson}
            onAddPerson={handleAddPerson}
            onRefresh={handleRefresh}
          />
        )}
      </main>

      {showSuggestions && (
        <SuggestionPanel
          user={user}
          token={token}
          onApprove={approveSuggestion}
          onReject={rejectSuggestion}
          onClose={() => setShowSuggestions(false)}
        />
      )}

      <ChatPanel
        user={user}
        token={token}
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />

      {unauthorizedMessage && (
        <UnauthorizedModal
          message={unauthorizedMessage}
          onClose={() => setUnauthorizedMessage('')}
        />
      )}

      {emailStatus && (
        <div className="email-notification-toast">
          {emailStatus}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={CONFIG.GOOGLE_CLIENT_ID}>
      <AppContent />
    </GoogleOAuthProvider>
  );
}
