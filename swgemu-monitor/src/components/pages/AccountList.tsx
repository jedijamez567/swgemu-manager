import { useState, useEffect, useCallback } from 'react';
import type { Account, PaginatedResponse } from '../../lib/types';
import { fetchAccounts } from '../../lib/api';

interface AccountListProps {
  onSelectAccount: (accountId: number) => void;
}

export function AccountList({ onSelectAccount }: AccountListProps) {
  const [data, setData] = useState<PaginatedResponse<Account> | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAccounts(page, 25, search || undefined);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <section>
      <h2>Accounts</h2>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by username..."
          className="form-input search-input"
        />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
        {search && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setPage(1);
            }}
          >
            Clear
          </button>
        )}
      </form>

      {error && <div className="error-bar">{error}</div>}

      {loading && !data && <div className="no-data">Loading accounts...</div>}

      {data && (
        <>
          <div className="table-info">
            {data.total} account{data.total !== 1 ? 's' : ''} found
            {search && <> matching "{search}"</>}
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Created</th>
                <th>Admin</th>
                <th>Active</th>
                <th>Characters</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((account) => (
                <tr
                  key={account.account_id}
                  className="clickable-row"
                  onClick={() => onSelectAccount(account.account_id)}
                >
                  <td>{account.account_id}</td>
                  <td className="text-bright">{account.username}</td>
                  <td>{new Date(account.created).toLocaleDateString()}</td>
                  <td>{account.admin_level > 0 ? `Level ${account.admin_level}` : '--'}</td>
                  <td>
                    <span className={account.active ? 'status-active' : 'status-inactive'}>
                      {account.active ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>{account.character_count ?? '--'}</td>
                </tr>
              ))}
              {data.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="no-data">
                    No accounts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {data.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span className="page-info">
                Page {data.page} of {data.totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
