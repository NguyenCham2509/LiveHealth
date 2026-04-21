import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/userApi';
import AccountSidebar from '../components/AccountSidebar';
import './AccountSettings.css';

const AccountSettings = () => {
  const { t } = useLang();
  const { user, refreshProfile } = useAuth();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef(null);

  const billing = user?.billingAddress || {};

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    const fd = new FormData(e.target);
    try {
      await userApi.updateProfile({
        firstName: fd.get('firstName'),
        lastName: fd.get('lastName'),
        email: fd.get('email'),
        phone: fd.get('phone'),
      });
      await refreshProfile();
      setMsg('Cập nhật thành công!');
    } catch (err) {
      setMsg(err.message || 'Lỗi');
    }
    setSaving(false);
  };

  const handleBillingSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    const fd = new FormData(e.target);
    try {
      await userApi.updateBillingAddress({
        firstName: fd.get('bFirstName'),
        lastName: fd.get('bLastName'),
        company: fd.get('bCompany'),
        street: fd.get('bStreet'),
        country: fd.get('bCountry'),
        state: fd.get('bState'),
        zipCode: fd.get('bZip'),
        email: fd.get('bEmail'),
        phone: fd.get('bPhone'),
      });
      await refreshProfile();
      setMsg('Cập nhật địa chỉ thành công!');
    } catch (err) {
      setMsg(err.message || 'Lỗi');
    }
    setSaving(false);
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await userApi.uploadAvatar(file);
      await refreshProfile();
    } catch {}
  };

  return (
    <div className="as-wrap">
      <div className="as-breadcrumb">
        <div className="container as-bc-inner">
          <Link to="/">🏠</Link><span>›</span>
          <span>{t('account.breadcrumb')}</span><span>›</span>
          <span className="bc-active">{t('settings.breadcrumb')}</span>
        </div>
      </div>

      <div className="container as-layout">
        <AccountSidebar activeItem="settings" />
        <div className="as-main">
          {msg && <div style={{padding:'10px 16px',background:'#e8f5e9',color:'#2e7d32',borderRadius:8,marginBottom:16}}>{msg}</div>}

          <div className="as-section">
            <h2 className="as-section-title">{t('settings.accountSettings')}</h2>
            <form onSubmit={handleProfileSave} className="as-form">
              <div className="as-form-row">
                <div className="as-form-group"><label>{t('settings.firstName')}</label><input name="firstName" type="text" defaultValue={user?.firstName || ''}/></div>
                <div className="as-form-group"><label>{t('settings.lastName')}</label><input name="lastName" type="text" defaultValue={user?.lastName || ''}/></div>
              </div>
              <div className="as-form-group"><label>{t('settings.email')}</label><input name="email" type="email" defaultValue={user?.email || ''}/></div>
              <div className="as-form-group"><label>{t('settings.phone')}</label><input name="phone" type="tel" defaultValue={user?.phone || ''}/></div>
              <button type="submit" className="as-save-btn" disabled={saving}>{saving ? 'Đang lưu...' : t('settings.saveChanges')}</button>
            </form>
            <div className="as-avatar-section">
              <img src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.firstName||'U'))}&size=120&rounded=true`} alt="Avatar" className="as-avatar-img"/>
              <input type="file" ref={fileRef} style={{display:'none'}} accept="image/*" onChange={handleAvatar}/>
              <button className="as-choose-img-btn" onClick={() => fileRef.current?.click()}>{t('settings.chooseImage')}</button>
            </div>
          </div>

          <div className="as-section">
            <h2 className="as-section-title">{t('settings.billingAddress')}</h2>
            <form onSubmit={handleBillingSave} className="as-form">
              <div className="as-form-row as-form-row-3">
                <div className="as-form-group"><label>{t('settings.firstName')}</label><input name="bFirstName" type="text" defaultValue={billing.firstName||''}/></div>
                <div className="as-form-group"><label>{t('settings.lastName')}</label><input name="bLastName" type="text" defaultValue={billing.lastName||''}/></div>
                <div className="as-form-group"><label>{t('settings.companyName')} <span className="as-optional">({t('settings.optional')})</span></label><input name="bCompany" type="text" defaultValue={billing.company||''}/></div>
              </div>
              <div className="as-form-group"><label>{t('settings.streetAddress')}</label><input name="bStreet" type="text" defaultValue={billing.street||''}/></div>
              <div className="as-form-row as-form-row-3">
                <div className="as-form-group"><label>{t('settings.country')}</label><input name="bCountry" type="text" defaultValue={billing.country||'Vietnam'}/></div>
                <div className="as-form-group"><label>{t('settings.states')}</label><input name="bState" type="text" defaultValue={billing.state||''}/></div>
                <div className="as-form-group"><label>{t('settings.zipCode')}</label><input name="bZip" type="text" defaultValue={billing.zip||''}/></div>
              </div>
              <div className="as-form-row">
                <div className="as-form-group"><label>{t('settings.email')}</label><input name="bEmail" type="email" defaultValue={billing.email||''}/></div>
                <div className="as-form-group"><label>{t('settings.phone')}</label><input name="bPhone" type="tel" defaultValue={billing.phone||''}/></div>
              </div>
              <button type="submit" className="as-save-btn" disabled={saving}>{saving ? 'Đang lưu...' : t('settings.saveChanges')}</button>
            </form>
          </div>

          <div className="as-section">
            <h2 className="as-section-title">{t('settings.changePassword')}</h2>
            <form onSubmit={e => e.preventDefault()} className="as-form">
              <div className="as-form-group as-pw-group"><label>{t('settings.currentPassword')}</label><div className="as-pw-wrap"><input type={showCurrent?'text':'password'} placeholder="Password"/><button type="button" className="as-pw-toggle" onClick={()=>setShowCurrent(!showCurrent)}>{showCurrent?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
              <div className="as-form-row">
                <div className="as-form-group as-pw-group"><label>{t('settings.newPassword')}</label><div className="as-pw-wrap"><input type={showNew?'text':'password'} placeholder="Password"/><button type="button" className="as-pw-toggle" onClick={()=>setShowNew(!showNew)}>{showNew?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
                <div className="as-form-group as-pw-group"><label>{t('settings.confirmPassword')}</label><div className="as-pw-wrap"><input type={showConfirm?'text':'password'} placeholder="Password"/><button type="button" className="as-pw-toggle" onClick={()=>setShowConfirm(!showConfirm)}>{showConfirm?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
              </div>
              <button type="submit" className="as-save-btn">{t('settings.changePasswordBtn')}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
