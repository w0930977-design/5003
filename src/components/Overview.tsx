import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CircleCheck,
  Flag,
  Heart,
  Leaf,
  Mail,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { useI18n, type TranslationKey } from '../i18n';
import { closedStatuses, interviewStatuses, type Application } from '../types';
import { EnvelopeArt } from './UI';

export function OverviewHero({
  applications,
}: {
  applications: Application[];
}) {
  const { t } = useI18n();
  return (
    <>
      <section className="hero-banner">
        <div className="hero-text">
          <span className="hero-hello">
            <span />
            {t('hello')}
          </span>
          <h2>{t('heroTitle')}</h2>
          <p>{t('heroSub')}</p>
          <span className="hero-note">
            <Leaf size={14} />
            {t('heroNote')}
          </span>
        </div>
        <EnvelopeArt />
        <span className="hero-corner">little steps, lovely things</span>
      </section>
      {applications.length > 0 && (
        <div className="stats-grid">
          {[
            {
              key: 'total',
              value: applications.length,
              icon: BriefcaseBusiness,
              color: 'orange',
            },
            {
              key: 'active',
              value: applications.filter(
                (a) =>
                  a.status === 'applied' ||
                  interviewStatuses.includes(a.status),
              ).length,
              icon: Target,
              color: 'blue',
            },
            {
              key: 'interviewing',
              value: applications.filter((a) =>
                interviewStatuses.includes(a.status),
              ).length,
              icon: MessageSquareText,
              color: 'purple',
            },
            {
              key: 'offers',
              value: applications.filter((a) => a.status === 'offer').length,
              icon: Flag,
              color: 'green',
            },
          ].map((stat) => (
            <div className="stat-card" key={stat.key}>
              <span className={`stat-icon ${stat.color}`}>
                <stat.icon size={19} />
              </span>
              <div>
                <span>{t(stat.key as TranslationKey)}</span>
                <strong>{stat.value.toString().padStart(2, '0')}</strong>
              </div>
              <span className="stat-decoration" />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function JourneySteps() {
  const { t } = useI18n();
  return (
    <div className="journey-steps">
      {[
        { icon: Mail, title: 'step1', sub: 'step1Sub' },
        { icon: BookOpen, title: 'step2', sub: 'step2Sub' },
        { icon: Sparkles, title: 'step3', sub: 'step3Sub' },
      ].map((step, index) => (
        <div key={step.title}>
          <span className={`journey-step-icon step-${index}`}>
            <step.icon size={19} />
          </span>
          <div>
            <h3>{t(step.title as TranslationKey)}</h3>
            <p>{t(step.sub as TranslationKey)}</p>
          </div>
          <span className="step-number" aria-hidden="true">
            0{index + 1}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RightRail({
  applications,
  onOpen,
  onExport,
}: {
  applications: Application[];
  onOpen: (id: string) => void;
  onExport: () => void;
}) {
  const { t, date } = useI18n();
  const upcoming = applications
    .filter(
      (a) =>
        a.nextAction &&
        !closedStatuses.includes(a.status) &&
        a.status !== 'offer',
    )
    .sort((a, b) => (a.nextDate || '9999').localeCompare(b.nextDate || '9999'));
  return (
    <aside className="right-rail">
      <section className="encouragement-card">
        <span className="note-pin" />
        <span className="eyebrow">{t('littleNote')}</span>
        <span className="note-quote">“</span>
        <h3>{t('noteTitle')}</h3>
        <p>{t('noteBody')}</p>
        <div className="note-bottom">
          <span>{t('noteFooter')}</span>
          <Heart size={17} />
        </div>
      </section>
      <section className="upcoming-card">
        <div className="rail-heading">
          <span>
            <CalendarDays size={16} />
            {t('nextSteps')}
          </span>
          <span className="count-badge">{upcoming.length}</span>
        </div>
        {upcoming.length ? (
          <div className="upcoming-list">
            {upcoming.slice(0, 3).map((a) => (
              <button key={a.id} onClick={() => onOpen(a.id)}>
                <span className="task-dot" />
                <span>
                  <strong>{a.nextAction}</strong>
                  <small>
                    {a.company} ·{' '}
                    {a.nextDate ? date(a.nextDate) : t('dateNone')}
                  </small>
                </span>
                <ArrowUpRight size={14} />
              </button>
            ))}
          </div>
        ) : (
          <div className="no-upcoming">
            <CircleCheck size={25} />
            <p>{t('noNext')}</p>
          </div>
        )}
      </section>
      <section className="privacy-card">
        <ShieldCheck size={21} />
        <h3>{t('privacyTitle')}</h3>
        <p>{t('privacyBody')}</p>
        <button className="text-button" onClick={onExport}>
          {t('backup')}
          <ArrowUpRight size={14} />
        </button>
      </section>
    </aside>
  );
}
