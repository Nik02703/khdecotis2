'use client';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { LayoutDashboard, ShoppingBag, Users, Settings, LogOut, TrendingUp, DollarSign, PackageOpen, MousePointerClick, Search, Bell, Menu, Trash2, IndianRupee, X, Edit, UploadCloud } from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import { useProducts } from '@/context/ProductContext';
import { useMessages } from '@/context/MessageContext';

const revData = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 5000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 8900 },
  { name: 'Sat', revenue: 12000 },
  { name: 'Sun', revenue: 14500 },
];

const catData = [
  { name: 'Bedsheets', sales: 4000 },
  { name: 'Comforters', sales: 3000 },
  { name: 'Mattresses', sales: 2000 },
  { name: 'Cushions', sales: 2780 },
  { name: 'Curtains', sales: 1890 },
];

export default function AdminPage() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [passwordCode, setPasswordCode] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // set orders as default for testing
  const { orders, updateOrderStatus } = useOrders();
  const { products, addProduct, removeProduct, editProduct } = useProducts();
  const { messages, markAsRead, deleteMessage } = useMessages();
  const unreadCount = messages ? messages.filter(m => m.status === 'unread').length : 0;

  const [newProd, setNewProd] = useState({ title: '', price: '', oldPrice: '', category: 'Bedding', stock: '', images: [], description: '', isDealOfDay: false, isNewArrival: false, colors: [], sizes: [], productDetails: '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '', maxUses: '' });
  const [tmpColorName, setTmpColorName] = useState('');
  const [tmpColorHex, setTmpColorHex] = useState('#000000');
  const [tmpSizeName, setTmpSizeName] = useState('');
  const [tmpSizeDim, setTmpSizeDim] = useState('');

  const handleCreateCoupon = (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discount) return alert('Coupon code and discount % are required.');
    
    let existing = [];
    try {
      const stored = localStorage.getItem('khd_coupons');
      if (stored) existing = JSON.parse(stored);
    } catch (err) {}
    
    const couponObj = {
      code: newCoupon.code.toUpperCase().trim(),
      type: 'percent',
      value: parseInt(newCoupon.discount, 10),
      active: true
    };
    
    existing.push(couponObj);
    localStorage.setItem('khd_coupons', JSON.stringify(existing));
    
    alert(`Coupon ${couponObj.code} generated and pushed to global storefront!`);
    setNewCoupon({ code: '', discount: '', maxUses: '' });
    setActiveTab('dashboard');
  };

  const handlePublish = (e) => {
    e.preventDefault();
    if (!newProd.title || !newProd.price) return alert("Title and Selling Price are strictly required.");
    
    const productData = {
      title: newProd.title,
      price: newProd.price,
      oldPrice: newProd.oldPrice,
      category: newProd.category,
      images: newProd.images && newProd.images.length > 0 ? newProd.images : ['https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80'],
      description: newProd.description,
      isDealOfDay: newProd.isDealOfDay,
      isNewArrival: newProd.isNewArrival,
      colors: newProd.colors || [],
      sizes: newProd.sizes || [],
      productDetails: newProd.productDetails || ''
    };

    if (newProd._id || newProd.id) {
      editProduct(newProd._id || newProd.id, productData);
      alert('Product successfully updated!');
    } else {
      addProduct(productData);
      alert('Product successfully published across global storefront databases!');
    }
    
    setNewProd({ title: '', price: '', oldPrice: '', category: 'Bedding', stock: '', images: [], description: '', isDealOfDay: false, isNewArrival: false, colors: [], sizes: [], productDetails: '' });
    setActiveTab('manageProducts');
  };

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files || e.dataTransfer?.files || []);
    files.forEach(file => {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();

      reader.onload = (event) => {
        if (isVideo) {
          setNewProd(prev => ({ ...prev, images: [...(prev.images || []), event.target.result] }));
        } else {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const scaleSize = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
            canvas.width = img.width * scaleSize;
            canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setNewProd(prev => ({ ...prev, images: [...(prev.images || []), canvas.toDataURL('image/jpeg', 0.6)] }));
          };
          img.src = event.target.result;
        }
      };
      reader.readAsDataURL(file);
    });
  };


  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordCode === 'admin123') {
      setIsAdminLoggedIn(true);
    } else {
      alert("Invalid Admin Credentials.");
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="container animate-fade-in page-wrapper content-centered" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 className="page-title" style={{ fontFamily: 'Playfair Display, serif', marginBottom: '2rem' }}>Secure Admin Access</h1>
        <form onSubmit={handleLogin} style={{ maxWidth: '400px', width: '100%', padding: '3rem', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
          <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--primary)', fontFamily: 'Outfit, sans-serif' }}>Master Passcode</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={passwordCode}
              onChange={(e) => setPasswordCode(e.target.value)}
              style={{ width: '100%', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', outline: 'none', background: 'var(--background)', fontSize: '1.1rem', letterSpacing: '4px', textAlign: 'center' }} 
            />
          </div>
          <button type="submit" style={{ width: '100%', background: 'var(--primary)', color: '#fff', padding: '14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', border: 'none', fontSize: '1rem', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            Unlock Dashboard
          </button>
        </form>
      </div>
    );
  }

  const totalRevenue = orders.reduce((acc, order) => {
    const amountData = typeof order.total === 'string' ? parseInt(order.total.replace(/[^0-9]/g, ''), 10) : (order.total || 0);
    return acc + (isNaN(amountData) ? 0 : amountData);
  }, 0);
  const totalOrders = orders.length;
  const mockVisitors = (totalOrders * 40) + 47813;
  const mockConversion = totalOrders > 0 ? ((totalOrders / mockVisitors) * 100).toFixed(2) : '0.00';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Outfit, sans-serif' }} className="animate-fade-in">
      
      {/* Sidebar Navigation */}
      <aside style={{ width: '260px', background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 40, overflowY: 'auto', transition: 'transform 0.3s ease', transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(0)' }} className="admin-sidebar">
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', m: 0, fontWeight: 700, color: '#0f172a' }}>Khdecotis</h2>
        </div>
        <nav style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '12px', marginBottom: '8px' }}>Analytics Core</div>
          <button onClick={() => setActiveTab('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', background: activeTab === 'dashboard' ? '#eff6ff' : 'transparent', color: activeTab === 'dashboard' ? '#1d4ed8' : '#64748b', border: 'none', fontWeight: activeTab === 'dashboard' ? 600 : 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('orders')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', background: activeTab === 'orders' ? '#eff6ff' : 'transparent', color: activeTab === 'orders' ? '#1d4ed8' : '#64748b', border: 'none', fontWeight: activeTab === 'orders' ? 600 : 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
            <ShoppingBag size={20} /> Orders & Fulfillment
          </button>
          <button onClick={() => { setActiveTab('addProduct'); setNewProd({ title: '', price: '', oldPrice: '', category: 'Bedding', stock: '', images: [], description: '', isDealOfDay: false, isNewArrival: false, colors: [], sizes: [], productDetails: '' }); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', background: activeTab === 'addProduct' ? '#eff6ff' : 'transparent', color: activeTab === 'addProduct' ? '#1d4ed8' : '#64748b', border: 'none', fontWeight: activeTab === 'addProduct' ? 600 : 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
            <PackageOpen size={20} /> Add New Product
          </button>
          <button onClick={() => setActiveTab('manageProducts')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', background: activeTab === 'manageProducts' ? '#eff6ff' : 'transparent', color: activeTab === 'manageProducts' ? '#1d4ed8' : '#64748b', border: 'none', fontWeight: activeTab === 'manageProducts' ? 600 : 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
            <Trash2 size={20} /> Manage Products
          </button>
          <button onClick={() => setActiveTab('messages')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', background: activeTab === 'messages' ? '#eff6ff' : 'transparent', color: activeTab === 'messages' ? '#1d4ed8' : '#64748b', border: 'none', fontWeight: activeTab === 'messages' ? 600 : 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
            <Bell size={20} /> Customer Messages
            {unreadCount > 0 && <span style={{ background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, marginLeft: 'auto' }}>{unreadCount}</span>}
          </button>
          <button onClick={() => setActiveTab('coupons')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', background: activeTab === 'coupons' ? '#eff6ff' : 'transparent', color: activeTab === 'coupons' ? '#1d4ed8' : '#64748b', border: 'none', fontWeight: activeTab === 'coupons' ? 600 : 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
            <DollarSign size={20} /> Promo Coupons
          </button>
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => setActiveTab('settings')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', background: activeTab === 'settings' ? '#eff6ff' : 'transparent', color: activeTab === 'settings' ? '#1d4ed8' : '#64748b', border: 'none', fontWeight: activeTab === 'settings' ? 600 : 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
              <Settings size={20} /> Site Configuration
            </button>
            <button onClick={() => setIsAdminLoggedIn(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', background: '#fef2f2', color: '#ef4444', border: 'none', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}>
              <LogOut size={20} /> Terminate Session
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column', minHeight: '100vh', maxWidth: '100%', overflowX: 'hidden' }} className="admin-main">
        {/* Top Header */}
        <header style={{ height: '72px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', position: 'sticky', top: 0, zIndex: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder="Search orders, clients, or products..." style={{ width: '100%', padding: '10px 16px 10px 40px', background: '#f1f5f9', border: 'none', borderRadius: '8px', outline: 'none', fontSize: '0.9rem', color: '#334155' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button onClick={() => setActiveTab('messages')} style={{ background: 'none', border: 'none', position: 'relative', cursor: 'pointer' }}>
              <Bell size={22} color="#64748b" />
              {unreadCount > 0 && <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', border: '2px solid #fff' }}></span>}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff" alt="Admin" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', lineHeight: 1 }}>Admin User</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Superadmin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
        <div style={{ padding: '32px', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Performance Overview</h1>
            <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.95rem' }}>Track metrics, visualize revenue pipelines, and monitor conversion streams in real-time.</p>
          </div>

          {/* KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Gross Revenue</p>
                  <h3 style={{ margin: '8px 0 0 0', fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>₹{totalRevenue.toLocaleString('en-IN')}</h3>
                </div>
                <div style={{ background: '#dcfce7', padding: '10px', borderRadius: '12px' }}><IndianRupee size={24} color="#16a34a" /></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', fontWeight: 600 }}><TrendingUp size={16} /> +12.5%</span>
                <span style={{ color: '#94a3b8' }}>from last month</span>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Orders Fulfilled</p>
                  <h3 style={{ margin: '8px 0 0 0', fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{totalOrders}</h3>
                </div>
                <div style={{ background: '#dbeafe', padding: '10px', borderRadius: '12px' }}><ShoppingBag size={24} color="#2563eb" /></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', fontWeight: 600 }}><TrendingUp size={16} /> +8.2%</span>
                <span style={{ color: '#94a3b8' }}>from last month</span>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Conversion Rate</p>
                  <h3 style={{ margin: '8px 0 0 0', fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{mockConversion}%</h3>
                </div>
                <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '12px' }}><MousePointerClick size={24} color="#d97706" /></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', fontWeight: 600 }}><TrendingUp size={16} /> +1.1%</span>
                <span style={{ color: '#94a3b8' }}>from last month</span>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Visitors</p>
                  <h3 style={{ margin: '8px 0 0 0', fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{mockVisitors.toLocaleString('en-US')}</h3>
                </div>
                <div style={{ background: '#f3e8ff', padding: '10px', borderRadius: '12px' }}><Users size={24} color="#9333ea" /></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', fontWeight: 600 }}><TrendingUp size={16} style={{transform: 'rotate(180deg)'}} /> -2.4%</span>
                <span style={{ color: '#94a3b8' }}>from last month</span>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }} className="charts-grid">
            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', minHeight: '400px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#0f172a', margin: '0 0 24px 0' }}>Revenue Trend (Trailing Week)</h3>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} tickFormatter={(value) => `₹${value/1000}k`} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} activeDot={{ r: 8 }} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', minHeight: '400px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#0f172a', margin: '0 0 24px 0' }}>Sales Volume by Category</h3>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={catData} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#0f172a', fontSize: 12, fontWeight: 500 }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="sales" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Recent Orders Database</h3>
              <button style={{ background: 'transparent', border: '1px solid #e2e8f0', color: '#0f172a', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>View All Orders</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Order ID</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Customer Mapping</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Date Stamp</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Amount</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Logistics Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((order, idx) => (
                    <tr key={order.id} onClick={() => setSelectedOrder(order)} style={{ borderTop: idx !== 0 ? '1px solid #e2e8f0' : 'none', transition: 'all 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor='#f1f5f9'} onMouseOut={(e) => e.currentTarget.style.backgroundColor='transparent'}>
                      <td style={{ padding: '16px 24px', fontSize: '0.95rem', fontWeight: 600, color: '#3b82f6' }}>{order.id}</td>
                      <td style={{ padding: '16px 24px', fontSize: '0.95rem', color: '#0f172a', fontWeight: 500 }}>{order.name}</td>
                      <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: '#64748b' }}>{order.date}</td>
                      <td style={{ padding: '16px 24px', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>{order.total}</td>
                      <td style={{ padding: '16px 24px' }}><span style={{ background: order.color, color: order.text, padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.02em', display: 'inline-block' }}>{order.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}

        {/* Orders Content */}
        {activeTab === 'orders' && (
        <div style={{ padding: '32px', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Order Fulfillment Pipeline</h2>
            </div>
            <p style={{ color: '#64748b', marginBottom: '32px' }}>Review active incoming orders. Accept to dispatch logic or Reject to trigger automatic refund protocols.</p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Order ID</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Customer Mapping</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Amount</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Logistics Status</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, idx) => (
                    <tr key={order.id} onClick={() => setSelectedOrder(order)} style={{ borderTop: idx !== 0 ? '1px solid #e2e8f0' : 'none', transition: 'all 0.2s', background: order.status === 'Cancelled' ? '#fcfcfc' : '#fff', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.filter='brightness(0.98)'} onMouseOut={(e) => e.currentTarget.style.filter='none'}>
                      <td style={{ padding: '16px 24px', fontSize: '0.95rem', fontWeight: 600, color: '#3b82f6' }}>{order.id}</td>
                      <td style={{ padding: '16px 24px', fontSize: '0.95rem', color: '#0f172a', fontWeight: 500 }}>{order.name}<br /><span style={{fontSize:'0.8rem', color:'#64748b'}}>{order.date}</span></td>
                      <td style={{ padding: '16px 24px', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>{order.total}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ background: order.color, color: order.text, padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.02em', display: 'inline-block' }}>{order.status}</span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        {order.status === 'Pending' ? (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'Shipped', '#dbeafe', '#2563eb'); }} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'background 0.2s' }}>Accept</button>
                            <button onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'Cancelled', '#fee2e2', '#ef4444'); }} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'background 0.2s' }}>Reject</button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}

        {/* Add Product Content */}
        {activeTab === 'addProduct' && (
          <div style={{ padding: '32px', maxWidth: '800px', width: '100%' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Publish New Product</h2>
            <p style={{ color: '#64748b', marginBottom: '32px' }}>Upload new inventory items directly to the storefront catalog without developer intervention.</p>
            <form onSubmit={handlePublish} style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Product Title</label>
                <input type="text" value={newProd.title} onChange={e => setNewProd({...newProd, title: e.target.value})} placeholder="e.g. Premium Linen Bedsheet" style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Selling Price (₹)</label>
                  <input type="number" value={newProd.price || ''} onChange={e => setNewProd({...newProd, price: e.target.value})} placeholder="1499" style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>MRP / Original Price (₹)</label>
                  <input type="number" value={newProd.oldPrice || ''} onChange={e => setNewProd({...newProd, oldPrice: e.target.value})} placeholder="2999" style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Primary Category Placement</label>
                  <select value={newProd.category} onChange={e => setNewProd({...newProd, category: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '0.95rem', background: '#fff' }}>
                    <option value="Bedding">Bedding</option><option value="Bedsheets">Bedsheets</option><option value="Comforter">Comforter</option><option value="Mattress">Mattress</option><option value="Cushions">Cushions</option><option value="Curtains">Curtains</option><option value="Door Mats">Door Mats</option><option value="Hand Towels">Hand Towels</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#334155', fontSize: '0.95rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newProd.isDealOfDay} onChange={e => setNewProd({...newProd, isDealOfDay: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    Flag as 'Deal of the Day'
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#334155', fontSize: '0.95rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newProd.isNewArrival} onChange={e => setNewProd({...newProd, isNewArrival: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    Flag as 'New Arrival'
                  </label>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Product Media (Images & Videos)</label>
                {newProd.images && newProd.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '10px' }}>
                    {newProd.images.map((imgSrc, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0, border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                        {(imgSrc.startsWith('data:video') || imgSrc.endsWith('.mp4')) ? (
                          <video src={imgSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                        ) : (
                          <img src={imgSrc} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                        <button 
                          type="button" 
                          onClick={() => setNewProd({...newProd, images: newProd.images.filter((_, i) => i !== idx)})} 
                          style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', zIndex: 10 }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ width: '100%', border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '32px', textAlign: 'center', background: '#f8fafc', position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }} onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff'; }} onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }} onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; handleMediaUpload(e); }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <UploadCloud size={40} color="#94a3b8" />
                    <div>
                      <span style={{ fontWeight: 600, color: '#3b82f6' }}>Click to upload</span> or drag and drop<br/>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>SVG, PNG, JPG or MP4 (max. 10MB)</span>
                    </div>
                  </div>
                  <input type="file" accept="image/*,video/*" multiple onChange={handleMediaUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Product Description</label>
                <textarea rows={4} value={newProd.description} onChange={e => setNewProd({...newProd, description: e.target.value})} placeholder="Describe the product specifics (used in meta tags/search)..." style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '0.95rem', resize: 'vertical' }}></textarea>
              </div>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Colors Variant System</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', marginBottom: '8px' }}>
                    <input type="text" value={tmpColorName} onChange={e => setTmpColorName(e.target.value)} placeholder="Name (e.g. Navy Blue)" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
                    <input type="color" value={tmpColorHex} onChange={e => setTmpColorHex(e.target.value)} style={{ padding: '0', border: 'none', width: '38px', height: '38px', borderRadius: '4px', cursor: 'pointer' }} />
                    <button type="button" onClick={() => { if(tmpColorName) setNewProd({...newProd, colors: [...(newProd.colors||[]), {name: tmpColorName, hex: tmpColorHex}]}); setTmpColorName(''); }} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', padding: '0 12px', cursor: 'pointer' }}>Add</button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {newProd.colors?.map((c, i) => (
                      <span key={i} style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: c.hex }}></div>
                        {c.name}
                        <button type="button" onClick={() => setNewProd({...newProd, colors: newProd.colors.filter((_, idx)=>idx!==i)})} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: '4px' }}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: '300px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Sizes & Dimensions</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr auto', gap: '8px', marginBottom: '8px' }}>
                    <input type="text" value={tmpSizeName} onChange={e => setTmpSizeName(e.target.value)} placeholder="Size (e.g. King)" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
                    <input type="text" value={tmpSizeDim} onChange={e => setTmpSizeDim(e.target.value)} placeholder="Dim (e.g. 108x108 in)" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
                    <button type="button" onClick={() => { if(tmpSizeName && tmpSizeDim) setNewProd({...newProd, sizes: [...(newProd.sizes||[]), {name: tmpSizeName, dimensions: tmpSizeDim}]}); setTmpSizeName(''); setTmpSizeDim(''); }} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', padding: '0 12px', cursor: 'pointer' }}>Add</button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {newProd.sizes?.map((s, i) => (
                      <span key={i} style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <b>{s.name}:</b> {s.dimensions}
                        <button type="button" onClick={() => setNewProd({...newProd, sizes: newProd.sizes.filter((_, idx)=>idx!==i)})} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: '4px' }}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Accordion Details (Product Details Panel)</label>
                <textarea rows={3} value={newProd.productDetails || ''} onChange={e => setNewProd({...newProd, productDetails: e.target.value})} placeholder="Detailed marketing copy for the Product Details accordion dropdown..." style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '0.95rem', resize: 'vertical' }}></textarea>
              </div>
              <button type="submit" style={{ background: '#2563eb', color: '#fff', padding: '14px', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', border: 'none', cursor: 'pointer', marginTop: '10px' }}>
                {newProd._id || newProd.id ? 'Save Product Changes' : 'Publish to Storefront'}
              </button>
            </form>
          </div>
        )}

        {/* Manage Products Content */}
        {activeTab === 'manageProducts' && (
          <div style={{ padding: '32px', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
            <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Manage Inventory Directory</h2>
              </div>
              <p style={{ color: '#64748b', marginBottom: '32px' }}>Review the active storefront inventory and selectively delete outdated product lines instantly syncing off the global mapping engine.</p>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Preview</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Title</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Category</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Price</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, idx) => (
                      <tr key={product._id || product.id} style={{ borderTop: idx !== 0 ? '1px solid #e2e8f0' : 'none', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '16px 24px' }}>
                          <img src={product.images?.[0] || 'https://via.placeholder.com/300'} alt={product.title} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} />
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '0.95rem', color: '#0f172a', fontWeight: 500 }}>{product.title}</td>
                        <td style={{ padding: '16px 24px', fontSize: '0.95rem', color: '#64748b' }}>{product.category}</td>
                        <td style={{ padding: '16px 24px', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>₹{product.price || product.currentPrice}</td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setNewProd({...product, images: product.images || [], colors: product.colors || [], sizes: product.sizes || [], productDetails: product.productDetails || ''}); setActiveTab('addProduct'); }} style={{ background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, transition: 'background 0.2s' }}>
                              <Edit size={16} /> Edit
                            </button>
                            <button onClick={() => { if(confirm('Permanently delete this product from the global database?')) removeProduct(product._id || product.id); }} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, transition: 'background 0.2s' }}>
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Customer Messages Content */}
        {activeTab === 'messages' && (
          <div style={{ padding: '32px', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
            <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Customer Inbox</h2>
              </div>
              <p style={{ color: '#64748b', marginBottom: '32px' }}>Review and manage queries sent via the Contact form.</p>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>From</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Message</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages && messages.length > 0 ? messages.map((msg, idx) => (
                      <tr key={msg.id} style={{ borderTop: idx !== 0 ? '1px solid #e2e8f0' : 'none', background: msg.status === 'unread' ? '#eff6ff' : '#fff', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ 
                            background: msg.status === 'unread' ? '#bfdbfe' : '#e2e8f0', 
                            color: msg.status === 'unread' ? '#1e40af' : '#475569', 
                            padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 
                          }}>
                            {msg.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '0.95rem', color: '#0f172a', fontWeight: 600 }}>
                          {msg.name}<br/>
                          <a href={`mailto:${msg.email}`} style={{fontSize: '0.8rem', color: '#3b82f6', fontWeight: 500}}>{msg.email}</a>
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: '#475569', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {msg.text}
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b' }}>
                          {new Date(msg.date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {msg.status === 'unread' && (
                              <button onClick={() => markAsRead(msg.id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Mark Read</button>
                            )}
                            <button onClick={() => { if(confirm('Delete message?')) deleteMessage(msg.id); }} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No messages found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Coupons Content */}
        {activeTab === 'coupons' && (
          <div style={{ padding: '32px', maxWidth: '800px', width: '100%' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Promo & Coupons Configuration</h2>
            <p style={{ color: '#64748b', marginBottom: '32px' }}>Generate discount codes to drive promotional campaigns and influencer sales.</p>
            <form onSubmit={handleCreateCoupon} style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Coupon Code</label>
                <input type="text" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})} placeholder="e.g. SUMMER50" style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '0.95rem', textTransform: 'uppercase' }} />
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Discount Percentage (%)</label>
                  <input type="number" value={newCoupon.discount} onChange={e => setNewCoupon({...newCoupon, discount: e.target.value})} placeholder="15" max="100" style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Maximum Uses</label>
                  <input type="number" value={newCoupon.maxUses} onChange={e => setNewCoupon({...newCoupon, maxUses: e.target.value})} placeholder="1000" style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }} />
                </div>
              </div>
              <button type="submit" style={{ background: '#10b981', color: '#fff', padding: '14px', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', border: 'none', cursor: 'pointer', marginTop: '10px' }}>
                Generate Active Coupon
              </button>
            </form>
          </div>
        )}

        {/* Settings Content */}
        {activeTab === 'settings' && (
          <div style={{ padding: '32px', maxWidth: '800px', width: '100%' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Storefront Global Settings</h2>
            <p style={{ color: '#64748b', marginBottom: '32px' }}>Update platform variables overriding hardcoded application limits.</p>
            <form style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Site Name</label>
                <input type="text" defaultValue="KH Decotis" style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Contact Email Dispatch</label>
                <input type="email" defaultValue="support@khdecotis.com" style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Header Announcement Banner Text</label>
                <input type="text" defaultValue="Free Shipping on All Orders Over ₹999" style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }} />
              </div>
              <button type="button" onClick={(e) => { e.preventDefault(); alert('Global platform settings updated.'); }} style={{ background: '#0f172a', color: '#fff', padding: '14px', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', border: 'none', cursor: 'pointer', marginTop: '10px' }}>
                Save Configurations
              </button>
            </form>
          </div>
        )}

        {/* Other Tabs Fallback */}
        {!['dashboard', 'addProduct', 'manageProducts', 'messages', 'coupons', 'settings'].includes(activeTab) && (
          <div style={{ padding: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center', color: '#64748b' }}>
              <PackageOpen size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module Offline</h2>
              <p>This section is currently awaiting database propagation.</p>
            </div>
          </div>
        )}
        {selectedOrder && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: '600px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden', animation: 'slideUp 0.3s ease-out' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Order Details: {selectedOrder.id}</h3>
                <button onClick={() => setSelectedOrder(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} color="#64748b" /></button>
              </div>
              <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Customer</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#0f172a' }}>{selectedOrder.name}</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>{selectedOrder.email || 'customer@example.com'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Fulfillment Status</span>
                    <div style={{ marginTop: '4px' }}>
                      <span style={{ background: selectedOrder.color, color: selectedOrder.text, padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>{selectedOrder.status}</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Date</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 500, color: '#0f172a' }}>{selectedOrder.date}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Amount</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>{selectedOrder.total}</p>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>Ordered Items ({selectedOrder.items || 1})</h4>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '60px', background: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingBag color="#94a3b8" /></div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>Products from Checkout Map</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Tracking ID: TRK-{Math.floor(1000 + Math.random() * 9000)}-{selectedOrder.id.replace('#','')}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ padding: '24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setSelectedOrder(null)} style={{ padding: '10px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>Close Modal</button>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Inline styles for basic responsiveness lacking global module map */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 1024px) {
          .charts-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .admin-sidebar { display: none !important; }
          .admin-main { margin-left: 0 !important; }
        }
      `}} />
    </div>
  );
}
