import { useState, useEffect, useMemo, type ReactNode } from 'react';
import type { LootDatabase, LootGroup } from '../../lib/types';

// --- Reusable CommandCard ---

function CommandCard({ title, command, children }: { title: string; command: string; children: ReactNode }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!command) return;
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="chat-card">
      <h3>{title}</h3>
      {children}
      {command ? (
        <>
          <div className="form-field">
            <label className="form-label">Generated Command</label>
            <code className="command-preview">{command}</code>
          </div>
          <button className={`btn ${copied ? 'btn-secondary' : 'btn-primary'}`} onClick={copy}>
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </>
      ) : (
        <div className="text-dim" style={{ marginTop: '0.5rem' }}>Fill in the fields above to generate a command.</div>
      )}
    </div>
  );
}

// --- Individual command cards ---

function CreditsCard() {
  const [name, setName] = useState('');
  const [action, setAction] = useState<'add' | 'subtract'>('add');
  const [amount, setAmount] = useState('');
  const [dest, setDest] = useState<'bank' | 'cash'>('bank');
  const cmd = name && amount ? `/credits ${name} ${action} ${amount} ${dest}` : '';

  return (
    <CommandCard title="Credits" command={cmd}>
      <div className="form-field">
        <label className="form-label">Player Name</label>
        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Character first name" />
      </div>
      <div className="form-field">
        <label className="form-label">Action</label>
        <select className="form-input" value={action} onChange={(e) => setAction(e.target.value as 'add' | 'subtract')}>
          <option value="add">Add</option>
          <option value="subtract">Subtract</option>
        </select>
      </div>
      <div className="form-field">
        <label className="form-label">Amount</label>
        <input className="form-input" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Credit amount" />
      </div>
      <div className="form-field">
        <label className="form-label">Destination</label>
        <select className="form-input" value={dest} onChange={(e) => setDest(e.target.value as 'bank' | 'cash')}>
          <option value="bank">Bank</option>
          <option value="cash">Cash</option>
        </select>
      </div>
    </CommandCard>
  );
}

function CreateItemCard() {
  const [template, setTemplate] = useState('');
  const [quantity, setQuantity] = useState('1');
  const cmd = template ? `/object createitem ${template}${quantity && quantity !== '1' ? ` ${quantity}` : ''}` : '';

  return (
    <CommandCard title="Create Item" command={cmd}>
      <div className="form-field">
        <label className="form-label">Template Path</label>
        <input className="form-input" value={template} onChange={(e) => setTemplate(e.target.value)} placeholder="object/tangible/..." />
      </div>
      <div className="form-field">
        <label className="form-label">Quantity</label>
        <input className="form-input" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="1" />
      </div>
    </CommandCard>
  );
}

function GrantSkillCard() {
  const [skill, setSkill] = useState('');
  const [skills, setSkills] = useState<{ name: string; parent: string }[]>([]);
  const [skillSearch, setSkillSearch] = useState('');

  useEffect(() => {
    fetch('/db/skills')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setSkills(data))
      .catch(() => {});
  }, []);

  const filteredSkills = useMemo(() => {
    if (!skillSearch) return skills;
    const q = skillSearch.toLowerCase();
    return skills.filter((s) => s.name.toLowerCase().includes(q));
  }, [skills, skillSearch]);

  const cmd = skill ? `/grantSkill ${skill}` : '';

  return (
    <CommandCard title="Grant Skill" command={cmd}>
      <div className="form-field">
        <label className="form-label">Search Skills ({skills.length} loaded)</label>
        <input className="form-input" value={skillSearch} onChange={(e) => setSkillSearch(e.target.value)} placeholder="Filter skills..." />
      </div>
      <div className="form-field">
        <label className="form-label">Skill Box ({filteredSkills.length} results)</label>
        <select className="form-input" value={skill} onChange={(e) => setSkill(e.target.value)}>
          <option value="">Select a skill...</option>
          {filteredSkills.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
      </div>
      <div className="text-dim" style={{ fontSize: '12px' }}>Prerequisites are granted automatically. Target the player in-game.</div>
    </CommandCard>
  );
}

function GrantBadgeCard() {
  const [badgeId, setBadgeId] = useState('');
  const cmd = badgeId ? `/grantBadge ${badgeId}` : '';

  return (
    <CommandCard title="Grant Badge" command={cmd}>
      <div className="form-field">
        <label className="form-label">Badge ID</label>
        <input className="form-input" type="number" min={0} value={badgeId} onChange={(e) => setBadgeId(e.target.value)} placeholder="Badge number" />
      </div>
      <div className="text-dim" style={{ fontSize: '12px' }}>Target the player in-game.</div>
    </CommandCard>
  );
}

