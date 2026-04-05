import { useState } from 'react';
import type { Galaxy } from '../../lib/types';
import { AccountList } from './AccountList';
import { AccountDetail } from './AccountDetail';
import { CharacterDetail } from './CharacterDetail';

type View =
  | { type: 'list' }
  | { type: 'account'; accountId: number }
  | { type: 'character'; characterOid: string; characterName: string; accountId: number };

interface PlayersPageProps {
  token: string;
  galaxy: Galaxy | null;
}

export function PlayersPage({ token, galaxy }: PlayersPageProps) {
  const [view, setView] = useState<View>({ type: 'list' });

  return (
    <div className="page">
      {view.type !== 'list' && (
        <div className="breadcrumb">
          <button className="btn-link" onClick={() => setView({ type: 'list' })}>
            Accounts
          </button>
          {view.type === 'character' && (
            <>
              <span className="breadcrumb-sep">/</span>
              <button
                className="btn-link"
                onClick={() => setView({ type: 'account', accountId: view.accountId })}
              >
                Account #{view.accountId}
              </button>
            </>
          )}
        </div>
      )}

      {view.type === 'list' && (
        <AccountList onSelectAccount={(id) => setView({ type: 'account', accountId: id })} />
      )}

      {view.type === 'account' && (
        <AccountDetail
          accountId={view.accountId}
          token={token}
          galaxy={galaxy}
          onSelectCharacter={(oid, name) =>
            setView({
              type: 'character',
              characterOid: oid,
              characterName: name,
              accountId: view.accountId,
            })
          }
        />
      )}

      {view.type === 'character' && (
        <CharacterDetail
          characterOid={view.characterOid}
          characterName={view.characterName}
          accountId={view.accountId}
          token={token}
          galaxy={galaxy}
        />
      )}
    </div>
  );
}
