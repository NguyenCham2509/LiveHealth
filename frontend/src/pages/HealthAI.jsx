import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  TrendingUp,
  Flame,
  Dumbbell,
  Apple,
  ChevronRight,
  Utensils,
  Coffee,
  Moon,
  Cookie,
  MessageCircle,
  Send,
  ShoppingCart,
  Bot,
  ClipboardList,
} from 'lucide-react';
import { healthApi } from '../api/healthApi';
import { cartApi } from '../api/cartApi';
import ProductCard from '../components/product/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/format';
import './HealthAI.css';

const ACTIVITY_LEVELS = [
  { value: 'SEDENTARY', label: 'Ít vận động', desc: 'Ngồi văn phòng' },
  { value: 'LIGHT', label: 'Nhẹ nhàng', desc: 'Đi bộ, việc nhà' },
  { value: 'MODERATE', label: 'Vừa phải', desc: 'Gym 3-5 lần/tuần' },
  { value: 'ACTIVE', label: 'Năng động', desc: 'Thể thao hàng ngày' },
  { value: 'VERY_ACTIVE', label: 'Rất năng động', desc: 'VĐV, lao động nặng' },
];

const GOAL_OPTIONS = [
  { value: '', label: 'Tự động theo BMI' },
  { value: 'gain_weight', label: 'Tăng cân' },
  { value: 'maintain_weight', label: 'Duy trì cân nặng' },
  { value: 'lose_weight', label: 'Giảm cân' },
  { value: 'eat_healthy', label: 'Ăn lành mạnh' },
];

const GOAL_LABELS = {
  gain_weight: 'Tăng cân',
  maintain_weight: 'Duy trì cân nặng',
  lose_weight: 'Giảm cân',
  eat_healthy: 'Ăn lành mạnh',
};

const MEAL_ICONS = { breakfast: Coffee, lunch: Utensils, dinner: Moon, snacks: Cookie };
const MEAL_LABELS = { breakfast: 'Bữa sáng', lunch: 'Bữa trưa', dinner: 'Bữa tối', snacks: 'Bữa phụ' };

const INITIAL_CHAT_PROFILE = {
  height_cm: '',
  weight_kg: '',
  age: '',
  gender: '',
  goal: '',
  plan_days: '',
};

