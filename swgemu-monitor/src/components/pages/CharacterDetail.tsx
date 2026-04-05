import { useState, useEffect, useCallback } from 'react';
import type { Galaxy } from '../../lib/types';
import { searchCharacters, kickCharacter, banAccount, sendMail, sendMessage } from '../../lib/api';
import { ResultDisplay } from '../ResultDisplay';
import { ConfirmDialog } from '../ConfirmDialog';

interface CharacterDetailProps {
  characterOid: string;
  characterName: string;
  accountId: number;
  token: string;
  galaxy: Galaxy | null;
}

function extractCharacterData(objects: Record<string, unknown>) {
  const entries = Object.values(objects) as Record<string, unknown>[];

  // Find the main creature object
  const creature = entries.find(
    (obj) =>
      typeof obj._className === 'string' &&
      obj._className.includes('Creature')
  );

  // Find credit object
  const creditObj = entries.find(
    (obj) =>
      typeof obj._className === 'string' &&
      obj._className.includes('Credit')
  );

  // Find player object
  const playerObj = entries.find(
    (obj) =>
      typeof obj._className === 'string' &&
      obj._className.includes('Player')
  );

  // Extract skills
  let skills: string[] = [];
  if (creature && Array.isArray(creature.skillList)) {
    skills = creature.skillList as string[];
  } else if (playerObj && Array.isArray(playerObj.skillList)) {
    skills = playerObj.skillList as string[];
  }

  // Extract credits
  let cashCredits = 0;
  let bankCredits = 0;
  if (creditObj) {
    cashCredits = (creditObj.cashCredits as number) || 0;
    bankCredits = (creditObj.bankCredits as number) || 0;
  } else if (creature) {
    cashCredits = (creature.cashCredits as number) || 0;
    bankCredits = (creature.bankCredits as number) || 0;
  }

  // Extract inventory items
  const inventoryItems = entries.filter(
    (obj) =>
      typeof obj._className === 'string' &&
      !obj._className.includes('Creature') &&
      !obj._className.includes('Player') &&
      !obj._className.includes('Credit') &&
      (obj._depth as number) > 1
  );

  return { creature, playerObj, creditObj, skills, cashCredits, bankCredits, inventoryItems };
}

