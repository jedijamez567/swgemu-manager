import { useState, useEffect, useCallback } from 'react';
import type { AccountDetail as AccountDetailType, Galaxy } from '../../lib/types';
import { fetchAccount, banAccount } from '../../lib/api';
import { ResultDisplay } from '../ResultDisplay';
import { ConfirmDialog } from '../ConfirmDialog';

const RACE_NAMES: Record<number, string> = {
  0: 'Human',
  1: 'Rodian',
  2: 'Trandoshan',
  3: 'Mon Calamari',
  4: 'Wookiee',
  5: 'Bothan',
  6: 'Twi\'lek',
  7: 'Zabrak',
  8: 'Ithorian',
  9: 'Sullustan',
};

interface AccountDetailProps {
  accountId: number;
  token: string;
  galaxy: Galaxy | null;
  onSelectCharacter: (oid: string, name: string) => void;
}

export function AccountDetail({ accountId, token, galaxy, onSelectCharacter }: AccountDetailProps) {
  const [data, setData] = useState<AccountDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ban form state
  const [showBanForm, setShowBanForm] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banExpires, setBanExpires] = useState('');
  const [banAdminOid, setBanAdminOid] = useState('');
  const [banResult, setBanResult] = useState<unknown>(null);
  const [banError, setBanError] = useState<string | null>(null);
  const [banLoading, setBanLoading] = useState(false);
  const [confirmBan, setConfirmBan] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAccount(accountId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBan = async () => {
    setConfirmBan(false);
    setBanLoading(true);
    setBanError(null);
    setBanResult(null);
    try {
      const expires = banExpires ? Math.floor(new Date(banExpires).getTime() / 1000) : undefined;
      const result = await banAccount(token, accountId, banAdminOid, banReason, expires);
      setBanResult(result);
      load(); // Refresh to show new ban
    } catch (err) {
      setBanError(err instanceof Error ? err.message : 'Ban failed');
    } finally {
      setBanLoading(false);
    }
  };

  if (loading) return <div className="no-data">Loading account...</div>;
  if (error) return <div className="error-bar">{error}</div>;
  if (!data) return null;

  const { account, characters, bans } = data;

  return (
    <section>
      <h2>Account: {account.username}</h2>

      <div className="card-row">
        <div className="info-card">
          <span className="info-label">Account ID</span>
          <span className="info-value">{account.account_id}</span>
        </div>
        <div className="info-card">
          <span className="info-label">Created</span>
          <span className="info-value">{new Date(account.created).toLocaleDateString()}</span>
        </div>
        <div className="info-card">
          <span className="info-label">Admin Level</span>
          <span className="info-value">{account.admin_level}</span>
        </div>
        <div className="info-card">
          <span className="info-label">Active</span>
          <span className="info-value">
            <span className={account.active ? 'status-active' : 'status-inactive'}>
              {account.active ? 'Yes' : 'No'}
            </span>
          </span>
        </div>
      </div>

      {/* Characters */}
      <div className="subsection">
        <h3>Characters ({characters.length})</h3>
        {characters.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>OID</th>
                <th>Species</th>
                <th>Gender</th>
                <th>Template</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {characters.map((char) => (
                <tr
                  key={char.character_oid}
                  className="clickable-row"
                  onClick={() =>
                    onSelectCharacter(
                      char.character_oid,
                      char.surname ? `${char.firstname} ${char.surname}` : char.firstname
                    )
                  }
                >
                  <td className="text-bright">
                    {char.firstname}
                    {char.surname ? ` ${char.surname}` : ''}
                  </td>
                  <td className="text-mono">{char.character_oid}</td>
                  <td>{RACE_NAMES[char.race] ?? `Race ${char.race}`}</td>
                  <td>{char.gender === 0 ? 'Male' : 'Female'}</td>
                  <td className="text-dim">{char.template.split('/').pop()?.replace('.iff', '')}</td>
                  <td>{new Date(char.creation_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">No characters</div>
        )}
      </div>

      {/* Bans */}
      <div className="subsection">
        <h3>Ban History ({bans.length})</h3>
        {bans.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ban ID</th>
                <th>Reason</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Issuer ID</th>
              </tr>
            </thead>
            <tbody>
              {bans.map((ban) => (
                <tr key={ban.ban_id}>
                  <td>{ban.ban_id}</td>
                  <td>{ban.reason}</td>
                  <td>{new Date(ban.created).toLocaleString()}</td>
                  <td>{ban.expires === 0 ? 'Permanent' : new Date(ban.expires * 1000).toLocaleString()}</td>
                  <td>{ban.issuer_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">No bans</div>
        )}
      </div>

      {/* Ban Action */}
      <div className="subsection">
        <button
          className="btn btn-danger"
          onClick={() => setShowBanForm(!showBanForm)}
        >
          {showBanForm ? 'Cancel' : 'Ban Account'}
        </button>

        {showBanForm && (
          <div className="action-form">
            <div className="form-field">
              <label className="form-label">Admin OID</label>
              <input
                className="form-input"
                value={banAdminOid}
                onChange={(e) => setBanAdminOid(e.target.value)}
                placeholder="Your admin character OID"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Reason</label>
              <input
                className="form-input"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Ban reason"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Expires (optional, leave blank for permanent)</label>
              <input
                className="form-input"
                type="datetime-local"
                value={banExpires}
                onChange={(e) => setBanExpires(e.target.value)}
              />
            </div>
            <button
              className="btn btn-danger"
              disabled={!banReason || !banAdminOid || banLoading}
              onClick={() => setConfirmBan(true)}
            >
              {banLoading ? 'Banning...' : 'Submit Ban'}
            </button>
            <ResultDisplay result={banResult} error={banError} loading={banLoading} />
          </div>
        )}
      </div>

      {confirmBan && (
        <ConfirmDialog
          title="Ban Account"
          message={`Are you sure you want to ban account "${account.username}" (ID: ${account.account_id})?`}
          confirmLabel="Ban"
          danger
          onConfirm={handleBan}
          onCancel={() => setConfirmBan(false)}
        />
      )}
    </section>
  );
}
