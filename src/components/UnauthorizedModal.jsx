import '../styles/main.css';

export default function UnauthorizedModal({ message, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-icon">🔒</div>
        <h2>Acceso Restringido</h2>
        <p>{message}</p>
        <button className="modal-close-btn" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
}