export function CharacterDetail({
  characterOid,
  characterName,
  accountId,
  token,
  galaxy,
}: CharacterDetailProps) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [rawResponse, setRawResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  // Action states
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<unknown>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  // Form fields
  const [adminOid, setAdminOid] = useState('');
  const [reason, setReason] = useState('');
  const [banExpires, setBanExpires] = useState('');
  const [mailFrom, setMailFrom] = useState('');
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');
  const [msgFrom, setMsgFrom] = useState('');
  const [msgBody, setMsgBody] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const firstName = characterName.split(' ')[0];
      const result = await searchCharacters(token, firstName, {
        recursive: true,
        maxdepth: 3,
        limit: 10,
      });
      setRawResponse(result);
      const res = result as { objects?: Record<string, unknown> };
      if (res.objects) {
        setData(res.objects as Record<string, unknown>);
      } else {
        setError('No object data returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load character');
    } finally {
      setLoading(false);
    }
  }, [token, characterName, characterOid]);

  useEffect(() => {
    load();
  }, [load]);

  const galaxyId = galaxy?.galaxy_id ?? 2;

  const handleKick = async () => {
    setConfirmAction(null);
    setActionLoading(true);
    setActionError(null);
    setActionResult(null);
    try {
      const result = await kickCharacter(token, accountId, galaxyId, characterOid, adminOid, reason);
      setActionResult(result);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Kick failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBan = async () => {
    setConfirmAction(null);
    setActionLoading(true);
    setActionError(null);
    setActionResult(null);
    try {
      const expires = banExpires ? Math.floor(new Date(banExpires).getTime() / 1000) : undefined;
      const result = await banAccount(token, accountId, adminOid, reason, expires);
      setActionResult(result);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Ban failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMail = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionResult(null);
    try {
      const result = await sendMail(token, mailFrom, characterName.split(' ')[0], mailSubject, mailBody);
      setActionResult(result);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Send mail failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionResult(null);
    try {
      const result = await sendMessage(token, msgFrom, characterName.split(' ')[0], msgBody);
      setActionResult(result);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Send message failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="no-data">Loading character data...</div>;
  if (error) return <div className="error-bar">{error}</div>;

  const extracted = data ? extractCharacterData(data) : null;

  return (
    <section>
      <h2>{characterName}</h2>

      <div className="card-row">
        <div className="info-card">
          <span className="info-label">OID</span>
          <span className="info-value text-mono">{characterOid}</span>
        </div>
        <div className="info-card">
          <span className="info-label">Cash Credits</span>
          <span className="info-value">{extracted?.cashCredits?.toLocaleString() ?? '--'}</span>
        </div>
        <div className="info-card">
          <span className="info-label">Bank Credits</span>
          <span className="info-value">{extracted?.bankCredits?.toLocaleString() ?? '--'}</span>
        </div>
        <div className="info-card">
          <span className="info-label">Account ID</span>
          <span className="info-value">{accountId}</span>
        </div>
      </div>

      {/* Skills */}
      {extracted && extracted.skills.length > 0 && (
        <div className="subsection">
          <h3>Skills ({extracted.skills.length})</h3>
          <div className="skills-list">
            {extracted.skills.map((skill, i) => (
              <span key={i} className="skill-badge">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Items */}
      {extracted && extracted.inventoryItems.length > 0 && (
        <div className="subsection">
          <h3>Objects ({extracted.inventoryItems.length})</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>OID</th>
                <th>Class</th>
                <th>Depth</th>
              </tr>
            </thead>
            <tbody>
              {extracted.inventoryItems.slice(0, 50).map((item, i) => (
                <tr key={i}>
                  <td className="text-mono">{String(item._oid)}</td>
                  <td>{String(item._className)}</td>
                  <td>{String(item._depth)}</td>
                </tr>
              ))}
              {extracted.inventoryItems.length > 50 && (
                <tr>
                  <td colSpan={3} className="no-data">
                    ...and {extracted.inventoryItems.length - 50} more
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Actions */}
      <div className="subsection">
        <h3>Actions</h3>
        <div className="action-buttons">
          <button
            className={`btn ${activeAction === 'kick' ? 'btn-secondary' : 'btn-danger'}`}
            onClick={() => {
              setActiveAction(activeAction === 'kick' ? null : 'kick');
              setActionResult(null);
              setActionError(null);
            }}
          >
            {activeAction === 'kick' ? 'Cancel' : 'Kick'}
          </button>
          <button
            className={`btn ${activeAction === 'ban' ? 'btn-secondary' : 'btn-danger'}`}
            onClick={() => {
              setActiveAction(activeAction === 'ban' ? null : 'ban');
              setActionResult(null);
              setActionError(null);
            }}
          >
            {activeAction === 'ban' ? 'Cancel' : 'Ban'}
          </button>
          <button
            className={`btn ${activeAction === 'mail' ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => {
              setActiveAction(activeAction === 'mail' ? null : 'mail');
              setActionResult(null);
              setActionError(null);
            }}
          >
            {activeAction === 'mail' ? 'Cancel' : 'Send Mail'}
          </button>
          <button
            className={`btn ${activeAction === 'message' ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => {
              setActiveAction(activeAction === 'message' ? null : 'message');
              setActionResult(null);
              setActionError(null);
            }}
          >
            {activeAction === 'message' ? 'Cancel' : 'Send IM'}
          </button>
        </div>

        {/* Kick Form */}
        {activeAction === 'kick' && (
          <div className="action-form">
            <div className="form-field">
              <label className="form-label">Admin OID</label>
              <input className="form-input" value={adminOid} onChange={(e) => setAdminOid(e.target.value)} placeholder="Your admin character OID" />
            </div>
            <div className="form-field">
              <label className="form-label">Reason</label>
              <input className="form-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Kick reason" />
            </div>
            <button className="btn btn-danger" disabled={!adminOid || !reason || actionLoading} onClick={() => setConfirmAction('kick')}>
              {actionLoading ? 'Processing...' : 'Kick Player'}
            </button>
          </div>
        )}

        {/* Ban Form */}
        {activeAction === 'ban' && (
          <div className="action-form">
            <div className="form-field">
              <label className="form-label">Admin OID</label>
              <input className="form-input" value={adminOid} onChange={(e) => setAdminOid(e.target.value)} placeholder="Your admin character OID" />
            </div>
            <div className="form-field">
              <label className="form-label">Reason</label>
              <input className="form-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ban reason" />
            </div>
            <div className="form-field">
              <label className="form-label">Expires (optional)</label>
              <input className="form-input" type="datetime-local" value={banExpires} onChange={(e) => setBanExpires(e.target.value)} />
            </div>
            <button className="btn btn-danger" disabled={!adminOid || !reason || actionLoading} onClick={() => setConfirmAction('ban')}>
              {actionLoading ? 'Processing...' : 'Ban Account'}
            </button>
          </div>
        )}

        {/* Send Mail Form */}
        {activeAction === 'mail' && (
          <div className="action-form">
            <div className="form-field">
              <label className="form-label">From</label>
              <input className="form-input" value={mailFrom} onChange={(e) => setMailFrom(e.target.value)} placeholder="Sender name" />
            </div>
            <div className="form-field">
              <label className="form-label">Subject</label>
              <input className="form-input" value={mailSubject} onChange={(e) => setMailSubject(e.target.value)} placeholder="Mail subject" />
            </div>
            <div className="form-field">
              <label className="form-label">Body</label>
              <textarea className="form-input form-textarea" value={mailBody} onChange={(e) => setMailBody(e.target.value)} placeholder="Mail body" rows={4} />
            </div>
            <button className="btn btn-primary" disabled={!mailFrom || !mailSubject || !mailBody || actionLoading} onClick={handleSendMail}>
              {actionLoading ? 'Sending...' : 'Send Mail'}
            </button>
          </div>
        )}

        {/* Send Message Form */}
        {activeAction === 'message' && (
          <div className="action-form">
            <div className="form-field">
              <label className="form-label">From</label>
              <input className="form-input" value={msgFrom} onChange={(e) => setMsgFrom(e.target.value)} placeholder="Sender name" />
            </div>
            <div className="form-field">
              <label className="form-label">Message</label>
              <textarea className="form-input form-textarea" value={msgBody} onChange={(e) => setMsgBody(e.target.value)} placeholder="Message body" rows={3} />
            </div>
            <button className="btn btn-primary" disabled={!msgFrom || !msgBody || actionLoading} onClick={handleSendMessage}>
              {actionLoading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        )}

        <ResultDisplay result={actionResult} error={actionError} loading={actionLoading} />
      </div>

      {/* Raw JSON toggle */}
      <div className="subsection">
        <button className="raw-toggle" onClick={() => setShowRaw(!showRaw)}>
          {showRaw ? 'Hide' : 'Show'} Raw Object Data
        </button>
        {showRaw && rawResponse && (
          <pre className="raw-json">{JSON.stringify(rawResponse, null, 2)}</pre>
        )}
      </div>

      {/* Confirm Dialogs */}
      {confirmAction === 'kick' && (
        <ConfirmDialog
          title="Kick Player"
          message={`Kick "${characterName}" from the server?`}
          confirmLabel="Kick"
          danger
          onConfirm={handleKick}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === 'ban' && (
        <ConfirmDialog
          title="Ban Account"
          message={`Ban the account (ID: ${accountId}) for "${characterName}"?`}
          confirmLabel="Ban"
          danger
          onConfirm={handleBan}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </section>
  );
}
