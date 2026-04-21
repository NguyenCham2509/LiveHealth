import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import { tagApi } from '../api/tagApi';
import { formatPrice } from '../utils/format';
import { useLang } from '../context/LanguageContext';
import { SlidersHorizontal, ArrowRight } from 'lucide-react';
import './Shop.css';

const Shop = () => {
  const { t } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState('all');
  const perPage = 9;

  // Fetch categories & tags once
  useEffect(() => {
    categoryApi.getAll(1, 50).then(data => {
      setCategories(data?.items || []);
    }).catch(() => {});

    tagApi.getAll(1, 50).then(data => {
      setTags((data?.items || []).map(t => t.name));
    }).catch(() => {});
  }, []);

  // Sync category from URL
  useEffect(() => {
    const cat = searchParams.get('category') || 'all';
    setActive(cat);
    setPage(1);
  }, [searchParams]);

  // Fetch products
  useEffect(() => {
    setLoading(true);
    productApi.getAll(page, perPage).then(data => {
      setProducts(data?.items || []);
      setTotalPages(data?.meta?.totalPages || 1);
      setTotalElements(data?.meta?.totalElement || 0);
    }).catch(() => {
      setProducts([]);
    }).finally(() => setLoading(false));
  }, [page]);

  const pickCat = (id) => {
    setActive(id);
    setPage(1);
    setSearchParams(id === 'all' ? {} : { category: id });
  };

  // Client-side filter by category (since API doesn't have category filter param directly)
  let filtered = active === 'all'
    ? products
    : products.filter(p => p.category?.id === active);

  const saleProducts = products.filter(p => p.promotion);

  const allCategories = [
    { id: 'all', name: t('shop.all'), count: totalElements },
    ...categories.map(c => ({ id: c.id, name: c.name, count: c.totalProducts || 0 })),
  ];

  return (
    <div className="shop-wrap">
      {/* Breadcrumb */}
      <div className="shop-breadcrumb">
        <div className="container shop-bc-inner">
          <Link to="/">🏠</Link>
          <span>›</span>
          <span>Categories</span>
          <span>›</span>
          <span className="bc-active">{allCategories.find(c => c.id === active)?.name || t('shop.all')}</span>
        </div>
      </div>

      <div className="container shop-layout">
        {/* ── SIDEBAR ── */}
        <aside className="shop-sidebar">
          {/* Filter button */}
          <button className="shop-filter-btn"><SlidersHorizontal size={18}/> {t('shop.filter')}</button>

          {/* Categories */}
          <div className="sb-widget">
            <h3 className="sb-title">{t('shop.allCategories')}</h3>
            <ul className="sb-cat-list">
              {allCategories.map(c => (
                <li key={c.id}>
                  <label className={`sb-cat-item ${active === c.id ? 'active' : ''}`}>
                    <input type="radio" name="cat" checked={active === c.id} onChange={() => pickCat(c.id)}/>
                    <span className="sb-cat-name">{c.name}</span>
                    <span className="sb-cat-count">({c.count})</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {/* Tags */}
          <div className="sb-widget">
            <h3 className="sb-title">Popular Tag</h3>
            <div className="sb-tags">
              {tags.map(tag => (
                <span key={tag} className="sb-tag">{tag}</span>
              ))}
            </div>
          </div>

          {/* Sale banner */}
          <div className="sb-sale-banner">
            <span>79% Discount</span>
            <p>on your first order</p>
            <Link to="/shop" className="sb-sale-link">{t('home.shopNow')} <ArrowRight size={14}/></Link>
          </div>

          {/* Sale products */}
          <div className="sb-widget">
            <h3 className="sb-title">Sale Products</h3>
            {saleProducts.slice(0, 3).map(p => (
              <Link to={`/product/${p.id}`} key={p.id} className="sb-sale-item">
                <img src={p.imageUrl?.[0] || 'https://via.placeholder.com/60'} alt={p.name}/>
                <div>
                  <span className="sb-sale-name">{p.name}</span>
                  <div className="sb-sale-prices">
                    <span>{formatPrice(p.oldPrice)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="shop-main">
          {/* Top bar */}
          <div className="shop-topbar">
            <div className="shop-sort">
              <span>{t('shop.sortBy')}</span>
              <select>
                <option>{t('shop.latest')}</option>
                <option>Giá: Thấp → Cao</option>
                <option>Giá: Cao → Thấp</option>
              </select>
            </div>
            <span className="shop-result-count"><strong>{totalElements}</strong> {t('shop.resultsFound')}</span>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="shop-empty">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="shop-empty">Không tìm thấy sản phẩm nào.</div>
          ) : (
            <div className="shop-grid">
              {filtered.map(p => <ProductCard key={p.id} product={p}/>)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="shop-pagination">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={`pg-btn ${page === i + 1 ? 'pg-active' : ''}`}
                  onClick={() => setPage(i + 1)}
                >{i + 1}</button>
              ))}
              <button className="pg-btn pg-next" onClick={() => setPage(Math.min(page + 1, totalPages))}>›</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
