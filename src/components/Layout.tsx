import {
  BookOpen,
  BriefcaseBusiness,
  ChevronRight,
  Download,
  Heart,
  LayoutDashboard,
  Leaf,
  Mail,
  Menu,
  Plus,
  Settings2,
  Sparkles,
  Sprout,
} from 'lucide-react';
import { useI18n } from '../i18n';
import type { Application, Page, Store } from '../types';
import { PaperPlane } from './UI';

export function Sidebar({
  mobileNav,
  setMobileNav,
  page,
  navigate,
  applications,
  exportData,
}: {
  mobileNav: boolean;
  setMobileNav: (open: boolean) => void;
  page: Page;
  navigate: (page: Page) => void;
  applications: Application[];
  exportData: () => void;
}) {
  const { t } = useI18n();
  const nav = [
    { id: 'home', key: 'home', icon: LayoutDashboard },
    {
      id: 'applications',
      key: 'applications',
      icon: BriefcaseBusiness,
      count: applications.length,
    },
    {
      id: 'reviews',
      key: 'reviews',
      icon: BookOpen,
      count: applications.reduce((n, a) => n + a.interviews.length, 0),
    },
    { id: 'favorites', key: 'favorites', icon: Heart },
  ] as const;
  return (
    <>
      {mobileNav && (
        <button
          className="nav-scrim"
          aria-label={t('menuClose')}
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <a
          className="brand"
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            navigate('home');
          }}
        >
          <span className="brand-icon">
            <Mail size={24} />
            <Sparkles size={13} />
          </span>
          <span>
            <strong>
              offer diary<span className="brand-period">.</span>
            </strong>
            <small>{t('brandSub')}</small>
          </span>
        </a>
        <div className="sidebar-divider" />
        <span className="nav-label">{t('workspace')}</span>
        <nav aria-label={t('workspace')}>
          {nav.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              aria-current={page === item.id ? 'page' : undefined}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={18} />
              <span>{t(item.key)}</span>
              {'count' in item && item.count > 0 && <small>{item.count}</small>}
              {page === item.id && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <PaperPlane />
          <span className="sidebar-note-label">a gentle reminder</span>
          <p>{t('noPressure')}</p>
          <div>
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="sidebar-bottom">
          <button
            className={`nav-item ${page === 'settings' ? 'active' : ''}`}
            aria-current={page === 'settings' ? 'page' : undefined}
            onClick={() => navigate('settings')}
          >
            <Settings2 size={18} />
            <span>{t('settings')}</span>
          </button>
          <button className="nav-item export-nav" onClick={exportData}>
            <Download size={18} />
            <span>{t('backup')}</span>
          </button>
          <div className="sidebar-divider" />
          <div className="personal-space">
            <span>
              <Sprout size={19} />
            </span>
            <div>
              <strong>{t('personal')}</strong>
              <small>
                <span className="green-dot" />
                {t('private')}
              </small>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function Topbar({
  page,
  setMobileNav,
  settings,
  updateSettings,
}: {
  page: Page;
  setMobileNav: (open: boolean) => void;
  settings: Store['settings'];
  updateSettings: (settings: Store['settings']) => void;
}) {
  const { t, lang } = useI18n();
  const pageKey = page;
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <button
          className="icon-button mobile-menu"
          onClick={() => setMobileNav(true)}
          aria-label={t('navToggle')}
        >
          <Menu size={22} />
        </button>
        <span>{t('workspace')}</span>
        <ChevronRight size={13} />
        <strong>{t(pageKey)}</strong>
      </div>
      <div className="topbar-actions">
        <span className="local-status" title={t('localTip')}>
          <span />
          {t('local')}
        </span>
        <button
          className="language-button"
          aria-label={t('language')}
          onClick={() =>
            updateSettings({
              ...settings,
              language: lang === 'zh' ? 'en' : 'zh',
            })
          }
        >
          <span className={lang === 'zh' ? 'current' : ''}>中</span>
          <i />
          <span className={lang === 'en' ? 'current' : ''}>EN</span>
        </button>
        <span className="topbar-avatar">
          <Leaf size={18} />
        </span>
      </div>
    </header>
  );
}

export function PageHeading({
  page,
  addApplication,
}: {
  page: Page;
  addApplication: () => void;
}) {
  const { t } = useI18n();
  const pageKey = page;
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">
          {page === 'home' ? t('journey') : 'YOUR OWN LITTLE SPACE'}
        </span>
        <h1>{page === 'home' ? t('brand') : t(pageKey)}</h1>
        <p>
          {page === 'home'
            ? 'Got an Offer Yet? · ' + t('brandSub')
            : t(
                page === 'applications'
                  ? 'boardSub'
                  : page === 'reviews'
                    ? 'reviewsSub'
                    : page === 'favorites'
                      ? 'favoriteSub'
                      : 'settingsSub',
              )}
        </p>
      </div>
      {page !== 'settings' && (
        <button className="button button-primary" onClick={addApplication}>
          <Plus size={18} />
          {t('newApplication')}
        </button>
      )}
    </div>
  );
}

export function PageFooter() {
  const { t } = useI18n();
  return (
    <footer className="page-footer">
      <span>
        <Sprout size={14} />
        {t('footer')}
      </span>
      <small>MADE FOR YOUR OWN PACE</small>
    </footer>
  );
}
