import { useState } from 'react';
import { sendMail, sendMessage, broadcastGalaxy } from '../../lib/api';
import { ResultDisplay } from '../ResultDisplay';

interface ChatPageProps {
  token: string;
}

export function ChatPage({ token }: ChatPageProps) {
  // Mail form
  const [mailFrom, setMailFrom] = useState('');
  const [mailTo, setMailTo] = useState('');
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');
  const [mailResult, setMailResult] = useState<unknown>(null);
  const [mailError, setMailError] = useState<string | null>(null);
  const [mailLoading, setMailLoading] = useState(false);

  // IM form
  const [imFrom, setImFrom] = useState('');
  const [imTo, setImTo] = useState('');
  const [imBody, setImBody] = useState('');
  const [imResult, setImResult] = useState<unknown>(null);
  const [imError, setImError] = useState<string | null>(null);
  const [imLoading, setImLoading] = useState(false);

  // Broadcast form
  const [bcFrom, setBcFrom] = useState('');
  const [bcBody, setBcBody] = useState('');
  const [bcResult, setBcResult] = useState<unknown>(null);
  const [bcError, setBcError] = useState<string | null>(null);
  const [bcLoading, setBcLoading] = useState(false);

  const handleSendMail = async (e: React.FormEvent) => {
    e.preventDefault();
    setMailLoading(true);
    setMailError(null);
    setMailResult(null);
    try {
      const result = await sendMail(token, mailFrom, mailTo, mailSubject, mailBody);
      setMailResult(result);
    } catch (err) {
      setMailError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setMailLoading(false);
    }
  };

  const handleSendIM = async (e: React.FormEvent) => {
    e.preventDefault();
    setImLoading(true);
    setImError(null);
    setImResult(null);
    try {
      const result = await sendMessage(token, imFrom, imTo, imBody);
      setImResult(result);
    } catch (err) {
      setImError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setImLoading(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setBcLoading(true);
    setBcError(null);
    setBcResult(null);
    try {
      const result = await broadcastGalaxy(token, bcFrom, bcBody);
      setBcResult(result);
    } catch (err) {
      setBcError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBcLoading(false);
    }
  };

  return (
    <div className="page">
      <h2>Chat & Messaging</h2>
      <div className="info-banner">
        The API supports sending messages only. Message history is not available through the REST API.
      </div>

      <div className="chat-grid">
        {/* Send Mail */}
        <div className="chat-card">
          <h3>Send Mail</h3>
          <form onSubmit={handleSendMail}>
            <div className="form-field">
              <label className="form-label">From</label>
              <input className="form-input" value={mailFrom} onChange={(e) => setMailFrom(e.target.value)} placeholder="Sender name" required />
            </div>
            <div className="form-field">
              <label className="form-label">To</label>
              <input className="form-input" value={mailTo} onChange={(e) => setMailTo(e.target.value)} placeholder="name, name1;name2, guild:ABBR, @online" required />
            </div>
            <div className="form-field">
              <label className="form-label">Subject</label>
              <input className="form-input" value={mailSubject} onChange={(e) => setMailSubject(e.target.value)} placeholder="Subject" required />
            </div>
            <div className="form-field">
              <label className="form-label">Body</label>
              <textarea className="form-input form-textarea" value={mailBody} onChange={(e) => setMailBody(e.target.value)} placeholder="Message body" rows={4} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={mailLoading}>
              {mailLoading ? 'Sending...' : 'Send Mail'}
            </button>
            <ResultDisplay result={mailResult} error={mailError} loading={mailLoading} />
          </form>
        </div>

        {/* Send Instant Message */}
        <div className="chat-card">
          <h3>Send Instant Message</h3>
          <form onSubmit={handleSendIM}>
            <div className="form-field">
              <label className="form-label">From</label>
              <input className="form-input" value={imFrom} onChange={(e) => setImFrom(e.target.value)} placeholder="Sender name" required />
            </div>
            <div className="form-field">
              <label className="form-label">To</label>
              <input className="form-input" value={imTo} onChange={(e) => setImTo(e.target.value)} placeholder="Player name (must be online)" required />
            </div>
            <div className="form-field">
              <label className="form-label">Message</label>
              <textarea className="form-input form-textarea" value={imBody} onChange={(e) => setImBody(e.target.value)} placeholder="Message body" rows={3} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={imLoading}>
              {imLoading ? 'Sending...' : 'Send Message'}
            </button>
            <ResultDisplay result={imResult} error={imError} loading={imLoading} />
          </form>
        </div>

        {/* Galaxy Broadcast */}
        <div className="chat-card">
          <h3>Galaxy Broadcast</h3>
          <form onSubmit={handleBroadcast}>
            <div className="form-field">
              <label className="form-label">From</label>
              <input className="form-input" value={bcFrom} onChange={(e) => setBcFrom(e.target.value)} placeholder="Sender name" required />
            </div>
            <div className="form-field">
              <label className="form-label">Message</label>
              <textarea className="form-input form-textarea" value={bcBody} onChange={(e) => setBcBody(e.target.value)} placeholder="Broadcast message to all online players" rows={3} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={bcLoading}>
              {bcLoading ? 'Broadcasting...' : 'Broadcast'}
            </button>
            <ResultDisplay result={bcResult} error={bcError} loading={bcLoading} />
          </form>
        </div>
      </div>
    </div>
  );
}
