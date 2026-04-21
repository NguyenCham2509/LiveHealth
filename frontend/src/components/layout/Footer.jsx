import { Link } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext';
import './Footer.css';

const Footer = () => {
  const { t } = useLang();

  return (
    <footer className="eco-footer">
      {/* Newsletter */}
      <div className="ft-newsletter">
        <div className="container ft-nl-inner">
          <div className="ft-nl-left">
            <svg className="ft-nl-leaf" width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c4 0 8.5-3 11-8 0 0-2-3-6-4" stroke="#00B207" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 2s7 4 10 10" stroke="#00B207" strokeWidth="2" strokeLinecap="round"/></svg>
            <span className="ft-nl-brand">LiveHealth</span>
          </div>
          <div className="ft-nl-center">
            <span>{t('newsletter.title')}</span>
          </div>
          <div className="ft-nl-right">
            <div className="ft-nl-form">
              <input type="email" placeholder={t('newsletter.placeholder')} />
              <button>{t('newsletter.subscribe')}</button>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="ft-main">
        <div className="container ft-grid">
          <div className="ft-col ft-col-about">
            <h4>{t('footer.aboutUs')}</h4>
            <p>{t('footer.aboutDesc')}</p>
            <div className="ft-contact">
              <span>(028) 9876 5432</span>
              <span>hotro@livehealth.vn</span>
            </div>
          </div>
          <div className="ft-col">
            <h4>{t('footer.myAccount')}</h4>
            <ul>
              <li><Link to="/account">{t('footer.myAccount')}</Link></li>
              <li><Link to="/account/orders">{t('footer.myOrders')}</Link></li>
              <li><Link to="/cart">{t('footer.shoppingCart')}</Link></li>
            </ul>
          </div>
          <div className="ft-col">
            <h4>{t('footer.helpCenter')}</h4>
            <ul>
              <li><Link to="/contact">{t('footer.contact')}</Link></li>
              <li><Link to="/faq">{t('footer.faq')}</Link></li>
              <li><Link to="/about">{t('footer.terms')}</Link></li>
            </ul>
          </div>
          <div className="ft-col">
            <h4>{t('footer.proxy')}</h4>
            <ul>
              <li><Link to="/">{t('header.home')}</Link></li>
              <li><Link to="/shop">{t('header.shop')}</Link></li>
              <li><Link to="/about">{t('footer.privacy')}</Link></li>
            </ul>
          </div>
          <div className="ft-col ft-col-app">
            <h4>Download App</h4>
            <div className="ft-app-btns">
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store"/>
              <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play"/>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="ft-bottom">
        <div className="container ft-bottom-inner">
          <span>{t('footer.copyright')}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
