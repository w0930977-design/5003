import {
  Download,
  Globe2,
  Heart,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useI18n, type TranslationKey } from '../i18n';
import type { Store, Tone } from '../types';
import { Toggle } from './UI';

export default function Settings({
  settings,
  onChange,
  onExport,
  onClear,
}: {
  settings: Store['settings'];
  onChange: (settings: Store['settings']) => void;
  onExport: () => void;
  onClear: () => void;
}) {
  const { t } = useI18n();
  const tones: {
    id: Tone;
    title: TranslationKey;
    sub: TranslationKey;
    icon: typeof Heart;
  }[] = [
    { id: 'gentle', title: 'toneGentle', sub: 'toneGentleSub', icon: Heart },
    {
      id: 'humor',
      title: 'toneHumor',
      sub: 'toneHumorSub',
      icon: MessageCircle,
    },
    { id: 'off', title: 'toneOff', sub: 'toneOffSub', icon: LockKeyhole },
  ];
  return (
    <div className="settings-content">
      <section className="settings-card">
        <div className="settings-heading">
          <span>
            <Globe2 size={20} />
          </span>
          <div>
            <h2>{t('language')}</h2>
            <p>{t('languageHelp')}</p>
          </div>
        </div>
        <div className="language-options">
          <button
            className={settings.language === 'zh' ? 'selected' : ''}
            aria-pressed={settings.language === 'zh'}
            onClick={() => onChange({ ...settings, language: 'zh' })}
          >
            <strong>中</strong>
            <span>简体中文</span>
            <i />
          </button>
          <button
            className={settings.language === 'en' ? 'selected' : ''}
            aria-pressed={settings.language === 'en'}
            onClick={() => onChange({ ...settings, language: 'en' })}
          >
            <strong>En</strong>
            <span>English</span>
            <i />
          </button>
        </div>
      </section>
      <section className="settings-card">
        <div className="settings-heading">
          <span>
            <Heart size={20} />
          </span>
          <div>
            <h2>{t('feedback')}</h2>
            <p>{t('feedbackHelp')}</p>
          </div>
          <Toggle
            checked={settings.tone !== 'off'}
            label={t('feedbackOn')}
            onChange={() =>
              onChange({
                ...settings,
                tone: settings.tone === 'off' ? 'gentle' : 'off',
              })
            }
          />
        </div>
        <h3 className="settings-label">{t('tone')}</h3>
        <div className="tone-options">
          {tones.map((item) => (
            <button
              key={item.id}
              className={settings.tone === item.id ? 'selected' : ''}
              aria-pressed={settings.tone === item.id}
              onClick={() => onChange({ ...settings, tone: item.id })}
            >
              <item.icon size={20} />
              <strong>{t(item.title)}</strong>
              <span>{t(item.sub)}</span>
              <i />
            </button>
          ))}
        </div>
      </section>
      <section className="settings-card">
        <div className="settings-heading">
          <span className="blue">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h2>{t('data')}</h2>
            <p>{t('dataHelp')}</p>
          </div>
        </div>
        <div className="data-actions">
          <button className="button button-secondary" onClick={onExport}>
            <Download size={16} />
            {t('exportData')}
          </button>
          <button className="text-button danger-text" onClick={onClear}>
            <Trash2 size={15} />
            {t('clearData')}
          </button>
        </div>
      </section>
    </div>
  );
}
