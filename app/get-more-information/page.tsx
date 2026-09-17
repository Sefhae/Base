'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { SETUP_STORAGE_KEY } from '../setup-storage';

const EMAIL = 'baseentertainment@gmail.com';

export default function GetMoreInformation() {
  const [opened, setOpened] = useState(false);
  // Pre-filled when someone arrives from /build-your-setup having saved a setup.
  // Written straight to the textarea rather than into state, so there is no
  // server/client value to mismatch during hydration.
  const messageRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SETUP_STORAGE_KEY);
      if (saved && messageRef.current) {
        messageRef.current.value = saved;
        sessionStorage.removeItem(SETUP_STORAGE_KEY);
      }
    } catch {
      // Private browsing can block storage; the form still works without it.
    }
  }, []);
  const handleSubmit = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const value = (key: string) => {
      const entry = data.get(key);
      return typeof entry === 'string' ? entry.trim() : '';
    };
    const name = `${value('firstName')} ${value('lastName')}`.trim();
    const body = [
      `Name: ${name}`,
      `Phone: ${value('phone')}`,
      `Email: ${value('email')}`,
      `Communication preference: ${value('preference')}`,
      `Agreed to be contacted: ${value('contactConsent') ? 'Yes' : 'No'}`,
      `Agreed to privacy terms: ${value('privacyConsent') ? 'Yes' : 'No'}`,
      '',
      'Message:',
      value('message') || '(none)',
      '',
    ].join('\n');
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(
      `Information request — ${name}`,
    )}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  };
  return (
    <>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <header id="top">
        <Link href="/" className="logo" aria-label="BASE Entertainment home">
          BASE<span>ENTERTAINMENT</span>
        </Link>
        <Link className="text-link" href="/">
          <ArrowLeft size={18} /> Back to the website
        </Link>
      </header>
      <main id="main" className="form-page wrap">
        <p className="eyebrow">LET’S MAKE SOMETHING MEANINGFUL</p>
        <h1>Get More Information</h1>
        <p className="form-intro">
          Discover our packages, details, and everything you need to plan your
          perfect memories.
        </p>
        <form
          className="info-form"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit(event.currentTarget);
          }}
        >
          <fieldset>
            <legend>Name</legend>
            <div className="field-row">
              <p className="field">
                <label htmlFor="firstName">
                  First Name <span className="req">(required)</span>
                </label>
                <input id="firstName" name="firstName" required />
              </p>
              <p className="field">
                <label htmlFor="lastName">
                  Last Name <span className="req">(required)</span>
                </label>
                <input id="lastName" name="lastName" required />
              </p>
            </div>
          </fieldset>
          <div className="field-row">
            <p className="field">
              <label htmlFor="phone">
                Phone <span className="req">(required)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
              />
            </p>
            <p className="field">
              <label htmlFor="email">
                Email <span className="req">(required)</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </p>
          </div>
          <p className="field">
            <label htmlFor="preference">
              Communication Preference <span className="req">(required)</span>
            </label>
            <select id="preference" name="preference" defaultValue="" required>
              <option value="" disabled>
                Choose one
              </option>
              <option>Email</option>
              <option>Phone call</option>
              <option>Text message</option>
            </select>
          </p>
          <p className="field">
            <label htmlFor="message">Your Message</label>
            <textarea id="message" name="message" rows={6} ref={messageRef} />
          </p>
          <div className="consent">
            <p className="consent-item">
              <input
                id="contactConsent"
                name="contactConsent"
                type="checkbox"
                value="yes"
                required
              />
              <label htmlFor="contactConsent">
                I agree to be contacted by BASE Entertainment about my inquiry,
                using the method I chose above.{' '}
                <span className="req">(required)</span>
              </label>
            </p>
            <p className="consent-item">
              <input
                id="privacyConsent"
                name="privacyConsent"
                type="checkbox"
                value="yes"
                required
              />
              <label htmlFor="privacyConsent">
                I agree to my details being used to answer my inquiry.{' '}
                <span className="req">(required)</span>
              </label>
            </p>
            <p className="consent-note">
              Your details are used only to reply to you. Submitting opens your
              own email app, so this website never stores your information or
              shares it with anyone else.
            </p>
          </div>
          <button className="button" type="submit">
            Submit <ArrowUpRight size={18} />
          </button>
          {opened ? (
            <output className="form-note">
              Your email app should have opened with your details ready to send.
              If nothing happened, write to {EMAIL} directly.
            </output>
          ) : (
            <span className="form-note">
              Submitting opens your email app with these details filled in, so
              you can send them to us.
            </span>
          )}
        </form>
      </main>
      <footer>
        <div className="footer-top">
          <Link href="/" className="logo">
            BASE<span>ENTERTAINMENT</span>
          </Link>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} BASE Entertainment</span>
          <span>Based in Orlando · Serving all of Florida</span>
          <Link href="/">BACK TO HOME ↑</Link>
        </div>
      </footer>
    </>
  );
}
