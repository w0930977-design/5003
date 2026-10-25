import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, Star, X } from 'lucide-react';
import { useI18n } from '../i18n';
import type { Status } from '../types';

let openModalCount = 0;
let originalOverflow = '';
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const { t } = useI18n();
  useEffect(() => {
    const dialog = ref.current!;
    if (openModalCount++ === 0) originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      if (--openModalCount === 0)
        document.body.style.overflow = originalOverflow;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'modal-wide' : ''} ${className}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        closeRef.current();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-inner">
        <header className="modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label={t('close')}
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}

export function Confirm({
  title,
  body,
  confirm,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  confirm: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <Modal title={title} onClose={onClose} className="confirm-modal">
      <p className="confirm-body">{body}</p>
      <div className="modal-actions">
        <button className="button button-secondary" onClick={onClose} autoFocus>
          {t('cancel')}
        </button>
        <button className="button button-danger" onClick={onConfirm}>
          {confirm}
        </button>
      </div>
    </Modal>
  );
}

export function Stars({
  value,
  onChange,
  small = false,
}: {
  value: number;
  onChange?: (n: number) => void;
  small?: boolean;
}) {
  const { t } = useI18n();
  return (
    <span
      className={`stars ${small ? 'stars-small' : ''} ${onChange ? 'stars-edit' : ''}`}
      role={onChange ? 'group' : 'img'}
      aria-label={onChange ? t('priority') : `${value} / 5 ${t('stars')}`}
    >
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button
            type="button"
            key={n}
            className={n <= value ? 'filled' : ''}
            onClick={() => onChange(n)}
            aria-label={`${t('priorityLabel')} ${n} ${t('stars')}`}
            aria-pressed={n === value}
          >
            <Star />
          </button>
        ) : (
          <Star key={n} className={n <= value ? 'filled' : ''} />
        ),
      )}
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const { statusLabel } = useI18n();
  return (
    <span className={`status-badge status-${status}`}>
      <span />
      {statusLabel(status)}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`toggle ${checked ? 'on' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
    >
      <span>{checked && <Check size={12} />}</span>
    </button>
  );
}

// Keep feedback inside the active native dialog so it remains visible and dismissible.
export function NotificationCenter({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement>(document.body);
  useEffect(() => {
    const dialogs =
      document.querySelectorAll<HTMLDialogElement>('dialog[open]');
    setTarget(dialogs[dialogs.length - 1] ?? document.body);
  }, [children]);
  return createPortal(
    <div className="notifications" aria-live="polite">
      {children}
    </div>,
    target,
  );
}

export function EnvelopeArt({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? 'envelope-art small' : 'envelope-art'}
      viewBox="0 0 420 280"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="221"
        cy="250"
        rx="115"
        ry="12"
        fill="#dbbfa5"
        opacity=".18"
      />
      <path
        d="M36 171c7-30 44-39 68-26 21 11 29 4 38-5"
        stroke="#c4ac8e"
        strokeWidth="1.5"
        strokeDasharray="4 6"
      />
      <path
        d="M338 132c39-19 49-53 24-65-17-8-31 7-20 19 17 17 43 0 49-27"
        stroke="#c4ac8e"
        strokeWidth="1.5"
        strokeDasharray="4 6"
      />
      <circle cx="310" cy="57" r="34" fill="#f1cb81" opacity=".55" />
      <path
        d="M296 192c32-29 48-60 49-99M330 141c-14-7-20-19-15-32 14 2 19 16 15 32ZM342 118c17-1 26-10 24-24-16 0-25 11-24 24ZM311 174c-16-4-24-13-22-27 15 0 25 13 22 27Z"
        fill="#9eaf91"
      />
      <path
        d="M118 205c-30-20-44-45-47-72M86 170c-13 1-23-7-24-20 14-3 23 6 24 20ZM77 151c10-7 13-19 6-28-12 4-15 16-6 28Z"
        fill="#a5b8aa"
      />
      <g transform="rotate(-8 210 156)">
        <path d="m111 127 99-72 99 72v107H111V127Z" fill="#eaa477" />
        <path d="m111 128 99 70 99-70-99-62-99 62Z" fill="#d98b61" />
        <rect x="137" y="72" width="146" height="135" rx="6" fill="#fffaf0" />
        <path
          d="M159 98h60M159 110h99M159 122h82"
          stroke="#dacdb9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="m222 146 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2 5-10Z"
          fill="#eab966"
        />
        <path
          d="m111 128 99 70 99-70v100a8 8 0 0 1-8 8H119a8 8 0 0 1-8-8V128Z"
          fill="#f1b58b"
        />
        <path d="m111 233 84-69a23 23 0 0 1 29 0l85 69" fill="#f6c49c" />
        <path d="m111 233 84-69a23 23 0 0 1 29 0l85 69" stroke="#e4a477" />
        <circle cx="210" cy="190" r="16" fill="#e47e57" />
        <path
          d="m203 189 5 5 9-10"
          stroke="#fff4dd"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <path
        d="m83 75 5 12 12 5-12 5-5 12-5-12-12-5 12-5 5-12Z"
        fill="#e7b667"
      />
      <path d="m323 211 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" fill="#d9956e" />
      <circle cx="133" cy="41" r="3" fill="#d6b085" />
      <circle cx="359" cy="176" r="3" fill="#b3bea8" />
    </svg>
  );
}

export function PaperPlane() {
  return (
    <svg
      className="paper-plane"
      viewBox="0 0 160 130"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M15 81c16-1 39 14 28 25-9 8-23-3-12-14 17-18 34-11 46-37"
        stroke="#9eaba5"
        strokeWidth="1.3"
        strokeDasharray="4 5"
      />
      <path
        d="m61 41 80-25-26 81-20-34-34-22Z"
        fill="#fffdf6"
        stroke="#d3c9b5"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="m95 63 46-47-59 38 1 26 12-17Z" fill="#eadfc9" />
      <path d="m83 80 12-17 8 13-20 4Z" fill="#cbbd9f" />
      <path d="m41 31 3 6 6 2-6 3-3 6-2-6-6-3 6-2 2-6Z" fill="#d9ab65" />
    </svg>
  );
}
