import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCheck,
  Heart,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import {
  dictionaries,
  getFeedback,
  LocaleContext,
  useI18n,
  type TranslationKey,
} from './i18n';
import { downloadBackup, useStore } from './storage';
import {
  type Application,
  type ApplicationInput,
  type Interview,
  type InterviewInput,
  type Page,
  type Status,
  type Store,
} from './types';
import ApplicationBoard, {
  emptyFilters,
  type Filters,
} from './components/ApplicationBoard';
import ApplicationForm from './components/ApplicationForm';
import ApplicationDetail, {
  ReviewSummary,
} from './components/ApplicationDetail';
import InterviewForm from './components/InterviewForm';
import Settings from './components/Settings';
import { Confirm, NotificationCenter } from './components/UI';

import { Sidebar, Topbar, PageHeading, PageFooter } from './components/Layout';
import { OverviewHero, JourneySteps, RightRail } from './components/Overview';

type FormState =
  | { type: 'application'; initial?: Application; defaultStatus?: Status }
  | { type: 'interview'; applicationId: string; initial?: Interview }
  | null;
type Confirmation =
  | { type: 'application'; id: string }
  | { type: 'interview'; applicationId: string; id: string }
  | { type: 'all' }
  | null;
type Feedback = { status: Status | 'added'; id: number } | null;
const makeId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `record-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function App() {
  const { store, blocked, commit } = useStore();
  return (
    <LocaleContext.Provider value={store.settings.language}>
      <Workspace store={store} blocked={blocked} commit={commit} />
    </LocaleContext.Provider>
  );
}

function Workspace({
  store,
  blocked,
  commit,
}: {
  store: Store;
  blocked: boolean;
  commit: (next: Store, allowReset?: boolean) => boolean;
}) {
  const { t, lang } = useI18n();
  const [page, setPage] = useState<Page>('home');
  const [mobileNav, setMobileNav] = useState(false);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [form, setForm] = useState<FormState>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [notification, setNotification] = useState<{
    key: TranslationKey;
    error: boolean;
  } | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const applications = store.applications;
  const selected = applications.find((a) => a.id === selectedId);
  useEffect(() => () => clearTimeout(timeout.current), []);
  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = `${dictionaries[lang].brand} · Offer Diary`;
  }, [lang]);

  function notify(key: TranslationKey, error = false) {
    clearTimeout(timeout.current);
    setNotification({ key, error });
    if (!error) timeout.current = setTimeout(() => setNotification(null), 4200);
  }
  function persist(next: Store, key?: TranslationKey, reset = false) {
    if (!commit(next, reset)) {
      notify(blocked ? 'loadError' : 'storageError', true);
      return false;
    }
    if (key) notify(key);
    return true;
  }
  function respond(status: Status | 'added') {
    if (store.settings.tone === 'off') {
      setFeedback(null);
      return;
    }
    // A state transition gets one response, rather than two competing notices.
    clearTimeout(timeout.current);
    setNotification(null);
    setFeedback({ status, id: Date.now() });
  }
  function saveApplication(data: ApplicationInput) {
    if (!form || form.type !== 'application') return;
    const now = new Date().toISOString();
    const previous =
      form.initial && applications.find((a) => a.id === form.initial!.id);
    const app: Application = previous
      ? { ...previous, ...data, updatedAt: now }
      : {
          ...data,
          id: makeId(),
          interviews: [],
          createdAt: now,
          updatedAt: now,
        };
    const nextApps = previous
      ? applications.map((a) => (a.id === app.id ? app : a))
      : [app, ...applications];
    if (
      !persist(
        { ...store, applications: nextApps },
        previous ? 'saved' : 'added',
      )
    )
      return;
    setForm(null);
    if (!previous) respond(app.status === 'offer' ? 'offer' : 'added');
    else if (previous.status !== app.status) respond(app.status);
    else setFeedback(null);
  }
  function updateStatus(id: string, status: Status) {
    const original = applications.find((a) => a.id === id);
    if (!original || original.status === status) return;
    const nextApps = applications.map((a) =>
      a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a,
    );
    if (persist({ ...store, applications: nextApps }, 'statusChanged'))
      respond(status);
  }
  function updatePriority(id: string, priority: number) {
    if (
      persist(
        {
          ...store,
          applications: applications.map((a) =>
            a.id === id
              ? { ...a, priority, updatedAt: new Date().toISOString() }
              : a,
          ),
        },
        'saved',
      )
    )
      setFeedback(null);
  }
  function saveInterview(data: InterviewInput) {
    if (!form || form.type !== 'interview') return;
    const app = applications.find((a) => a.id === form.applicationId);
    if (!app) return;
    const now = new Date().toISOString();
    const interview: Interview = form.initial
      ? { ...form.initial, ...data, updatedAt: now }
      : {
          ...data,
          id: makeId(),
          applicationId: app.id,
          createdAt: now,
          updatedAt: now,
        };
    const interviews = form.initial
      ? app.interviews.map((i) => (i.id === interview.id ? interview : i))
      : [...app.interviews, interview];
    if (
      persist(
        {
          ...store,
          applications: applications.map((a) =>
            a.id === app.id ? { ...a, interviews, updatedAt: now } : a,
          ),
        },
        'interviewSaved',
      )
    ) {
      setForm(null);
      setFeedback(null);
    }
  }
  function confirmDelete() {
    if (!confirmation) return;
    let next: Store;
    if (confirmation.type === 'all') next = { ...store, applications: [] };
    else if (confirmation.type === 'application')
      next = {
        ...store,
        applications: applications.filter((a) => a.id !== confirmation.id),
      };
    else
      next = {
        ...store,
        applications: applications.map((a) =>
          a.id === confirmation.applicationId
            ? {
                ...a,
                interviews: a.interviews.filter(
                  (i) => i.id !== confirmation.id,
                ),
                updatedAt: new Date().toISOString(),
              }
            : a,
        ),
      };
    if (
      persist(
        next,
        confirmation.type === 'all'
          ? 'cleared'
          : confirmation.type === 'application'
            ? 'removed'
            : 'interviewDeleted',
        confirmation.type === 'all',
      )
    ) {
      if (confirmation.type !== 'interview') {
        setSelectedId(null);
        setForm(null);
      }
      setConfirmation(null);
      setFeedback(null);
    }
  }
  function updateSettings(settings: Store['settings']) {
    if (persist({ ...store, settings }, 'settingsSaved')) setFeedback(null);
  }
  function exportData() {
    try {
      downloadBackup(store, blocked);
      notify('backupDone');
    } catch {
      notify('exportError', true);
    }
  }
  function navigate(next: Page) {
    setPage(next);
    setMobileNav(false);
    setFilters(emptyFilters);
  }
  const reviews = applications
    .flatMap((a) => a.interviews.map((i) => ({ application: a, interview: i })))
    .sort((a, b) => b.interview.updatedAt.localeCompare(a.interview.updatedAt));
  const favorites = applications.filter((a) => a.priority >= 4);
  const addApplication = () => setForm({ type: 'application' });

  return (
    <div className="app-shell">
      <Sidebar
        mobileNav={mobileNav}
        setMobileNav={setMobileNav}
        page={page}
        navigate={navigate}
        applications={applications}
        exportData={exportData}
      />
      <div className="main-shell">
        <Topbar
          page={page}
          setMobileNav={setMobileNav}
          settings={store.settings}
          updateSettings={updateSettings}
        />
        <main id="main-content">
          {blocked && (
            <div className="storage-warning" role="alert">
              <ShieldCheck size={20} />
              <p>{t('loadError')}</p>
              <button
                className="button button-secondary button-small"
                onClick={exportData}
              >
                {t('backup')}
              </button>
            </div>
          )}
          <PageHeading page={page} addApplication={addApplication} />
          {page === 'home' && <OverviewHero applications={applications} />}

          {(page === 'home' ||
            page === 'applications' ||
            page === 'favorites') && (
            <>
              {page === 'favorites' && favorites.length === 0 ? (
                <div className="standalone-empty">
                  <span className="standalone-icon">
                    <Heart size={32} />
                  </span>
                  <h2>{t('favoriteEmpty')}</h2>
                  <p>{t('favoriteEmptySub')}</p>
                  <button
                    className="button button-secondary"
                    onClick={() => navigate('applications')}
                  >
                    {t('viewApplications')}
                    <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className={page === 'home' ? 'dashboard-columns' : ''}>
                  <div className="board-main">
                    <ApplicationBoard
                      applications={
                        page === 'favorites' ? favorites : applications
                      }
                      source={applications}
                      filters={filters}
                      setFilters={setFilters}
                      view={view}
                      setView={setView}
                      onAdd={(status) =>
                        setForm({ type: 'application', defaultStatus: status })
                      }
                      onOpen={setSelectedId}
                      onStatus={updateStatus}
                    />
                    {page === 'home' && applications.length === 0 && (
                      <JourneySteps />
                    )}
                  </div>
                  {page === 'home' && (
                    <RightRail
                      applications={applications}
                      onOpen={setSelectedId}
                      onExport={exportData}
                    />
                  )}
                </div>
              )}
            </>
          )}
          {page === 'reviews' && (
            <>
              {reviews.length ? (
                <>
                  <div className="subpage-intro">
                    <span className="eyebrow">
                      LITTLE MOMENTS, BIG LEARNINGS
                    </span>
                    <h2>{t('reviewsTitle')}</h2>
                    <span className="count-badge">{reviews.length}</span>
                  </div>
                  <div className="reviews-grid">
                    {reviews.map(({ application, interview }) => (
                      <ReviewSummary
                        key={interview.id}
                        application={application}
                        interview={interview}
                        onOpen={() => setSelectedId(application.id)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="standalone-empty">
                  <span className="standalone-icon blue">
                    <BookOpen size={32} />
                  </span>
                  <h2>{t('reviewsEmpty')}</h2>
                  <p>{t('reviewsEmptySub')}</p>
                  <button
                    className="button button-secondary"
                    onClick={() => navigate('applications')}
                  >
                    {t('viewApplications')}
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
          {page === 'settings' && (
            <Settings
              settings={store.settings}
              onChange={updateSettings}
              onExport={exportData}
              onClear={() => setConfirmation({ type: 'all' })}
            />
          )}
          <PageFooter />
        </main>
      </div>
      {selected && (
        <ApplicationDetail
          application={selected}
          onClose={() => setSelectedId(null)}
          onEdit={() => setForm({ type: 'application', initial: selected })}
          onDelete={() =>
            setConfirmation({ type: 'application', id: selected.id })
          }
          onStatus={(status) => updateStatus(selected.id, status)}
          onPriority={(n) => updatePriority(selected.id, n)}
          onInterview={(initial) =>
            setForm({ type: 'interview', applicationId: selected.id, initial })
          }
          onDeleteInterview={(i) =>
            setConfirmation({
              type: 'interview',
              applicationId: selected.id,
              id: i.id,
            })
          }
        />
      )}
      {form?.type === 'application' && (
        <ApplicationForm
          key={form.initial?.id ?? 'new'}
          initial={form.initial}
          defaultStatus={form.defaultStatus}
          onSave={saveApplication}
          onClose={() => setForm(null)}
        />
      )}
      {form?.type === 'interview' && (
        <InterviewForm
          key={form.initial?.id ?? 'new-interview'}
          company={
            applications.find((a) => a.id === form.applicationId)?.company ?? ''
          }
          initial={form.initial}
          onSave={saveInterview}
          onClose={() => setForm(null)}
        />
      )}
      {confirmation && (
        <Confirm
          title={t(
            confirmation.type === 'all'
              ? 'clearTitle'
              : confirmation.type === 'interview'
                ? 'deleteInterviewTitle'
                : 'deleteTitle',
          )}
          body={t(
            confirmation.type === 'all'
              ? 'clearBody'
              : confirmation.type === 'interview'
                ? 'deleteInterviewBody'
                : 'deleteBody',
          )}
          confirm={t(
            confirmation.type === 'all'
              ? 'clearConfirm'
              : confirmation.type === 'interview'
                ? 'delete'
                : 'confirmDelete',
          )}
          onConfirm={confirmDelete}
          onClose={() => setConfirmation(null)}
        />
      )}
      <NotificationCenter>
        {feedback && store.settings.tone !== 'off' && (
          <div
            className={`feedback-card ${feedback.status === 'offer' ? 'offer-feedback' : ''}`}
            key={feedback.id}
            data-testid="emotional-feedback"
          >
            <button
              className="icon-button"
              onClick={() => setFeedback(null)}
              aria-label={t('close')}
            >
              <X size={16} />
            </button>
            <span className="feedback-icon">
              {feedback.status === 'offer' ? (
                <Sparkles size={23} />
              ) : (
                <Heart size={22} />
              )}
            </span>
            <div>
              <h3>
                {t(
                  feedback.status === 'offer' ? 'offerTitle' : 'encouragement',
                )}
              </h3>
              <p>{getFeedback(lang, store.settings.tone, feedback.status)}</p>
            </div>
          </div>
        )}
        {notification && (
          <div
            className={`toast ${notification.error ? 'error-toast' : ''}`}
            role={notification.error ? 'alert' : 'status'}
          >
            <CheckCheck size={18} />
            <span>{t(notification.key)}</span>
            <button
              className="icon-button"
              onClick={() => setNotification(null)}
              aria-label={t('dismiss')}
            >
              <X size={15} />
            </button>
          </div>
        )}
      </NotificationCenter>
    </div>
  );
}
