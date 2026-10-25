import { useState, type FormEvent } from 'react';
import { Check, LockKeyhole } from 'lucide-react';
import { useI18n, impressionLabels, selfLabels } from '../i18n';
import { today, type Interview, type InterviewInput } from '../types';
import { Modal } from './UI';
import { validDate } from './ApplicationForm';

export default function InterviewForm({
  initial,
  company,
  onSave,
  onClose,
}: {
  initial?: Interview;
  company: string;
  onSave: (data: InterviewInput) => void;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const [form, setForm] = useState<InterviewInput>(
    initial ?? {
      round: '',
      date: today(),
      questions: '',
      performance: '',
      selfNote: '',
      impressions: [],
      interviewerNote: '',
      reflection: '',
    },
  );
  const [error, setError] = useState(false);
  function set<K extends keyof InterviewInput>(
    key: K,
    value: InterviewInput[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    if (
      !form.round.trim() ||
      (form.date && (!validDate(form.date) || form.date > today()))
    )
      return setError(true);
    onSave({
      ...form,
      round: form.round.trim(),
      questions: form.questions.trim(),
      selfNote: form.selfNote.trim(),
      interviewerNote: form.interviewerNote.trim(),
      reflection: form.reflection.trim(),
    });
  }
  return (
    <Modal
      title={t(initial ? 'editInterview' : 'newInterview')}
      subtitle={company}
      onClose={onClose}
      wide
    >
      <form className="record-form interview-form" onSubmit={submit} noValidate>
        <p className="private-notice">
          <LockKeyhole size={14} />
          {t('privateReview')}
        </p>
        <div className="form-grid">
          <label>
            {t('round')} <span className="required">*</span>
            <input
              autoFocus
              name="round"
              value={form.round}
              onChange={(e) => set('round', e.target.value)}
              placeholder={t('roundPlaceholder')}
              maxLength={100}
              required
            />
          </label>
          <label>
            {t('interviewDate')}
            <input
              type="date"
              max={today()}
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
            />
          </label>
        </div>
        <label>
          {t('questions')}
          <textarea
            aria-label={t('questions')}
            value={form.questions}
            onChange={(e) => set('questions', e.target.value)}
            rows={4}
            placeholder={t('questionsPlaceholder')}
            maxLength={15000}
          />
        </label>
        <fieldset className="tag-field">
          <legend>{t('performance')}</legend>
          <div className="tag-options">
            {Object.entries(selfLabels[lang]).map(([key, label]) => (
              <button
                type="button"
                className={`tag-option ${form.performance === key ? 'selected' : ''}`}
                key={key}
                aria-pressed={form.performance === key}
                onClick={() =>
                  set('performance', form.performance === key ? '' : key)
                }
              >
                {form.performance === key && <Check size={13} />} {label}
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor="self-note">
            {t('selfNote')}
          </label>
          <textarea
            id="self-note"
            value={form.selfNote}
            onChange={(e) => set('selfNote', e.target.value)}
            placeholder={t('selfNotePlaceholder')}
            rows={2}
            maxLength={5000}
          />
        </fieldset>
        <fieldset className="tag-field">
          <legend>{t('impression')}</legend>
          <div className="tag-options">
            {Object.entries(impressionLabels[lang]).map(([key, label]) => (
              <button
                type="button"
                className={`tag-option ${form.impressions.includes(key) ? 'selected blue' : ''}`}
                key={key}
                aria-pressed={form.impressions.includes(key)}
                onClick={() =>
                  set(
                    'impressions',
                    form.impressions.includes(key)
                      ? form.impressions.filter((k) => k !== key)
                      : [...form.impressions, key],
                  )
                }
              >
                {form.impressions.includes(key) && <Check size={13} />} {label}
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor="impression-note">
            {t('impressionNote')}
          </label>
          <textarea
            id="impression-note"
            value={form.interviewerNote}
            onChange={(e) => set('interviewerNote', e.target.value)}
            placeholder={t('impressionPlaceholder')}
            rows={2}
            maxLength={5000}
          />
        </fieldset>
        <label>
          {t('reflection')}
          <textarea
            aria-label={t('reflection')}
            value={form.reflection}
            onChange={(e) => set('reflection', e.target.value)}
            rows={4}
            placeholder={t('reflectionPlaceholder')}
            maxLength={15000}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {t('roundError')}
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
            <Check size={16} />
            {t('interviewSave')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
