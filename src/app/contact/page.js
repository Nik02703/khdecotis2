'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useMessages } from '@/context/MessageContext';
import styles from './page.module.css';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', text: '' });
  const [status, setStatus] = useState('');
  const { addMessage } = useMessages();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.text) {
      setStatus('error');
      return;
    }
    
    addMessage(formData);
    setStatus('success');
    setFormData({ name: '', email: '', text: '' });
    
    setTimeout(() => setStatus(''), 3000);
  };
  return (
    <div className={styles.pageBg}>
      <div className="container animate-fade-in page-wrapper">
        <div className="page-header">
          <h1 className="page-title">Contact Us</h1>
          <p className="page-subtitle">We'd love to hear from you. Get in touch with us directly or drop a message below.</p>
        </div>
        
        <div className={styles.contactGrid}>
          <div className={styles.contactInfo}>
            <div className={styles.infoCard}>
              <h3 className={styles.infoTitle}>Business Details</h3>
              <div className={styles.infoItem}>
                <strong>📞 Phone:</strong> 
                <br/>
                <a href="tel:9016816907">9016816907</a>
              </div>
              <div className={styles.infoItem}>
                <strong>✉️ Email:</strong> 
                <br/>
                <a href="mailto:info@khdecotis.com">info@khdecotis.com</a>
              </div>
              <div className={styles.infoItem}>
                <strong>📍 Location:</strong> 
                <br/>
                KH Decotis, 3rd Floor, Vishwamohini Complex, Nr Panchratna Appartment, Subhanpura, Vadodara
              </div>
            </div>
            
            <div className={styles.mapContainer}>
              {/* Embedded Google Maps dynamically zooming into exact requested location */}
              <iframe 
                src="https://maps.google.com/maps?q=Gf+13,+Vishwa+Mohini+Apartments,+nr.+Panchratna+Appt,+opp.+Ganga+Jamna+Hospital,+Subhanpura,+Vadodara,+Gujarat+390023,+India&t=&z=17&ie=UTF8&iwloc=&output=embed"
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          <form className={styles.formWrapper} onSubmit={handleSubmit}>
            <h3 className={styles.infoTitle} style={{ marginBottom: '1.5rem' }}>Send a Message</h3>
            
            {status === 'success' && (
              <div style={{ background: '#dcfce7', color: '#16a34a', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontWeight: 600 }}>Message Sent Successfully! We'll be in touch soon.</div>
            )}
            {status === 'error' && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontWeight: 600 }}>Please fill out all fields before submitting.</div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>Name</label>
              <input type="text" className={styles.input} placeholder="Your name" value={formData.name} onChange={e => setFormData(f => ({...f, name: e.target.value}))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input type="email" className={styles.input} placeholder="your@email.com" value={formData.email} onChange={e => setFormData(f => ({...f, email: e.target.value}))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Message</label>
              <textarea rows="6" className={styles.textarea} placeholder="How can we help?" value={formData.text} onChange={e => setFormData(f => ({...f, text: e.target.value}))}></textarea>
            </div>
            <Button fullWidth onClick={handleSubmit}>Send Message</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
