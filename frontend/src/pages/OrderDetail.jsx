import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { orderApi } from '../api/orderApi';
import { formatPrice } from '../utils/format';
import AccountSidebar from '../components/AccountSidebar';
import './OrderDetail.css';

const steps = [
  { key: 'orderReceived', stepNum: '01' },
  { key: 'processing', stepNum: '02' },
  { key: 'onTheWay', stepNum: '03' },
  { key: 'delivered', stepNum: '04' },
];

const statusToStep = {
  PENDING: 1, RECEIVED: 1, PROCESSING: 2,
  ON_THE_WAY: 3, SHIPPED: 3, DELIVERED: 4, COMPLETED: 4,
};

const OrderDetail = () => {
  const { t } = useLang();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    orderApi.getOrderById(id)
      .then(d => setOrder(d))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>Đang tải...</div>;
  if (!order) return <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>Không tìm thấy đơn hàng.</div>;

  const currentStep = statusToStep[order.status] || 1;
  const items = order.items || [];
  const billing = order.billingAddress || {};
  const shipping = order.shippingAddress || {};

  return (
    <div className="od-wrap">
      <div className="od-breadcrumb">
        <div className="container od-bc-inner">
          <Link to="/">🏠</Link><span>›</span>
          <span>{t('account.breadcrumb')}</span><span>›</span>
          <Link to="/account/orders">{t('orderHistory.breadcrumb')}</Link><span>›</span>
          <span className="bc-active">{t('orderDetail.breadcrumb')}</span>
        </div>
      </div>

      <div className="container od-layout">
        <AccountSidebar activeItem="orders" />
        <div className="od-main">
          <div className="od-card">
            <div className="od-header">
              <div className="od-header-left">
                <h2 className="od-title">{t('orderDetail.title')}</h2>
                <span className="od-meta">• {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : ''} • {items.length} {t('dashboard.products')}</span>
              </div>
              <Link to="/account/orders" className="od-back-link">{t('orderDetail.backToList')}</Link>
            </div>

            <div className="od-info-row">
              <div className="od-address-card">
                <span className="od-label">{t('orderDetail.billingAddress')}</span>
                <h4>{billing.firstName} {billing.lastName}</h4>
                <p>{billing.street} {billing.city}</p>
                <div className="od-addr-detail"><span className="od-addr-label">EMAIL</span><p>{billing.email}</p></div>
                <div className="od-addr-detail"><span className="od-addr-label">PHONE</span><p>{billing.phone}</p></div>
              </div>
              <div className="od-address-card">
                <span className="od-label">{t('orderDetail.shippingAddress')}</span>
                <h4>{shipping.firstName} {shipping.lastName}</h4>
                <p>{shipping.street} {shipping.city}</p>
                <div className="od-addr-detail"><span className="od-addr-label">EMAIL</span><p>{shipping.email}</p></div>
                <div className="od-addr-detail"><span className="od-addr-label">PHONE</span><p>{shipping.phone}</p></div>
              </div>
              <div className="od-summary-card">
                <div className="od-summary-row"><span className="od-summary-label">{t('orderDetail.orderId')}</span><span className="od-summary-value">#{order.orderNumber || order.id?.substring(0,6)}</span></div>
                <div className="od-summary-row"><span className="od-summary-label">{t('orderDetail.paymentMethod')}</span><span className="od-summary-value">{order.paymentMethod?.name || 'N/A'}</span></div>
                <div className="od-summary-divider" />
                <div className="od-summary-row"><span className="od-summary-label">{t('orderDetail.subtotal')}</span><span className="od-summary-value">{formatPrice(order.itemsTotalAmount || 0)}</span></div>
                <div className="od-summary-row"><span className="od-summary-label">{t('orderDetail.shipping')}</span><span className="od-summary-value">{order.shippingCost ? formatPrice(order.shippingCost) : t('orderDetail.free')}</span></div>
                <div className="od-summary-divider" />
                <div className="od-summary-row od-total-row"><span className="od-summary-label">{t('orderDetail.total')}</span><span className="od-total-value">{formatPrice(order.totalAmount || 0)}</span></div>
              </div>
            </div>

            <div className="od-tracker">
              {steps.map((step, i) => {
                const isDone = i + 1 < currentStep;
                const isCurrent = i + 1 === currentStep;
                return (
                  <div key={step.key} className={`od-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                    <div className="od-step-circle">{isDone ? <Check size={16}/> : <span>{step.stepNum}</span>}</div>
                    {i < steps.length - 1 && <div className="od-step-line" />}
                    <p className="od-step-label">{t(`orderDetail.${step.key}`)}</p>
                  </div>
                );
              })}
            </div>

            <div className="od-products-table-wrap">
              <table className="od-products-table">
                <thead><tr><th>{t('orderDetail.product')}</th><th>{t('orderDetail.price')}</th><th>{t('orderDetail.quantity')}</th><th>{t('orderDetail.subtotalCol')}</th></tr></thead>
                <tbody>
                  {items.map(p => (
                    <tr key={p.id}>
                      <td className="od-product-cell"><img src={p.productImageUrl || 'https://via.placeholder.com/60'} alt={p.productName}/><span>{p.productName}</span></td>
                      <td>{formatPrice(p.price)}</td>
                      <td>x{p.quantity}</td>
                      <td className="od-subtotal-val">{formatPrice(p.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
