import {
  ArrowDownWideNarrow,
  ArrowUpRight,
  CalendarDays,
  Check,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useI18n, type TranslationKey } from '../i18n';
import { stageGroups, statuses, type Application, type Status } from '../types';
import { EnvelopeArt, Stars, StatusBadge } from './UI';

export interface Filters {
  search: string;
  status: string;
  priority: string;
  location: string;
}
export const emptyFilters: Filters = {
  search: '',
  status: '',
  priority: '',
  location: '',
};
export function filterApplications(apps: Application[], filters: Filters) {
  return apps.filter(
    (a) =>
      (!filters.search ||
        `${a.company} ${a.role}`
          .toLocaleLowerCase()
          .includes(filters.search.trim().toLocaleLowerCase())) &&
      (!filters.status || a.status === filters.status) &&
      (!filters.location || a.location === filters.location) &&
      (!filters.priority ||
        (filters.priority === 'high'
          ? a.priority >= 4
          : filters.priority === 'medium'
            ? a.priority === 3
            : a.priority <= 2)),
  );
}

export function ApplicationCard({
  application: a,
  onOpen,
  onStatus,
}: {
  application: Application;
  onOpen: (id: string) => void;
  onStatus: (id: string, status: Status) => void;
}) {
  const { t, date, statusLabel } = useI18n();
  return (
    <article className="application-card">
      <div className="card-company-row">
        <span
          className={`company-avatar avatar-${a.company.charCodeAt(0) % 4}`}
        >
          {a.company.slice(0, 1).toUpperCase()}
        </span>
        <button
          className="card-open"
          onClick={() => onOpen(a.id)}
          aria-label={`${t('details')} · ${a.company}`}
        >
          <h3>{a.company}</h3>
          <span>{a.role}</span>
        </button>
        <button
          className="icon-button card-arrow"
          onClick={() => onOpen(a.id)}
          aria-label={`${t('details')} · ${a.role}`}
        >
          <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="card-location">
        <MapPin size={13} />
        {a.location}
      </div>
      <div className="card-stars">
        <Stars value={a.priority} small />
        <span>{date(a.appliedAt)}</span>
      </div>
      <div className="card-bottom">
        <StatusBadge status={a.status} />
        <select
          aria-label={`${t('status')} · ${a.company}`}
          value={a.status}
          onChange={(e) => onStatus(a.id, e.target.value as Status)}
        >
          {statuses.map((s) => (
            <option value={s} key={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
      </div>
      {a.nextAction && (
        <button className="card-next" onClick={() => onOpen(a.id)}>
          <CalendarDays size={13} />
          <span>{a.nextAction}</span>
        </button>
      )}
    </article>
  );
}

export function EmptyJourney({ onAdd }: { onAdd: () => void }) {
  const { t } = useI18n();
  return (
    <div className="empty-journey">
      <div className="empty-art-wrap">
        <EnvelopeArt small />
      </div>
      <span className="eyebrow">A NEW CHAPTER</span>
      <h2>{t('emptyTitle')}</h2>
      <p>{t('emptySub')}</p>
      <button className="button button-primary" onClick={onAdd}>
        <Plus size={17} />
        {t('firstApplication')}
      </button>
      <span className="empty-foot">
        <Check size={13} />
        {t('emptyFoot')}
      </span>
    </div>
  );
}

export default function ApplicationBoard({
  applications,
  source,
  filters,
  setFilters,
  view,
  setView,
  onAdd,
  onOpen,
  onStatus,
}: {
  applications: Application[];
  source: Application[];
  filters: Filters;
  setFilters: (f: Filters) => void;
  view: 'board' | 'list';
  setView: (v: 'board' | 'list') => void;
  onAdd: (status?: Status) => void;
  onOpen: (id: string) => void;
  onStatus: (id: string, s: Status) => void;
}) {
  const { t, date } = useI18n();
  const activeFilters = Object.values(filters).some(Boolean);
  const filtered = filterApplications(applications, filters);
  const { statusLabel } = useI18n();
  return (
    <section className="applications-section" aria-label={t('boardTitle')}>
      <div className="section-heading">
        <div>
          <h2>
            {t('boardTitle')}
            <span className="count-badge">{applications.length}</span>
          </h2>
          <p>{t('boardSub')}</p>
        </div>
        <div className="view-switch" aria-label={t('boardTitle')}>
          <button
            aria-pressed={view === 'board'}
            onClick={() => setView('board')}
            title={t('board')}
          >
            <LayoutGrid size={15} />
            <span>{t('board')}</span>
          </button>
          <button
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
            title={t('list')}
          >
            <List size={16} />
            <span>{t('list')}</span>
          </button>
        </div>
      </div>
      <div className="filter-bar">
        <label className="search-box">
          <Search size={17} />
          <span className="sr-only">{t('searchLabel')}</span>
          <input
            aria-label={t('searchLabel')}
            placeholder={t('search')}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          {filters.search && (
            <button
              className="icon-button"
              aria-label={t('clearFilters')}
              onClick={() => setFilters({ ...filters, search: '' })}
            >
              <X size={14} />
            </button>
          )}
        </label>
        <div className="select-filter">
          <SlidersHorizontal size={14} />
          <select
            aria-label={t('statusFilter')}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">{t('anyStatus')}</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <select
          className="priority-filter"
          aria-label={t('priorityFilter')}
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
        >
          <option value="">{t('anyPriority')}</option>
          <option value="high">{t('highPriority')}</option>
          <option value="medium">{t('mediumPriority')}</option>
          <option value="low">{t('lowPriority')}</option>
        </select>
        <select
          className="location-filter"
          aria-label={t('locationFilter')}
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
        >
          <option value="">{t('anyLocation')}</option>
          {[...new Set(source.map((a) => a.location))].sort().map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </div>
      {activeFilters && (
        <div className="filter-results">
          <span>
            {filtered.length} {t('results')}
          </span>
          <button onClick={() => setFilters(emptyFilters)}>
            {t('clearFilters')}
            <X size={12} />
          </button>
        </div>
      )}
      {source.length === 0 ? (
        <EmptyJourney onAdd={onAdd} />
      ) : filtered.length === 0 ? (
        <div className="empty-results">
          <Search size={30} />
          <h3>{t('noResults')}</h3>
          <p>{t('noResultsSub')}</p>
          <button
            className="button button-secondary"
            onClick={() => setFilters(emptyFilters)}
          >
            {t('clearFilters')}
          </button>
        </div>
      ) : view === 'board' ? (
        <div className="kanban">
          {stageGroups.map((group) => {
            const apps = filtered.filter((a) =>
              (group.statuses as readonly string[]).includes(a.status),
            );
            return (
              <div
                className={`kanban-column column-${group.id}`}
                key={group.id}
              >
                <div className="column-heading">
                  <span className="column-dot" />
                  <h3>{t(`group_${group.id}` as TranslationKey)}</h3>
                  <span className="column-count">{apps.length}</span>
                  <button
                    className="icon-button"
                    onClick={() => onAdd(group.statuses[0])}
                    aria-label={`${t('addHere')} · ${t(`group_${group.id}` as TranslationKey)}`}
                  >
                    <Plus size={15} />
                  </button>
                </div>
                <div className="column-body">
                  {apps.map((a) => (
                    <ApplicationCard
                      key={a.id}
                      application={a}
                      onOpen={onOpen}
                      onStatus={onStatus}
                    />
                  ))}
                  {apps.length === 0 && (
                    <div className="column-empty">
                      <span className="empty-dash" />
                      {t('groupEmpty')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('tableCompany')}</th>
                <th>{t('location')}</th>
                <th>{t('priority')}</th>
                <th>{t('status')}</th>
                <th>
                  {t('appliedAt')}
                  <ArrowDownWideNarrow size={12} />
                </th>
                <th>
                  <span className="sr-only">{t('details')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    <button
                      className="table-company"
                      onClick={() => onOpen(a.id)}
                    >
                      <strong>{a.company}</strong>
                      <span>{a.role}</span>
                    </button>
                  </td>
                  <td>{a.location}</td>
                  <td>
                    <Stars value={a.priority} small />
                  </td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                  <td>{date(a.appliedAt)}</td>
                  <td>
                    <button
                      className="icon-button"
                      onClick={() => onOpen(a.id)}
                      aria-label={`${t('details')} · ${a.company}`}
                    >
                      <ArrowUpRight size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
