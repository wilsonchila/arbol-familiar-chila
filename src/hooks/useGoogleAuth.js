import { useState, useEffect, useCallback, useRef } from 'react';
import { CONFIG } from '../config';

let gisInitialized = false;

export function useGoogleAuth() {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tokenClientRef = useRef(null);
  const pendingUserRef = useRef(null);

  useEffect(() => {
    if (gisInitialized) {
      setLoading(false);
      const savedUser = localStorage.getItem('googleUser');
      const savedToken = localStorage.getItem('googleAccessToken');
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
        setAccessToken(savedToken);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => initGIS();
    document.head.appendChild(script);
  }, []);

  const initGIS = () => {
    if (!window.google || !window.google.accounts) {
      setLoading(false);
      return;
    }

    window.google.accounts.id.initialize({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
    });

    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      scope: CONFIG.SCOPES,
      callback: handleTokenResponse,
    });

    gisInitialized = true;
    setLoading(false);

    const btn = document.getElementById('google-signin-button');
    if (btn) {
      window.google.accounts.id.renderButton(btn, {
        theme: 'outline',
        size: 'large',
        width: 300
      });
    }
  };

  const handleCredentialResponse = (response) => {
    try {
      const payload = parseJwt(response.credential);
      pendingUserRef.current = {
        email: payload.email,
        name: payload.name || '',
        picture: payload.picture || '',
        sub: payload.sub
      };
      tokenClientRef.current?.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      setError('Error al autenticar');
    }
  };

  const handleTokenResponse = (tokenResponse) => {
    if (tokenResponse.error) {
      setError('Error de permisos: ' + tokenResponse.error);
      return;
    }
    setAccessToken(tokenResponse.access_token);
    localStorage.setItem('googleAccessToken', tokenResponse.access_token);
    if (pendingUserRef.current) {
      setUser(pendingUserRef.current);
      localStorage.setItem('googleUser', JSON.stringify(pendingUserRef.current));
      pendingUserRef.current = null;
    }
  };

  const parseJwt = (token) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(atob(base64).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join('')));
  };

  const signOut = () => {
    if (window.google && accessToken) {
      window.google.accounts.oauth2.revoke(accessToken);
      window.google.accounts.id.disableAutoSelect();
    }
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('googleUser');
    localStorage.removeItem('googleAccessToken');
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('googleUser');
    const savedToken = localStorage.getItem('googleAccessToken');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setAccessToken(savedToken);
    }
  }, []);

  return {
    user,
    token: accessToken,
    loading,
    error,
    signOut,
    isAuthenticated: !!user && !!accessToken
  };
}
