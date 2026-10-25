import { useState, type FormEvent } from 'react';
import { ArrowRight, Info } from 'lucide-react';
import { useI18n, type TranslationKey } from '../i18n';
import {
  statuses,
  today,
  type Application,
  type ApplicationInput,
  type Status,
} from '../types';
import { Modal, Stars } from './UI';

export function validDate(date: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(date)) &&
    new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date
  );
}

export default function ApplicationForm({
  initial,
  defaultStatus = 'applied',
  onSave,
  onClose,
}: {
  initial?: Application;
  defaultStatus?: Status;
  onSave: (data: ApplicationInput) => void;
  onClose: () => void;
}) {
  const { t, statusLabel } = useI18n();
  const [form, setForm] = useState<ApplicationInput>({
    company: initial?.company ?? '',
    role: initial?.role ?? '',
    location: initial?.location ?? '',
    priority: initial?.priority ?? 3,
    appliedAt: initial?.appliedAt ?? today(),
    status: initial?.status ?? defaultStatus,
    url: initial?.url ?? '',
    salary: initial?.salary ?? '',
    nextAction: initial?.nextAction ?? '',
    nextDate: initial?.nextDate ?? '',
  });
  const [error, setError] = useState<TranslationKey | null>(null);
  function set<K extends keyof ApplicationInput>(
    key: K,
    value: ApplicationInput[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    const cleaned = {
      ...form,
      company: form.company.trim(),
      role: form.role.trim(),
      location: form.location.trim(),
      url: form.url.trim(),
      salary: form.salary.trim(),
      nextAction: form.nextAction.trim(),
    };
    if (
      !cleaned.company ||
      !cleaned.role ||
      !cleaned.location ||
      !cleaned.appliedAt
    )
      return setError('requiredError');
    if (
      !validDate(cleaned.appliedAt) ||
      cleaned.appliedAt > today() ||
      (cleaned.nextDate && !validDate(cleaned.nextDate))
    )
      return setError('dateError');
    if (cleaned.nextDate && !cleaned.nextAction)
      return setError('actionDateError');
    if (cleaned.url) {
      try {
        if (!['https:', 'http:'].includes(new URL(cleaned.url).protocol))
          throw new Error();
      } catch {
        return setError('linkError');
      }
    }
    onSave(cleaned);
  }
  return (
    <Modal
      title={t(initial ? 'editTitle' : 'newTitle')}
      subtitle={initial ? undefined : t('newSub')}
      onClose={onClose}
      wide
    >
      <form className="record-form" onSubmit={submit} noValidate>
        <div className="form-section-label">
          01 <span>{t('basicInfo')}</span>
        </div>
        <div className="form-grid">
          <label>
            {t('company')} <span className="required">*</span>
            <input
              autoFocus
              name="company"
              value={form.company}
              onChange={(e) => set('company', e.target.value)}
              placeholder={t('companyPlaceholder')}
              maxLength={100}
              required
            />
          </label>
          <label>
            {t('role')} <span className="required">*</span>
            <input
              name="role"
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              placeholder={t('rolePlaceholder')}
              maxLength={120}
              required
            />
          </label>
          <label>
            {t('location')} <span className="required">*</span>
            <input
              name="location"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder={t('locationPlaceholder')}
              maxLength={100}
              required
            />
          </label>
          <label>
            {t('appliedAt')} <span className="required">*</span>
            <input
              name="appliedAt"
              type="date"
              max={today()}
              value={form.appliedAt}
              onChange={(e) => set('appliedAt', e.target.value)}
              required
            />
          </label>
          <label className="form-full">
            {t('status')} <span className="required">*</span>
            <select
              name="status"
              value={form.status}
              onChange={(e) => set('status', e.target.value as Status)}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="priority-field">
          <div className="label">{t('priority')}</div>
          <div className="priority-control">
            <Stars value={form.priority} onChange={(n) => set('priority', n)} />
            <span>{t(`priority${form.priority}` as TranslationKey)}</span>
          </div>
        </div>
        <div className="form-section-label">
          02 <span>{t('moreInfo')}</span>
          <small>{t('optional')}</small>
        </div>
        <div className="form-grid">
          <label>
            {t('url')}
            <input
              type="url"
              name="url"
              value={form.url}
              onChange={(e) => set('url', e.target.value)}
              placeholder={t('linkPlaceholder')}
              maxLength={2000}
            />
          </label>
          <label>
            {t('salary')}
            <input
              name="salary"
              value={form.salary}
              onChange={(e) => set('salary', e.target.value)}
              placeholder={t('salaryPlaceholder')}
              maxLength={100}
            />
          </label>
          <label>
            {t('nextAction')}
            <input
              name="nextAction"
              value={form.nextAction}
              onChange={(e) => set('nextAction', e.target.value)}
              placeholder={t('actionPlaceholder')}
              maxLength={300}
            />
          </label>
          <label>
            {t('nextDate')}
            <input
              name="nextDate"
              type="date"
              value={form.nextDate}
              onChange={(e) => set('nextDate', e.target.value)}
            />
          </label>
        </div>
        {error && (
          <p role="alert" className="form-error">
            <Info size={16} />
            {t(error)}
          </p>
        )}
        <div className="modal-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
          >
            {t('cancel')}
          </button>
          <button type="submit" className="button button-primary">
            {t(initial ? 'saveChanges' : 'save')}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
