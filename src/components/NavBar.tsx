import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const NavBar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() !== '') {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setMenuOpen(false);
    }
  };

  const toggleLanguage = () => {
    const newLng = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLng);
  };

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    navigate('/');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="navbar">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          {i18n.language === 'ar' ? 'سند' : 'SANAD'}
        </Link>

        {/* Desktop Nav links */}
        <nav className="navbar-nav navbar-nav-desktop">
          <Link to="/books">{t('nav.books')}</Link>
          <Link to="/notes">{t('nav.notes')}</Link>
          <Link to="/tutors">{t('nav.tutors')}</Link>
          <Link to="/housing">{t('nav.housing')}</Link>
          <Link to="/tools">{t('nav.tools')}</Link>
        </nav>

        {/* Desktop Search */}
        <form onSubmit={handleSearch} className="navbar-search navbar-search-desktop">
          <input
            type="search"
            placeholder={t('nav.search_placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        {/* Desktop Actions + Mobile Icons */}
        <div className="navbar-actions">
          {/* Language Toggle (Desktop Only) */}
          <button onClick={toggleLanguage} className="navbar-icon-btn navbar-desktop-only" title="تغيير اللغة" style={{ fontSize: '0.8rem', fontWeight: 800 }}>
            {i18n.language === 'ar' ? 'EN' : 'عربي'}
          </button>

          {user ? (
            <>
              <Link to="/notifications" className="navbar-icon-btn" title={t('nav.notifications')}>🔔</Link>
              <Link to="/chat" className="navbar-icon-btn" title={t('nav.chat')}>💬</Link>
              <Link to="/profile" className="navbar-icon-btn" style={{ fontSize: '1.2rem' }}>👤</Link>
              <Link to="/profile" className="navbar-user-name navbar-desktop-only">
                {(user.full_name || user.email?.split('@')[0] || '').slice(0, 10)}
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="btn btn-ghost btn-sm navbar-desktop-only">{t('nav.admin')}</Link>
              )}
              <button onClick={handleSignOut} className="btn btn-ghost btn-sm navbar-desktop-only">{t('nav.logout')}</button>
            </>
          ) : (
            <div className="navbar-desktop-only">
              <Link to="/login" className="btn btn-ghost btn-sm">{t('nav.login')}</Link>
              <Link to="/register" className="btn btn-primary btn-sm">{t('nav.register')}</Link>
            </div>
          )}

          {/* Hamburger — Always on end for mobile */}
          <button
            className="navbar-hamburger"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            <span className={menuOpen ? 'ham-line open-1' : 'ham-line'}></span>
            <span className={menuOpen ? 'ham-line open-2' : 'ham-line'}></span>
            <span className={menuOpen ? 'ham-line open-3' : 'ham-line'}></span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="mobile-menu animate-in">
          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="mobile-search-form">
            <input
              type="search"
              className="form-control"
              placeholder={t('nav.search_placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">{t('common.search')}</button>
          </form>

          {/* Nav Links */}
          <nav className="mobile-nav">
            <Link to="/books" onClick={closeMenu}>📚 {t('nav.books')}</Link>
            <Link to="/notes" onClick={closeMenu}>📝 {t('nav.notes')}</Link>
            <Link to="/tutors" onClick={closeMenu}>🎓 {t('nav.tutors')}</Link>
            <Link to="/housing" onClick={closeMenu}>🏠 {t('nav.housing')}</Link>
            <Link to="/tools" onClick={closeMenu}>🧰 {t('nav.tools')}</Link>
          </nav>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />

          {/* Language Toggle Mobile */}
          <button onClick={() => { toggleLanguage(); closeMenu(); }} className="mobile-nav-btn" style={{ fontWeight: 700, textAlign: 'center' }}>
             🌐 {i18n.language === 'ar' ? 'English' : 'اللغة العربية'}
          </button>

          {/* Auth */}
          {user ? (
            <div className="mobile-auth">
              <Link to="/profile" className="mobile-user-row" onClick={closeMenu}>
                <span className="avatar-circle">{(user.full_name || user.email || '?')[0]}</span>
                <span>{user.full_name || user.email?.split('@')[0]}</span>
              </Link>
              <Link to="/notifications" className="mobile-nav-btn" onClick={closeMenu}>🔔 {t('nav.notifications')}</Link>
              <Link to="/chat" className="mobile-nav-btn" onClick={closeMenu}>💬 {t('nav.chat')}</Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="mobile-nav-btn accent" onClick={closeMenu}>⚙️ {t('nav.admin')}</Link>
              )}
              <button onClick={handleSignOut} className="btn btn-danger w-100" style={{ marginTop: '0.5rem' }}>🚪 {t('nav.logout')}</button>
            </div>
          ) : (
            <div className="mobile-auth" style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
              <Link to="/login" className="btn btn-ghost w-100" onClick={closeMenu}>{t('nav.login')}</Link>
              <Link to="/register" className="btn btn-primary w-100" onClick={closeMenu}>{t('nav.register')}</Link>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {menuOpen && <div className="mobile-menu-backdrop" onClick={closeMenu} />}
    </>
  );
};

export default NavBar;