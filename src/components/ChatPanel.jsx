import { useState, useRef, useEffect } from 'react';
import { fetchChatMessages, sendChatMessage } from '../services/sheetsService';
import { generateId } from '../utils/formatters';
import '../styles/chat.css';

const MAX_CELL_CHARS = 25000;
const MAX_IMAGE_DIMENSION = 400;
const MAX_AUDIO_SECONDS = 15;

export default function ChatPanel({ user, token, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isOpen && token) loadMessages();
  }, [isOpen, token]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isRecording) {
      setRecordTime(0);
      recordTimerRef.current = setInterval(() => {
        setRecordTime(prev => {
          if (prev + 1 >= MAX_AUDIO_SECONDS) {
            setTimeout(() => stopRecording(), 100);
            return MAX_AUDIO_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      setRecordTime(0);
    }
    return () => { if (recordTimerRef.current) clearInterval(recordTimerRef.current); };
  }, [isRecording]);

  const formatRecordTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const msgs = await fetchChatMessages(token);
      setMessages(msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    } catch (err) {
      console.error('Error loading chat:', err);
      showError('Error al cargar mensajes. Verifica que exista la pestana ChatMensajes en la hoja de calculo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendText = async () => {
    if (!newMessage.trim() || sending) return;
    const msg = {
      id: generateId(),
      userId: user.email,
      userName: user.name || user.email,
      userPhoto: user.picture || '',
      type: 'text',
      content: newMessage.trim(),
      fileName: '',
      createdAt: new Date().toISOString()
    };
    try {
      setSending(true);
      await sendChatMessage(msg, token);
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending:', err);
      showError('Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 8000
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result;
          const charCount = base64.length;
          if (charCount > MAX_CELL_CHARS) {
            showError(`Audio muy pesado (${Math.round(charCount/1000)}K caracteres, max ${Math.round(MAX_CELL_CHARS/1000)}K). Graba mas corto.`);
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          const msg = {
            id: generateId(),
            userId: user.email,
            userName: user.name || user.email,
            userPhoto: user.picture || '',
            type: 'audio',
            content: base64,
            fileName: 'audio.webm',
            createdAt: new Date().toISOString()
          };
          try {
            setSending(true);
            await sendChatMessage(msg, token);
            setMessages(prev => [...prev, msg]);
          } catch (err) {
            console.error('Error sending audio:', err);
            showError('Error al enviar audio: ' + (err.message || 'Intenta de nuevo'));
          } finally {
            setSending(false);
          }
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      showError('No se pudo acceder al microfono. Verifica los permisos del navegador.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.5);
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    if (type === 'video') {
      showError('Los videos son muy grandes para Google Sheets. Usa texto o audio corto.');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      showError('Archivo muy grande. Maximo 3MB.');
      return;
    }

    try {
      setSending(true);
      let processedFile = file;

      if (type === 'image') {
        showError('Comprimiendo imagen...');
        processedFile = await compressImage(file);
        setErrorMsg('');
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        if (base64.length > MAX_CELL_CHARS) {
          showError('Imagen muy grande despues de comprimir. Intenta con otra imagen.');
          setSending(false);
          return;
        }
        const msg = {
          id: generateId(),
          userId: user.email,
          userName: user.name || user.email,
          userPhoto: user.picture || '',
          type: type,
          content: base64,
          fileName: file.name,
          createdAt: new Date().toISOString()
        };
        try {
          await sendChatMessage(msg, token);
          setMessages(prev => [...prev, msg]);
        } catch (err) {
          console.error('Error sending file:', err);
          showError('Error al enviar imagen: ' + (err.message || 'Intenta de nuevo'));
        } finally {
          setSending(false);
        }
      };
      reader.readAsDataURL(processedFile);
    } catch (err) {
      console.error('Error processing file:', err);
      setSending(false);
      showError('Error al procesar archivo');
    }
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const shouldShowDate = (dateStr, index) => {
    if (index === 0) return true;
    return new Date(messages[index - 1].createdAt).toDateString() !== new Date(dateStr).toDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="chat-panel-overlay" onClick={onClose}>
      <div className="chat-panel" onClick={e => e.stopPropagation()}>
        <div className="chat-header">
          <div className="chat-header-info">
            <span className="chat-icon">&#128172;</span>
            <h2>Chat Familiar</h2>
          </div>
          <button className="chat-close-btn" onClick={onClose}>&#10005;</button>
        </div>

        <div className="chat-messages">
          {loading ? (
            <div className="chat-loading">Cargando mensajes...</div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <span>&#128172;</span>
              <p>No hay mensajes aun. Se el primero!</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={msg.id}>
                {shouldShowDate(msg.createdAt, index) && (
                  <div className="chat-date-divider">{formatDate(msg.createdAt)}</div>
                )}
                <div className={`chat-message ${msg.userId === user.email ? 'own' : 'other'}`}>
                  {msg.userId !== user.email && (
                    <div className="chat-avatar">
                      {msg.userPhoto ? (
                        <img src={msg.userPhoto} alt="" />
                      ) : (
                        <span>{(msg.userName || '?')[0].toUpperCase()}</span>
                      )}
                    </div>
                  )}
                  <div className="chat-bubble">
                    {msg.userId !== user.email && (
                      <div className="chat-sender">{msg.userName}</div>
                    )}
                    {msg.type === 'text' && (
                      <div className="chat-text">{msg.content}</div>
                    )}
                    {msg.type === 'audio' && (
                      <audio controls src={msg.content} className="chat-audio" />
                    )}
                    {msg.type === 'image' && (
                      <img src={msg.content} alt={msg.fileName} className="chat-image" />
                    )}
                    {msg.type === 'video' && (
                      <video controls src={msg.content} className="chat-video" />
                    )}
                    <div className="chat-time">{formatTime(msg.createdAt)}</div>
                  </div>
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="chat-sending">Enviando...</div>
          )}
          {errorMsg && (
            <div className="chat-error">{errorMsg}</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          {isRecording && (
            <div className="recording-bar">
              <div className="recording-dot"></div>
              <span className="recording-timer">{formatRecordTime(recordTime)}</span>
              <span className="recording-label">
                Grabando... ({MAX_AUDIO_SECONDS - recordTime}s restantes)
              </span>
            </div>
          )}
          <div className="chat-actions-row">
            <button
              className={`chat-action-btn ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              title={isRecording ? 'Detener grabacion' : 'Grabar audio (max 15s)'}
            >
              {isRecording ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              )}
            </button>
            <button
              className="chat-action-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Enviar imagen (max 3MB)"
            >
              &#128247;
            </button>
          </div>
          <div className="chat-input-row">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              className="chat-text-input"
              disabled={sending}
            />
            <button
              className="chat-send-btn"
              onClick={handleSendText}
              disabled={!newMessage.trim() || sending}
            >
              &#10148;
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => handleFileSelect(e, 'image')}
          />
        </div>
      </div>
    </div>
  );
}
