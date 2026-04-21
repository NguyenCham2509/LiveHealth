import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { orderApi } from '../api/orderApi';
import { cartApi } from '../api/cartApi';
import { shippingMethodApi } from '../api/shippingMethodApi';
import { paymentMethodApi } from '../api/paymentMethodApi';
import { formatPrice } from '../utils/format';
import './Checkout.css';

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [payment, setPayment] = useState('');         // payment method ID
  const [paymentName, setPaymentName] = useState('');  // payment method name (detect VNPay)
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shippingMethods, setShippingMethods] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState('');

  // Form state
  const [form, setForm] = useState({
    firstName: '', lastName: '', company: '', street: '',
    country: 'Vietnam', state: '', zip: '', email: '', phone: '', notes: '',
  });

  useEffect(() => {
    shippingMethodApi.getAll().then(data => {
      const items = data?.items || [];
      setShippingMethods(items);
      if (items.length > 0) setSelectedShipping(items[0].id);
    }).catch(() => {});

    paymentMethodApi.getAll().then(data => {
      const items = data?.items || [];

      // Nếu API không trả về VNPay, tự inject vào danh sách để user có thể chọn
      const hasVnpay = items.some(pm => pm.name?.toLowerCase().includes('vnpay'));
      const finalItems = hasVnpay
        ? items
        : [...items, { id: '__vnpay__', name: 'VNPay', description: 'Thanh toán trực tuyến qua VNPay' }];

      setPaymentMethods(finalItems);
      if (finalItems.length > 0) {
        setPayment(finalItems[0].id);
        setPaymentName(finalItems[0].name || '');
      }
    }).catch(() => {});
  }, []);

  // Pre-fill with user info
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const handleField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Bước 1: Set shipping method vào cart
      if (selectedShipping) {
        await cartApi.selectShippingMethod(selectedShipping);
      }
      // Bước 2: Set payment method vào cart (bỏ qua nếu là VNPay giả lập)
      if (payment && payment !== '__vnpay__') {
        await cartApi.selectPaymentMethod(payment);
      }
      // Bước 3: Đặt hàng
      const addressPayload = {
        companyName: form.company || '',
        streetAddress: form.street,
        country: form.country,
        state: form.state,
        zipCode: parseInt(form.zip) || 0,
      };
      const order = await orderApi.placeOrder({
        billingAddress: addressPayload,
        shippingAddress: addressPayload,
        note: form.notes,
      });
      if (clearCart) clearCart();

      // Detect VNPay
      const isVnpay = payment === '__vnpay__' || /vnpay|online|atm|card|credit/i.test(paymentName);

      if (isVnpay) {
        // Navigate sang PaymentPage với data được truyền qua router state
        navigate('/payment', {
          state: {
            amount: Math.round(order?.totalAmount || cartTotal),
            orderId: order?.id,
            orderNumber: order?.orderNumber,
          },
        });
      } else {
        setDone(true);
      }
    } catch (err) {
      if (err.status === 403) {
        setError(t('checkout.err403'));
      } else {
        setError(err.message || t('checkout.errDefault'));
      }
    }
    setLoading(false);
  };


  // Breadcrumb shared component
  const Breadcrumb = () => (
    <div className="co-breadcrumb">
      <div className="container co-bc-inner">
        <Link to="/">🏠</Link>
        <span>›</span>
        <Link to="/cart">{t('checkout.breadcrumbCart')}</Link>
        <span>›</span>
        <span className="bc-active">{t('checkout.breadcrumb')}</span>
      </div>
    </div>
  );

  // Success screen
  if (done) {
    return (
      <div className="co-page">
        <Breadcrumb />
        <div className="container co-success">
          <div className="co-success-icon">🎉</div>
          <h1>{t('checkout.successTitle')}</h1>
          <p>{t('checkout.successMsg')}</p>
          <Link to="/shop" className="co-btn-green">{t('checkout.continueShopping')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="co-page">
      <Breadcrumb />

      <div className="container co-layout">
        {/* ── Left: Form ── */}
        <form className="co-form" onSubmit={handleOrder}>
          <h2>{t('checkout.billingInfo')}</h2>

          <div className="co-row-3">
            <div className="co-field">
              <label>{t('checkout.firstName')}</label>
              <input
                type="text"
                value={form.firstName}
                onChange={e => handleField('firstName', e.target.value)}
                placeholder={t('checkout.firstNamePlaceholder')}
              />
            </div>
            <div className="co-field">
              <label>{t('checkout.lastName')}</label>
              <input
                type="text"
                value={form.lastName}
                onChange={e => handleField('lastName', e.target.value)}
                placeholder={t('checkout.lastNamePlaceholder')}
              />
            </div>
            <div className="co-field">
              <label>
                {t('checkout.company')}{' '}
                <span className="co-opt">{t('checkout.optional')}</span>
              </label>
              <input
                type="text"
                value={form.company}
                onChange={e => handleField('company', e.target.value)}
                placeholder={t('checkout.companyPlaceholder')}
              />
            </div>
          </div>

          <div className="co-field">
            <label>{t('checkout.streetAddress')}</label>
            <input
              type="text"
              value={form.street}
              onChange={e => handleField('street', e.target.value)}
              placeholder={t('checkout.streetPlaceholder')}
            />
          </div>

          <div className="co-row-3">
            <div className="co-field">
              <label>{t('checkout.country')}</label>
              <select value={form.country} onChange={e => handleField('country', e.target.value)}>
                <option>Vietnam</option>
                <option>United States</option>
              </select>
            </div>
            <div className="co-field">
              <label>{t('checkout.state')}</label>
              <input
                type="text"
                value={form.state}
                onChange={e => handleField('state', e.target.value)}
                placeholder={t('checkout.statePlaceholder')}
              />
            </div>
            <div className="co-field">
              <label>{t('checkout.zip')}</label>
              <input
                type="text"
                value={form.zip}
                onChange={e => handleField('zip', e.target.value)}
                placeholder={t('checkout.zipPlaceholder')}
              />
            </div>
          </div>

          <div className="co-row-2">
            <div className="co-field">
              <label>{t('checkout.email')}</label>
              <input
                type="email"
                value={form.email}
                onChange={e => handleField('email', e.target.value)}
                placeholder={t('checkout.emailPlaceholder')}
              />
            </div>
            <div className="co-field">
              <label>{t('checkout.phone')}</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => handleField('phone', e.target.value)}
                placeholder={t('checkout.phonePlaceholder')}
              />
            </div>
          </div>

          <h2 className="co-h2-second">{t('checkout.additionalInfo')}</h2>
          <div className="co-field">
            <label>
              {t('checkout.orderNotes')}{' '}
              <span className="co-opt">{t('checkout.optional')}</span>
            </label>
            <textarea
              value={form.notes}
              onChange={e => handleField('notes', e.target.value)}
              placeholder={t('checkout.orderNotesPlaceholder')}
              rows={4}
            />
          </div>
        </form>

        {/* ── Right: Order Summary ── */}
        <div className="co-summary">
          <h3>{t('checkout.orderSummary')}</h3>

          <div className="co-items">
            {cart.map(item => (
              <div key={item.id} className="co-item">
                <div className="co-item-left">
                  <img
                    src={item.productImageUrl || 'https://via.placeholder.com/60'}
                    alt={item.productName}
                  />
                  <span>{item.productName} <strong>x{item.quantity}</strong></span>
                </div>
                <span className="co-item-price">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="co-row">
            <span>{t('checkout.subtotal')}</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>

          {/* Shipping Method */}
          <h3 className="co-pay-title">{t('checkout.shippingMethod')}</h3>
          {shippingMethods.map(sm => (
            <label key={sm.id} className="co-pay-option">
              <input
                type="radio"
                name="shipping"
                value={sm.id}
                checked={selectedShipping === sm.id}
                onChange={() => setSelectedShipping(sm.id)}
              />
              {sm.name}{' '}
              {sm.cost > 0
                ? `(${formatPrice(sm.cost)})`
                : `(${t('checkout.shippingFree')})`}
            </label>
          ))}
          {shippingMethods.length === 0 && (
            <div className="co-row">
              <span>{t('checkout.shipping')}</span>
              <span className="co-free">{t('checkout.free')}</span>
            </div>
          )}

          <div className="co-row co-total">
            <span>{t('checkout.total')}</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>

          {/* Payment Method */}
          <h3 className="co-pay-title">{t('checkout.paymentMethod')}</h3>
          {paymentMethods.map(pm => (
            <label key={pm.id} className="co-pay-option">
              <input
                type="radio"
                name="pay"
                value={pm.id}
                checked={payment === pm.id}
                onChange={() => { setPayment(pm.id); setPaymentName(pm.name || ''); }}
              />
              {/* Hiện icon VNPay nếu tên chứa vnpay */}
              {/vnpay|online|atm|card|credit/i.test(pm.name) ? (
                <span className="co-pay-label">
                  {pm.name}
                  <img src="https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png"
                    alt="VNPay" style={{height:'18px',marginLeft:'6px',verticalAlign:'middle'}} />
                </span>
              ) : pm.name}
            </label>
          ))}
          {paymentMethods.length === 0 && (
            <label className="co-pay-option">
              <input
                type="radio"
                name="pay"
                value="cod"
                checked={payment === 'cod'}
                onChange={() => { setPayment('cod'); setPaymentName('cod'); }}
              />
              {t('checkout.cod')}
            </label>
          )}

          {/* Error message */}
          {error && (
            <div className={`co-error-msg ${error.includes('403') || error.includes('Admin') ? 'co-error-msg--403' : ''}`}>
              {error}
            </div>
          )}

          <button
            className="co-btn-green full"
            onClick={handleOrder}
            disabled={cart.length === 0 || loading}
          >
            {loading ? t('checkout.processing') : t('checkout.placeOrder')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