function CreateResourceCard() {
  const [resource, setResource] = useState('');
  const [amount, setAmount] = useState('100000');
  const cmd = resource ? `/gmCreateSpecificResource ${resource} ${amount || '100000'}` : '';

  return (
    <CommandCard title="Create Resource" command={cmd}>
      <div className="form-field">
        <label className="form-label">Resource Name</label>
        <input className="form-input" value={resource} onChange={(e) => setResource(e.target.value)} placeholder="Exact resource name" />
      </div>
      <div className="form-field">
        <label className="form-label">Amount</label>
        <input className="form-input" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100000" />
      </div>
    </CommandCard>
  );
}

function TeleportToCard() {
  const [name, setName] = useState('');
  const cmd = name ? `/teleportTo ${name}` : '';

  return (
    <CommandCard title="Teleport To Player" command={cmd}>
      <div className="form-field">
        <label className="form-label">Player Name</label>
        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Character first name" />
      </div>
    </CommandCard>
  );
}

function FindPlayerCard() {
  const [name, setName] = useState('');
  const cmd = name ? `/findPlayer ${name}` : '';

  return (
    <CommandCard title="Find Player" command={cmd}>
      <div className="form-field">
        <label className="form-label">Player Name</label>
        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Character first name" />
      </div>
    </CommandCard>
  );
}

function GmReviveCard() {
  const [pct, setPct] = useState('100');
  const cmd = `/gmRevive ${pct || '100'}`;

  return (
    <CommandCard title="GM Revive" command={cmd}>
      <div className="form-field">
        <label className="form-label">Health %</label>
        <input className="form-input" type="number" min={1} max={100} value={pct} onChange={(e) => setPct(e.target.value)} placeholder="100" />
      </div>
      <div className="text-dim" style={{ fontSize: '12px' }}>Target the player in-game.</div>
    </CommandCard>
  );
}

function KickCard() {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [reason, setReason] = useState('');
  const cmd = name && duration && reason ? `/kick ${name} ${duration} ${reason}` : '';

  return (
    <CommandCard title="Kick Player" command={cmd}>
      <div className="form-field">
        <label className="form-label">Player Name</label>
        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Character first name" />
      </div>
      <div className="form-field">
        <label className="form-label">Ban Duration (minutes, -1 = permanent)</label>
        <input className="form-input" type="number" min={-1} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Minutes" />
      </div>
      <div className="form-field">
        <label className="form-label">Reason</label>
        <input className="form-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ban reason" />
      </div>
    </CommandCard>
  );
}

function FreezeCard() {
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [freeze, setFreeze] = useState(true);
  const cmd = freeze
    ? (name && reason ? `/freezePlayer ${name} ${reason}` : '')
    : (name ? `/unfreezePlayer ${name}` : '');

  return (
    <CommandCard title="Freeze / Unfreeze" command={cmd}>
      <div className="form-field">
        <label className="form-label">Action</label>
        <select className="form-input" value={freeze ? 'freeze' : 'unfreeze'} onChange={(e) => setFreeze(e.target.value === 'freeze')}>
          <option value="freeze">Freeze</option>
          <option value="unfreeze">Unfreeze</option>
        </select>
      </div>
      <div className="form-field">
        <label className="form-label">Player Name</label>
        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Character first name" />
      </div>
      {freeze && (
        <div className="form-field">
          <label className="form-label">Reason</label>
          <input className="form-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Freeze reason" />
        </div>
      )}
    </CommandCard>
  );
}

// --- Main page ---

interface AdminCommandsPageProps {
  token: string;
}

