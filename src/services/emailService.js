import emailjs from '@emailjs/browser';
import { CONFIG } from '../config';

export function initEmailService() {
  if (CONFIG.EMAILJS_PUBLIC_KEY) {
    emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
    console.log('EmailJS initialized');
  } else {
    console.warn('EmailJS: No public key configured');
  }
}

export async function sendMemberAddedNotification(memberName, addedBy, addedByEmail) {
  if (!CONFIG.EMAILJS_SERVICE_ID || !CONFIG.EMAILJS_TEMPLATE_ID || !CONFIG.EMAILJS_PUBLIC_KEY) {
    console.warn('EmailJS not configured. Check EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY in config.js');
    return { sent: false, reason: 'not_configured' };
  }

  try {
    console.log('Sending notification email...', { memberName, addedBy, addedByEmail });
    const result = await emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, {
      member_name: memberName,
      added_by: addedBy,
      added_by_email: addedByEmail,
      app_name: 'Arbol Familiar Chila'
    });
    console.log('Email sent successfully:', result);
    return { sent: true };
  } catch (error) {
    console.error('Error sending notification email:', error);
    return { sent: false, reason: error.message || error };
  }
}
