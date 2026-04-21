import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, PhoneCall, ChevronDown, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useLang } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../data/products';
import './Header.css';

const categories = [
  { nameKey: 'cat.fruit', link: '/shop?category=fruit' },
  { nameKey: 'cat.veg',   link: '/shop?category=veg' },
  { nameKey: 'cat.meat',  link: '/shop?category=meat' },
  { nameKey: 'cat.fish',  link: '/shop?category=fish' },
  { nameKey: 'cat.dairy', link: '/shop?category=dairy' },
];

const Header = () => {
  const { cartCount, cartTotal, openCart } = useCart();
  const { lang, setLang, t } = useLang();
  const { isAuthenticated, user } = useAuth();
  const [catOpen, setCatOpen] = useState(false);

  return (
    <header className="ecobazar-header">
      {/* ── Tier 1: Top bar ── */}
      <div className="h-topbar">
        <div className="container h-topbar-inner">
          <div className="h-topbar-right">
            <div className="h-lang-switch">
              <button
                className={`h-lang-btn ${lang === 'vi' ? 'active' : ''}`}
                onClick={() => setLang('vi')}
              >VIE</button>
              <button
                className={`h-lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}
              >ENG</button>
            </div>
            <div className="h-topbar-sep" />
            {isAuthenticated ? (
              <Link to="/account" className="h-user-link">
                <User size={14} />
                <span>{user.firstName} {user.lastName}</span>
              </Link>
            ) : (
              <Link to="/login">{t('header.login')}</Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Tier 2: Middle — logo / search / actions ── */}
      <div className="h-middle">
        <div className="container h-middle-inner">
          <Link to="/" className="h-logo">
            <svg className="h-logo-leaf" width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c4 0 8.5-3 11-8 0 0-2-3-6-4" stroke="#00B207" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 2s7 4 10 10" stroke="#00B207" strokeWidth="2" strokeLinecap="round"/></svg>
            <span className="h-logo-text">LiveHealth</span>
          </Link>

          <div className="h-search">
            <input type="text" placeholder={t('header.search')} />
            <button className="h-search-btn">{t('header.searchBtn')}</button>
          </div>

          <div className="h-actions">
            <button className="h-action-cart" onClick={openCart} type="button">
              <div className="h-cart-icon">
                <ShoppingBag size={24}/>
                {cartCount > 0 && <span className="h-cart-badge">{cartCount}</span>}
              </div>
              <div className="h-cart-text">
                <span className="h-cart-label">{t('header.cart')}</span>
                <span className="h-cart-total">{formatPrice(cartTotal)}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ── Tier 3: Navigation bar ── */}
      <nav className="h-navbar">
        <div className="container h-navbar-inner">
          <div className="h-navbar-left">
            {/* Category dropdown */}
            <div className="h-cat-dropdown">
              <button className="h-navbar-cat-btn" onClick={() => setCatOpen(!catOpen)}>
                <span className="h-hamburger">☰</span> {t('header.categories')} <ChevronDown size={16} className={`h-cat-chevron ${catOpen ? 'open' : ''}`}/>
              </button>
              {catOpen && (
                <div className="h-cat-menu">
                  {categories.map((c, i) => (
                    <Link key={i} to={c.link} className="h-cat-menu-item" onClick={() => setCatOpen(false)}>
                      {t(c.nameKey)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <ul className="h-nav-links">
              <li><Link to="/" className="h-nav-active">{t('header.home')}</Link></li>
              <li><Link to="/shop">{t('header.shop')}</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/health-ai">{t('header.healthAI')}</Link></li>
              <li><Link to="/about">{t('header.about')}</Link></li>
              <li><Link to="/contact">{t('header.contact')}</Link></li>
            </ul>
          </div>
          <div className="h-navbar-right">
            <PhoneCall size={18}/>
            <span>(028) 9876 5432</span>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
