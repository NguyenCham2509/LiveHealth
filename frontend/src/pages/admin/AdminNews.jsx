import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';
import { adminNewsApi, adminNewsCategoryApi } from '../../api/adminApi';
import { useToast } from '../../components/admin/Toast';
import './Admin.css';

const empty = { title:'', content:'', newsCategoryId:'' };

const AdminNews = () => {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const { addToast } = useToast();

  const load = () => { setLoading(true); adminNewsApi.getAll(page,10).then(d=>{setItems(d?.items||[]);setTotalPages(d?.meta?.totalPages||1);}).catch(()=>{}).finally(()=>setLoading(false)); };
  useEffect(()=>{load();},[page]);
  useEffect(()=>{adminNewsCategoryApi.getAll(1,100).then(d=>setCats(d?.items||[])).catch(()=>{});},[]);

  const openCreate = () => { setForm({...empty}); setModal('create'); setMsg(''); };
  const openEdit = (item) => { setForm({ title:item.title||'', content:item.content||'', newsCategoryId:item.category?.id||'' }); setModal(item); setMsg(''); };
  const close = () => setModal(null);

  const handleSave = async () => { setSaving(true); try { modal==='create' ? await adminNewsApi.create(form) : await adminNewsApi.update(modal.id, form); close(); load();    } catch (e) { addToast(e.message, 'error'); } setSaving(false); };
  const handleDelete = async (id) => { if(!confirm('Xóa?')) return; try{await adminNewsApi.delete(id);addToast('Đã xóa!');load();}catch(e){addToast(e.message, 'error');} };
  const handleThumb = async (id, file) => { try{await adminNewsApi.uploadThumbnail(id,file);addToast('Upload thành công!');load();}catch(e){addToast(e.message, 'error');} };

  return (
    <div>
      <div className="adm-page-header"><h1 className="adm-page-title">News</h1><button className="adm-btn adm-btn-primary" onClick={openCreate}><Plus size={16}/> Add News</button></div>
      <div className="adm-card">
        {loading ? <div className="adm-empty">Loading...</div> : items.length===0 ? <div className="adm-empty">No news yet.</div> : (
          <table className="adm-table">
            <thead><tr><th>Thumbnail</th><th>Title</th><th>Category</th><th>Actions</th></tr></thead>
            <tbody>{items.map(item=>(
              <tr key={item.id}>
                <td>{item.imageUrl ? <img src={item.imageUrl} className="adm-table-img" alt=""/> : '—'}</td>
                <td><strong>{(item.title||'').substring(0,60)}</strong></td>
                <td>{item.category?.name||'—'}</td>
                <td><div className="adm-table-actions">
                  <label className="adm-btn adm-btn-outline adm-btn-sm" style={{cursor:'pointer'}}><Upload size={14}/><input type="file" hidden accept="image/*" onChange={e => e.target.files[0] && handleThumb(item.id, e.target.files[0])}/></label>
                  <button className="adm-btn adm-btn-outline adm-btn-sm" onClick={()=>openEdit(item)}><Pencil size={14}/></button>
                  <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={()=>handleDelete(item.id)}><Trash2 size={14}/></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        )}
        {totalPages>1 && <div className="adm-pagination">{[...Array(totalPages)].map((_,i)=><button key={i} className={`adm-pg-btn ${page===i+1?'active':''}`} onClick={()=>setPage(i+1)}>{i+1}</button>)}</div>}
      </div>
      {modal && (
        <div className="adm-modal-overlay" onClick={close}><div className="adm-modal" onClick={e=>e.stopPropagation()}>
          <h3 className="adm-modal-title">{modal==='create'?'Add News':'Edit News'}</h3>
          {msg && <div className="adm-msg adm-msg-error">{msg}</div>}
          <div className="adm-form-group"><label>Title</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
          <div className="adm-form-group"><label>Category</label><select value={form.newsCategoryId} onChange={e=>setForm({...form,newsCategoryId:e.target.value})}><option value="">-- Select --</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="adm-form-group"><label>Content</label><textarea rows={8} value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/></div>
          <div className="adm-modal-actions"><button className="adm-btn adm-btn-outline" onClick={close}>Cancel</button><button className="adm-btn adm-btn-primary" onClick={handleSave} disabled={saving}>{saving?'Saving...':'Save'}</button></div>
        </div></div>
      )}
    </div>
  );
};

export default AdminNews;
