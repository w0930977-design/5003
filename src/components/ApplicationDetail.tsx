import {
  CalendarDays,
  ExternalLink,
  FilePenLine,
  MapPin,
  MessageSquareText,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useI18n, selfLabels, impressionLabels } from '../i18n';
import {
  statuses,
  type Application,
  type Interview,
  type Status,
} from '../types';
import { Modal, Stars, StatusBadge } from './UI';

export function InterviewEntry({
  interview: i,
  onEdit,
  onDelete,
}: {
  interview: Interview;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t, lang, date } = useI18n();
  const self = selfLabels[lang][i.performance as keyof typeof selfLabels.zh];
  return (
    <article className="interview-entry">
      <div className="interview-entry-heading">
        <span className="interview-icon">
          <MessageSquareText size={17} />
        </span>
        <div>
          <h4>{i.round}</h4>
          <span>{i.date ? date(i.date) : t('dateNone')}</span>
        </div>
        <div className="interview-entry-actions">
          <button
            className="icon-button"
            onClick={onEdit}
            aria-label={`${t('editInterview')} · ${i.round}`}
          >
            <Pencil size={15} />
          </button>
          <button
            className="icon-button danger-text"
            onClick={onDelete}
            aria-label={`${t('delete')} · ${i.round}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {i.questions && (
        <div className="review-text">
          <h5>{t('questions')}</h5>
          <p>{i.questions}</p>
        </div>
      )}
      <div className="review-tags">
        {self && <span>{self}</span>}
        {i.impressions.map((key) => (
          <span className="blue" key={key}>
            {impressionLabels[lang][key as keyof typeof impressionLabels.zh] ??
              key}
          </span>
        ))}
      </div>
      {i.selfNote && (
        <div className="review-text">
          <h5>{t('selfNote')}</h5>
          <p>{i.selfNote}</p>
        </div>
      )}
      {i.interviewerNote && (
        <div className="review-text">
          <h5>{t('impressionNote')}</h5>
          <p>{i.interviewerNote}</p>
        </div>
      )}
      {i.reflection && (
        <div className="review-text reflection-text">
          <h5>{t('reflection')}</h5>
          <p>{i.reflection}</p>
        </div>
      )}
    </article>
  );
}

export default function ApplicationDetail({
  application: a,
  onClose,
  onEdit,
  onDelete,
  onStatus,
  onPriority,
  onInterview,
  onDeleteInterview,
}: {
  application: Application;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatus: (status: Status) => void;
  onPriority: (n: number) => void;
  onInterview: (interview?: Interview) => void;
  onDeleteInterview: (i: Interview) => void;
}) {
  const { t, date, statusLabel } = useI18n();
  return (
    <Modal
      title={t('detailTitle')}
      onClose={onClose}
      wide
      className="detail-modal"
    >
      <div className="detail-content">
        <div className="detail-company">
          <span
            className={`company-avatar avatar-${a.company.charCodeAt(0) % 4}`}
          >
            {a.company.slice(0, 1)}
          </span>
          <div>
            <h2>{a.company}</h2>
            <p>{a.role}</p>
          </div>
          <button
            className="button button-secondary button-small"
            onClick={onEdit}
          >
            <Pencil size={14} />
            {t('edit')}
          </button>
        </div>
        <div className="detail-meta">
          <span>
            <MapPin size={14} />
            {a.location}
          </span>
          <span>
            <CalendarDays size={14} />
            {t('appliedDate')} {date(a.appliedAt)}
          </span>
        </div>
        <div className="detail-controls">
          <div>
            <label htmlFor="detail-status">{t('status')}</label>
            <select
              id="detail-status"
              value={a.status}
              onChange={(e) => onStatus(e.target.value as Status)}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="label">{t('priority')}</span>
            <Stars value={a.priority} onChange={onPriority} />
          </div>
        </div>
        <div className="detail-extra">
          {a.salary && (
            <div>
              <span>{t('salary')}</span>
              <strong>{a.salary}</strong>
            </div>
          )}
          {a.url && (
            <div>
              <span>{t('url')}</span>
              <a
                href={/^https?:\/\//i.test(a.url) ? a.url : undefined}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('linkVisit')}
                <ExternalLink size={13} />
              </a>
            </div>
          )}
          {a.nextAction && (
            <div className="detail-next">
              <span>{t('nextAction')}</span>
              <strong>{a.nextAction}</strong>
              {a.nextDate && <small>{date(a.nextDate)}</small>}
            </div>
          )}
        </div>
        <section className="detail-interviews">
          <div className="section-heading">
            <div>
              <h3>
                {t('interviewTitle')}
                <span className="count-badge">{a.interviews.length}</span>
              </h3>
              <p>{t('interviewSub')}</p>
            </div>
            <button
              className="button button-secondary button-small"
              onClick={() => onInterview()}
            >
              <Plus size={15} />
              {t('addInterview')}
            </button>
          </div>
          {a.interviews.length ? (
            a.interviews.map((i) => (
              <InterviewEntry
                key={i.id}
                interview={i}
                onEdit={() => onInterview(i)}
                onDelete={() => onDeleteInterview(i)}
              />
            ))
          ) : (
            <div className="interview-empty">
              <FilePenLine size={30} />
              <h4>{t('emptyInterviews')}</h4>
              <p>{t('emptyInterviewsSub')}</p>
              <button className="text-button" onClick={() => onInterview()}>
                <Plus size={14} />
                {t('addInterview')}
              </button>
            </div>
          )}
        </section>
        <footer className="detail-footer">
          <span>
            {t('updated')} {date(a.updatedAt)}
          </span>
          <button className="text-button danger-text" onClick={onDelete}>
            <Trash2 size={14} />
            {t('delete')}
          </button>
        </footer>
      </div>
    </Modal>
  );
}

export function ReviewSummary({
  application,
  interview,
  onOpen,
}: {
  application: Application;
  interview: Interview;
  onOpen: () => void;
}) {
  const { t, date } = useI18n();
  return (
    <button className="review-summary" onClick={onOpen}>
      <div className="review-summary-top">
        <span className="review-summary-icon">
          <FilePenLine size={19} />
        </span>
        <span>{interview.date ? date(interview.date) : t('dateNone')}</span>
      </div>
      <h3>{application.company}</h3>
      <p className="review-role">
        {application.role} · {interview.round}
      </p>
      <p className="review-excerpt">
        {interview.reflection || interview.questions || t('noReflection')}
      </p>
      <div className="review-summary-bottom">
        <StatusBadge status={application.status} />
        <span>
          {t('details')}
          <ExternalLink size={13} />
        </span>
      </div>
    </button>
  );
}