const normalizeVi = (text) =>
  (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();

const parseNumber = (raw) => {
  if (!raw) return undefined;
  const value = Number(String(raw).replace(',', '.'));
  return Number.isNaN(value) ? undefined : value;
};

const parsePositiveInt = (raw, fallback = 1) => {
  const value = parseInt(raw, 10);
  if (Number.isNaN(value) || value < 1) return fallback;
  return value;
};

const inferProfileHints = (message) => {
  const text = message || '';
  const normalized = normalizeVi(text);
  const result = {};

  const m170 = normalized.match(/\b([1-2])\s*m\s*([0-9]{2})\b/);
  if (m170) {
    result.height_cm = String(parseInt(m170[1], 10) * 100 + parseInt(m170[2], 10));
  } else {
    const heightMatch = normalized.match(/\b([0-9]+(?:[.,][0-9]+)?)\s*(cm|m)\b/);
    if (heightMatch) {
      const value = parseNumber(heightMatch[1]);
      if (value !== undefined) {
        result.height_cm = String(heightMatch[2] === 'm' && value < 3 ? value * 100 : value);
      }
    }
  }

  const weightMatch = normalized.match(/\b([0-9]+(?:[.,][0-9]+)?)\s*kg\b/);
  if (weightMatch) {
    const value = parseNumber(weightMatch[1]);
    if (value !== undefined) result.weight_kg = String(value);
  }

  const ageMatch = normalized.match(/\b([1-9][0-9]?)\s*tuoi\b/);
  if (ageMatch) {
    result.age = ageMatch[1];
  }

  if (/\bnam\b/.test(normalized)) result.gender = 'male';
  if (/\bnu\b/.test(normalized)) result.gender = 'female';

  if (/(tang can|bulk|tang co)/.test(normalized)) result.goal = 'gain_weight';
  if (/(duy tri|giu can|on dinh)/.test(normalized)) result.goal = 'maintain_weight';
  if (/(giam can|giam mo|siet can|cat can)/.test(normalized)) result.goal = 'lose_weight';
  if (/(an lanh manh|eat clean|can bang)/.test(normalized)) result.goal = 'eat_healthy';

  const dayMatch = normalized.match(/\b([1-9][0-9]?)\s*ngay\b/);
  if (dayMatch) {
    result.plan_days = dayMatch[1];
  } else {
    const weekMatch = normalized.match(/\b([1-9][0-9]?)\s*tuan\b/);
    if (weekMatch) {
      result.plan_days = String(parseInt(weekMatch[1], 10) * 7);
    }
  }

  return result;
};

const buildUserProfilePayload = (profile) => {
  const payload = {};

  const heightCm = parseNumber(profile.height_cm);
  const weightKg = parseNumber(profile.weight_kg);
  const age = parseInt(profile.age, 10);

  if (heightCm) payload.height_cm = heightCm;
  if (weightKg) payload.weight_kg = weightKg;
  if (!Number.isNaN(age) && age > 0) payload.age = age;
  if (profile.gender === 'male' || profile.gender === 'female') payload.gender = profile.gender;

  return payload;
};

const ChatProductCard = ({
  product,
  checked,
  onToggle,
  showCheckbox,
  onAddToCart,
  onBuyNow,
  disableActions,
}) => {
  const img = product.image || 'https://via.placeholder.com/120?text=No+Image';

  return (
    <div className={`chat-product-card ${product.in_stock ? '' : 'sold-out'} ${showCheckbox ? '' : 'no-checkbox'}`}>
      {showCheckbox && (
        <div className="chat-product-check">
          <input
            type="checkbox"
            checked={checked}
            disabled={!product.in_stock}
            onChange={() => onToggle(product.id)}
            aria-label={`Chọn sản phẩm ${product.name}`}
          />
        </div>
      )}
      <Link to={`/product/${product.id}`} className="chat-product-thumb">
        <img src={img} alt={product.name} />
      </Link>
      <div className="chat-product-info">
        <Link to={`/product/${product.id}`} className="chat-product-name">{product.name}</Link>
        <div className="chat-product-meta">
          <span className="chat-product-price">{formatPrice(product.price || 0)}</span>
          {product.unit && <span className="chat-product-unit">/ {product.unit}</span>}
        </div>
        <div className={`chat-product-stock ${product.in_stock ? 'in-stock' : 'out-stock'}`}>
          {product.availability || (product.in_stock ? 'Còn hàng' : 'Hết hàng')}
        </div>
        <div className="chat-product-actions">
          <Link
            to={`/product/${product.id}`}
            className="chat-product-action view"
          >
            Xem hàng
          </Link>
          <button
            type="button"
            className="chat-product-action"
            disabled={disableActions || !product.in_stock}
            onClick={() => onAddToCart(product.id)}
          >
            Thêm giỏ
          </button>
          <button
            type="button"
            className="chat-product-action buy-now"
            disabled={disableActions || !product.in_stock}
            onClick={() => onBuyNow(product.id)}
          >
            Đặt hàng
          </button>
        </div>
      </div>
    </div>
  );
};

const HealthAI = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { fetchCart, openCart } = useCart();

  const [form, setForm] = useState({
    height: '',
    weight: '',
    age: '',
    gender: 'MALE',
    activityLevel: 'MODERATE',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [chatProfile, setChatProfile] = useState(INITIAL_CHAT_PROFILE);
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      text: 'Mình có thể tính BMI, đánh giá thể trạng, gợi ý thực đơn và đề xuất sản phẩm mua ngay. Bạn có thể bắt đầu bằng chiều cao + cân nặng.',
    },
  ]);
  const [latestChatData, setLatestChatData] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);

  const chatThreadRef = useRef(null);

  useEffect(() => {
    if (chatThreadRef.current) {
      chatThreadRef.current.scrollTop = chatThreadRef.current.scrollHeight;
    }
  }, [chatHistory, chatLoading]);

  const latestProducts = latestChatData?.recommended_products || [];
  const cartActions = latestChatData?.cart_actions || {};
  const supportsMultiSelect = cartActions?.supports_multi_select ?? true;
  const addSelectedAction = cartActions?.add_selected_action || {
    type: 'add_selected_to_cart',
    label: 'Thêm sản phẩm đã chọn vào giỏ',
    default_quantity: 1,
  };
  const addAllAction = cartActions?.add_all_action || {
    type: 'add_all_to_cart',
    label: 'Thêm tất cả còn hàng',
    default_quantity: 1,
  };
  const goToCartAction = cartActions?.go_to_cart_action || {
    type: 'go_to_cart',
    label: 'Đi tới giỏ hàng',
    path: '/cart',
  };
  const goToCartPath = typeof goToCartAction.path === 'string' && goToCartAction.path ? goToCartAction.path : '/cart';

  const inStockProductIds = useMemo(
    () => latestProducts.filter((p) => p.in_stock).map((p) => p.id),
    [latestProducts]
  );
  const addAllProductIds = useMemo(() => {
    const fromAction = Array.isArray(addAllAction?.product_ids) ? addAllAction.product_ids.map(String) : [];
    const validFromAction = fromAction.filter((id) => inStockProductIds.includes(id));
    if (validFromAction.length) return validFromAction;
    return inStockProductIds;
  }, [addAllAction?.product_ids, inStockProductIds]);

  useEffect(() => {
    setSelectedProductIds([]);
  }, [latestChatData]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.height || !form.weight || !form.age) return;

    setLoading(true);
    setError('');
    try {
      const data = await healthApi.analyze(form);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError('Không thể kết nối AI Service. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleChatProfileChange = (e) => {
    const { name, value } = e.target;
    setChatProfile((prev) => ({ ...prev, [name]: value }));
  };

  const sendChat = async (e) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || chatLoading) return;

    const hints = inferProfileHints(trimmed);
    const mergedProfile = { ...chatProfile, ...hints };
    const userProfilePayload = buildUserProfilePayload(mergedProfile);

    setChatProfile(mergedProfile);
    setChatInput('');
    setChatError('');
    setChatHistory((prev) => [...prev, { role: 'user', text: trimmed }]);
    setChatLoading(true);

    try {
      const data = await healthApi.chat({
        message: trimmed,
        userProfile: userProfilePayload,
        planDays: mergedProfile.plan_days,
        goal: mergedProfile.goal,
        includeProducts: true,
      });

      setLatestChatData(data);
      setChatHistory((prev) => [...prev, { role: 'assistant', text: data.assistant_message || 'Mình đã xử lý xong yêu cầu của bạn.' }]);

      if (data?.nutrition_goal && !mergedProfile.goal) {
        setChatProfile((prev) => ({ ...prev, goal: data.nutrition_goal }));
      }
      if (data?.plan_days && !mergedProfile.plan_days) {
        setChatProfile((prev) => ({ ...prev, plan_days: String(data.plan_days) }));
      }
    } catch (err) {
      console.error(err);
      setChatError('Không thể gọi AI chat lúc này. Bạn thử lại sau nhé.');
      setChatHistory((prev) => [...prev, { role: 'assistant', text: 'Mình đang gặp lỗi kết nối tạm thời, bạn vui lòng thử lại sau ít phút.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) return prev.filter((id) => id !== productId);
      return [...prev, productId];
    });
  };

  const addProductIdsToCart = async (productIds, quantity = 1, redirectToCart = false) => {
    const ids = (productIds || []).filter((id) => inStockProductIds.includes(id));
    if (!ids.length) {
      setChatError('Bạn chưa chọn sản phẩm còn hàng để thêm vào giỏ.');
      return;
    }

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setCartLoading(true);
    setChatError('');
    try {
      const qty = parsePositiveInt(quantity, 1);
      for (const id of ids) {
        await cartApi.addItem(id, qty);
      }
      await fetchCart();
      openCart();
      if (redirectToCart) {
        navigate(goToCartPath);
      }
    } catch (err) {
      console.error(err);
      setChatError('Thêm vào giỏ chưa thành công. Bạn thử lại giúp mình nhé.');
    } finally {
      setCartLoading(false);
    }
  };

  const executeCartAction = async (action) => {
    if (!action?.type) return;

    if (action.type === 'add_selected_to_cart') {
      await addProductIdsToCart(
        selectedProductIds,
        action.default_quantity || 1,
        false
      );
      return;
    }

    if (action.type === 'add_all_to_cart') {
      await addProductIdsToCart(
        addAllProductIds,
        action.default_quantity || 1,
        false
      );
      return;
    }

    if (action.type === 'go_to_cart') {
      navigate(typeof action.path === 'string' && action.path ? action.path : '/cart');
    }
  };

  const handleQuickAdd = async (productId) => {
    await addProductIdsToCart([productId], 1, false);
  };

  const handleQuickBuyNow = async (productId) => {
    await addProductIdsToCart([productId], 1, true);
  };

  return (
    <div className="container ai-page">
      <div className="ai-header">
        <div className="ai-icon-wrapper"><Activity size={48} className="ai-icon" /></div>
        <h1>AI Sức Khỏe & Dinh Dưỡng</h1>
        <p>Chat tư vấn BMI, gợi ý thực đơn theo ngày/tuần và thêm sản phẩm vào giỏ hàng ngay trong hội thoại.</p>
      </div>

      <div className="ai-content">
        <section className="ai-chat">
          <div className="chat-section-head">
            <h2><MessageCircle size={20} /> Chat AI Tư Vấn & Mua Hàng</h2>
            <p>API model: <strong>gpt-5.4</strong> (OpenAI-compatible). Bạn chỉ cần nhắn tự nhiên như: "Mình cao 1m70 nặng 78kg, giảm cân 7 ngày".</p>
          </div>

          <div className="chat-profile-grid">
            <div className="form-group">
              <label>Chiều cao (cm)</label>
              <input name="height_cm" className="input ai-input" placeholder="170" value={chatProfile.height_cm} onChange={handleChatProfileChange} />
            </div>
            <div className="form-group">
              <label>Cân nặng (kg)</label>
              <input name="weight_kg" className="input ai-input" placeholder="65" value={chatProfile.weight_kg} onChange={handleChatProfileChange} />
            </div>
            <div className="form-group">
              <label>Tuổi</label>
              <input name="age" className="input ai-input" placeholder="25" value={chatProfile.age} onChange={handleChatProfileChange} />
            </div>
            <div className="form-group">
              <label>Giới tính</label>
              <select name="gender" className="input ai-input" value={chatProfile.gender} onChange={handleChatProfileChange}>
                <option value="">Không bắt buộc</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>
            <div className="form-group">
              <label>Mục tiêu</label>
              <select name="goal" className="input ai-input" value={chatProfile.goal} onChange={handleChatProfileChange}>
                {GOAL_OPTIONS.map((opt) => (
                  <option key={opt.value || 'auto'} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Số ngày thực đơn</label>
              <input name="plan_days" className="input ai-input" placeholder="7" value={chatProfile.plan_days} onChange={handleChatProfileChange} />
            </div>
          </div>

          <div className="chat-thread" ref={chatThreadRef}>
            {chatHistory.map((item, idx) => (
              <div key={`${item.role}-${idx}`} className={`chat-bubble ${item.role}`}>
                <div className="chat-bubble-role">
                  {item.role === 'assistant' ? <><Bot size={14} /> AI</> : 'Bạn'}
                </div>
                <p>{item.text}</p>
              </div>
            ))}
            {chatLoading && (
              <div className="chat-bubble assistant loading">
                <div className="chat-bubble-role"><Bot size={14} /> AI</div>
                <p>AI đang phân tích yêu cầu của bạn...</p>
              </div>
            )}
          </div>

          <form className="chat-input-row" onSubmit={sendChat}>
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Nhập câu hỏi dinh dưỡng của bạn..."
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendChat(e);
                }
              }}
            />
            <button type="submit" className="chat-send-btn" disabled={chatLoading || !chatInput.trim()}>
              <Send size={16} /> Gửi
            </button>
          </form>

          {chatError && <div className="ai-error">{chatError}</div>}

          {latestChatData && (
            <div className="chat-result slide-in">
              <h3><ClipboardList size={18} /> Kết quả phiên chat gần nhất</h3>

              <div className="chat-summary-grid">
                <div className="summary-item">
                  <span>BMI</span>
                  <strong>{latestChatData.bmi ?? '--'}</strong>
                </div>
                <div className="summary-item">
                  <span>Phân loại</span>
                  <strong>{latestChatData.bmi_status || '--'}</strong>
                </div>
                <div className="summary-item">
                  <span>Mục tiêu</span>
                  <strong>{GOAL_LABELS[latestChatData.nutrition_goal] || '--'}</strong>
                </div>
                <div className="summary-item">
                  <span>Số ngày</span>
                  <strong>{latestChatData.plan_days || '--'}</strong>
                </div>
              </div>

              {latestChatData.body_assessment && (
                <div className="chat-assessment">{latestChatData.body_assessment}</div>
              )}

              {latestChatData.meal_plan?.length > 0 && (
                <div className="chat-meal-plan">
                  <h4><Utensils size={16} /> Thực đơn gợi ý</h4>
                  <div className="chat-meal-days">
                    {latestChatData.meal_plan.map((dayItem) => (
                      <div className="chat-meal-day" key={dayItem.day}>
                        <div className="chat-meal-day-title">Ngày {dayItem.day}</div>
                        <ul>
                          <li><strong>Sáng:</strong> {dayItem.breakfast}</li>
                          <li><strong>Trưa:</strong> {dayItem.lunch}</li>
                          <li><strong>Tối:</strong> {dayItem.dinner}</li>
                          <li><strong>Phụ:</strong> {dayItem.snacks}</li>
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {latestProducts.length > 0 ? (
                <div className="chat-product-section">
                  <h4><ShoppingCart size={16} /> Sản phẩm phù hợp từ database</h4>

                  {supportsMultiSelect && (
                    <div className="chat-product-tools">
                      <button
                        type="button"
                        className="chat-tool-btn"
                        onClick={() => setSelectedProductIds(inStockProductIds)}
                        disabled={!inStockProductIds.length}
                      >
                        Chọn tất cả còn hàng
                      </button>
                      <button
                        type="button"
                        className="chat-tool-btn"
                        onClick={() => setSelectedProductIds([])}
                      >
                        Bỏ chọn
                      </button>
                      <span>{selectedProductIds.length} sản phẩm đã chọn</span>
                    </div>
                  )}

                  <div className="chat-product-grid">
                    {latestProducts.map((product) => (
                      <ChatProductCard
                        key={product.id}
                        product={product}
                        checked={selectedProductIds.includes(product.id)}
                        onToggle={toggleProductSelection}
                        showCheckbox={supportsMultiSelect}
                        onAddToCart={handleQuickAdd}
                        onBuyNow={handleQuickBuyNow}
                        disableActions={cartLoading || chatLoading}
                      />
                    ))}
                  </div>

                  <div className="chat-action-row">
                    {supportsMultiSelect && (
                      <button
                        type="button"
                        className="chat-action-btn primary"
                        disabled={!selectedProductIds.length || cartLoading}
                        onClick={() => executeCartAction(addSelectedAction)}
                      >
                        {cartLoading ? 'Đang thêm...' : (addSelectedAction.label || 'Thêm sản phẩm đã chọn vào giỏ')}
                      </button>
                    )}
                    <button
                      type="button"
                      className="chat-action-btn"
                      disabled={!addAllProductIds.length || cartLoading}
                      onClick={() => executeCartAction(addAllAction)}
                    >
                      {addAllAction.label || 'Thêm tất cả còn hàng'}
                    </button>
                    <button
                      type="button"
                      className="chat-action-btn"
                      onClick={() => executeCartAction(goToCartAction)}
                    >
                      {goToCartAction.label || 'Đi tới giỏ hàng'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="chat-no-products">Hiện chưa có sản phẩm phù hợp để hiển thị từ database.</div>
              )}

              {latestChatData.disclaimer && <div className="chat-disclaimer">{latestChatData.disclaimer}</div>}
            </div>
          )}
        </section>

        <div className="ai-divider" />

        <section className="ai-deep-analysis">
          <div className="chat-section-head">
            <h2><Flame size={20} /> Phân Tích Chuyên Sâu</h2>
            <p>Tính BMI, BMR, TDEE và macro theo công thức y khoa, kèm gợi ý thực phẩm từ hệ thống.</p>
          </div>

          <form onSubmit={handleSubmit} className="ai-form">
            <div className="ai-form-row">
              <div className="form-group">
                <label>Chiều cao (cm)</label>
                <input
                  type="number"
                  name="height"
                  className="input ai-input"
                  placeholder="VD: 170"
                  value={form.height}
                  onChange={handleChange}
                  required
                  min="50"
                  max="300"
                />
              </div>
              <div className="form-group">
                <label>Cân nặng (kg)</label>
                <input
                  type="number"
                  name="weight"
                  className="input ai-input"
                  placeholder="VD: 65"
                  value={form.weight}
                  onChange={handleChange}
                  required
                  min="10"
                  max="500"
                />
              </div>
            </div>
            <div className="ai-form-row">
              <div className="form-group">
                <label>Tuổi</label>
                <input
                  type="number"
                  name="age"
                  className="input ai-input"
                  placeholder="VD: 25"
                  value={form.age}
                  onChange={handleChange}
                  required
                  min="1"
                  max="150"
                />
              </div>
              <div className="form-group">
                <label>Giới tính</label>
                <select name="gender" className="input ai-input" value={form.gender} onChange={handleChange}>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Mức vận động</label>
              <div className="activity-grid">
                {ACTIVITY_LEVELS.map((al) => (
                  <label key={al.value} className={`activity-option ${form.activityLevel === al.value ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="activityLevel"
                      value={al.value}
                      checked={form.activityLevel === al.value}
                      onChange={handleChange}
                    />
                    <Dumbbell size={18} />
                    <span className="al-label">{al.label}</span>
                    <span className="al-desc">{al.desc}</span>
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-large btn-full" disabled={loading}>
              {loading ? 'AI đang phân tích...' : 'Bắt đầu phân tích'}
            </button>
          </form>

          {error && <div className="ai-error">{error}</div>}

          {result && (
            <div className="ai-result slide-in">
              <div className={`bmi-score-card ${result.bmi_category}`}>
                <div className="bmi-value">{result.bmi}</div>
                <div className="bmi-status">{result.bmi_status}</div>
              </div>

              <div className="ai-stats-grid">
                <div className="ai-stat"><Flame size={24} className="stat-icon" /><div className="stat-value">{result.bmr}</div><div className="stat-label">BMR (kcal)</div></div>
                <div className="ai-stat"><TrendingUp size={24} className="stat-icon" /><div className="stat-value">{result.daily_calories}</div><div className="stat-label">TDEE (kcal)</div></div>
                <div className="ai-stat protein"><div className="stat-value">{result.protein_g}g</div><div className="stat-label">Protein</div></div>
                <div className="ai-stat carbs"><div className="stat-value">{result.carbs_g}g</div><div className="stat-label">Carbs</div></div>
                <div className="ai-stat fat"><div className="stat-value">{result.fat_g}g</div><div className="stat-label">Chất béo</div></div>
              </div>

              <div className="ai-advice">
                <h3>Phân tích AI</h3>
                <p>{result.advice}</p>
              </div>

              {result.meal_plan && (
                <div className="ai-meal-plan">
                  <h3><Utensils size={20} /> Thực đơn gợi ý</h3>
                  <div className="meal-grid">
                    {Object.entries(result.meal_plan).map(([key, value]) => {
                      const Icon = MEAL_ICONS[key] || Utensils;
                      return (
                        <div key={key} className="meal-card">
                          <Icon size={20} />
                          <strong>{MEAL_LABELS[key] || key}</strong>
                          <p>{value}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {result.diet_tips?.length > 0 && (
                <div className="ai-tips">
                  <h3><Apple size={20} /> Mẹo dinh dưỡng</h3>
                  <ul>{result.diet_tips.map((tip, i) => <li key={i}><ChevronRight size={14} /> {tip}</li>)}</ul>
                </div>
              )}

              {result.recommended_products?.length > 0 && (
                <div className="suggested-products">
                  <h3>Sản phẩm phù hợp với bạn</h3>
                  <p className="sp-desc">Dựa trên phân tích AI, đây là các sản phẩm LiveHealth phù hợp với chỉ số sức khỏe của bạn.</p>
                  <div className="hp-products-grid">
                    {result.recommended_products.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={{
                          id: p.id,
                          name: p.name,
                          description: p.description,
                          oldPrice: p.price,
                          imageUrl: p.image ? [p.image] : [],
                          category: { name: p.category },
                          brand: { name: p.brand },
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HealthAI;
