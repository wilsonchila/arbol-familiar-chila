import { useEffect, useRef } from 'react';
import '../styles/login.css';

export default function LoginScreen({ onLogin }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    if (window.google && buttonRef.current) {
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 300
      });
    }
  }, []);

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <div className="family-icon">👴</div>
          <h1>Árbol Familiar de</h1>
          <h2>Santiago Chila</h2>
        </div>

        <p className="login-description">
          Descubre y contribuye al árbol genealógico de la familia Chila.
          Inicia sesión para ver y agregar miembros.
        </p>

        <div className="login-features">
          <div className="feature">
            <span className="feature-icon">👀</span>
            <span>Explora el árbol familiar</span>
          </div>
          <div className="feature">
            <span className="feature-icon">➕</span>
            <span>Agrega nuevos miembros</span>
          </div>
          <div className="feature">
            <span className="feature-icon">✏️</span>
            <span>Sugiere ediciones</span>
          </div>
        </div>

        <div className="login-button-container">
          <div ref={buttonRef} id="google-signin-button"></div>
        </div>

        <p className="login-note">
          Solo se usa tu cuenta Google para identificarte. No se almacena tu contraseña.
        </p>
      </div>
    </div>
  );
}