export function AdminCommandsPage({ token: _token }: AdminCommandsPageProps) {
  const [lootDb, setLootDb] = useState<LootDatabase | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [level, setLevel] = useState(100);
  const [lootCopied, setLootCopied] = useState(false);

  useEffect(() => {
    fetch('/db/loot')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load loot database (${res.status})`);
        return res.json();
      })
      .then((data) => setLootDb(data))
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load'));
  }, []);

  const categories = useMemo(() => {
    if (!lootDb) return [];
    const cats = new Set<string>();
    for (const group of Object.values(lootDb)) {
      if (group.category) cats.add(group.category);
    }
    return Array.from(cats).sort();
  }, [lootDb]);

  const filteredGroups = useMemo(() => {
    if (!lootDb) return [];
    return Object.values(lootDb)
      .filter((g) => {
        if (category && g.category !== category) return false;
        if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [lootDb, category, search]);

  const group: LootGroup | null = lootDb && selectedGroup ? lootDb[selectedGroup] : null;

  const totalWeight = useMemo(() => {
    if (!group) return 0;
    return group.items.reduce((sum, item) => sum + item.weight, 0);
  }, [group]);

  const lootCommand = selectedGroup ? `/object createloot ${selectedGroup} ${level}` : '';

  const copyLoot = () => {
    if (!lootCommand) return;
    navigator.clipboard.writeText(lootCommand).then(() => {
      setLootCopied(true);
      setTimeout(() => setLootCopied(false), 2000);
    });
  };

  return (
    <div className="page">
      <h2>Admin Commands</h2>
      <div className="info-banner">
        Generate admin commands to paste in-game. All commands require GM privileges.
      </div>

      {/* --- Loot Browser --- */}
      <div className="subsection">
        <h3>Loot Browser</h3>
        {loadError ? (
          <div className="warning-banner">
            Failed to load loot database: {loadError}<br />
            Make sure loot_database.json exists in the Loot Generator directory.
          </div>
        ) : !lootDb ? (
          <div className="result-loading">Loading loot database...</div>
        ) : (
          <div className="chat-grid">
            <div className="chat-card">
              <div className="form-field">
                <label className="form-label">Category</label>
                <select className="form-input" value={category} onChange={(e) => { setCategory(e.target.value); setSelectedGroup(''); }}>
                  <option value="">All Categories ({Object.keys(lootDb).length} groups)</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Search</label>
                <input className="form-input" value={search} onChange={(e) => { setSearch(e.target.value); setSelectedGroup(''); }} placeholder="Filter by group name..." />
              </div>
              <div className="form-field">
                <label className="form-label">Loot Group ({filteredGroups.length} results)</label>
                <select className="form-input" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                  <option value="">Select a loot group...</option>
                  {filteredGroups.map((g) => <option key={g.name} value={g.name}>{g.name}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Level / Quality (1-500)</label>
                <input className="form-input" type="number" min={1} max={500} value={level} onChange={(e) => setLevel(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))} />
              </div>

              {group && (
                <div style={{ marginTop: '1rem' }}>
                  <h4>{group.name}</h4>
                  <div className="loot-meta">
                    <span className="loot-badge">{group.category}</span>
                    <span className="text-dim">Level: {group.minimumLevel}{group.maximumLevel === -1 ? '+' : `–${group.maximumLevel}`}</span>
                    <span className="text-dim">{group.items.length} items</span>
                  </div>
                  {group.description && <div className="info-banner" style={{ marginTop: '0.5rem' }}>{group.description}</div>}
                  <table className="data-table" style={{ marginTop: '0.75rem' }}>
                    <thead><tr><th>Template</th><th style={{ width: '80px', textAlign: 'right' }}>Drop %</th></tr></thead>
                    <tbody>
                      {group.items.slice().sort((a, b) => b.weight - a.weight).map((item, i) => {
                        const pct = totalWeight > 0 ? (item.weight / totalWeight) * 100 : 0;
                        return <tr key={i}><td className="text-mono">{item.template}</td><td style={{ textAlign: 'right' }}>{pct.toFixed(1)}%</td></tr>;
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="chat-card">
              <h3>Loot Command</h3>
              {lootCommand ? (
                <>
                  <div className="form-field">
                    <label className="form-label">Generated Command</label>
                    <code className="command-preview">{lootCommand}</code>
                  </div>
                  <button className={`btn ${lootCopied ? 'btn-secondary' : 'btn-primary'}`} onClick={copyLoot}>
                    {lootCopied ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                </>
              ) : (
                <div className="text-dim">Select a loot group to generate a command.</div>
              )}
              <div className="text-dim" style={{ fontSize: '12px', marginTop: '1rem' }}>
                Creates a random item from the loot group in your inventory.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- Command Generator Cards --- */}
      <div className="subsection">
        <h3>Command Generators</h3>
        <div className="chat-grid">
          <CreditsCard />
          <CreateItemCard />
          <GrantSkillCard />
          <GrantBadgeCard />
          <CreateResourceCard />
          <TeleportToCard />
          <FindPlayerCard />
          <GmReviveCard />
          <KickCard />
          <FreezeCard />
        </div>
      </div>
    </div>
  );
}
