'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ChevronRight, Clock, CheckCircle2, XCircle, Printer, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useOrders } from '@/context/OrderContext';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const [filter, setFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { user, isMounted } = useAuth();
  const { orders } = useOrders();
  const router = useRouter();

  useEffect(() => {
    if (isMounted && !user) {
       router.push('/account?redirect=/orders');
    }
  }, [user, isMounted, router]);

  if (!isMounted || !user) return null;

  const userOrders = orders.filter(o => o.email === user.email);
  const filteredOrders = userOrders.filter(o => filter === 'All' ? true : o.status === filter);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Completed':
      case 'Delivered': return <CheckCircle2 size={16} />;
      case 'Cancelled': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <>
      <div className="container animate-fade-in" style={{ padding: '4rem 2rem', minHeight: '80vh', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Outfit, sans-serif' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>Order History</h1>
        <p style={{ color: '#64748b', fontSize: '1.05rem', margin: 0 }}>Track, manage, and review your recent purchases natively.</p>
      </div>
      
      {/* Modern Tabs */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '32px', borderBottom: '2px solid #e2e8f0' }}>
        {['All', 'Pending', 'Shipped', 'Delivered', 'Cancelled'].map(f => {
          const isActive = filter === f;
          return (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              style={{ 
                padding: '12px 4px', 
                background: 'transparent',
                border: 'none',
                color: isActive ? '#0f172a' : '#64748b', 
                cursor: 'pointer', 
                fontWeight: isActive ? 700 : 500, 
                fontSize: '1rem',
                borderBottom: isActive ? '2px solid #0f172a' : '2px solid transparent',
                marginBottom: '-2px',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit'
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {filteredOrders.length > 0 ? filteredOrders.map(order => (
          <div key={order.id} style={{ 
            border: '1px solid #e2e8f0', 
            borderRadius: '16px', 
            background: '#fff', 
            boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}>
            {/* Header Area */}
            <div style={{ 
              padding: '16px 24px', 
              background: '#f8fafc', 
              borderBottom: '1px solid #e2e8f0',
              display: 'flex', 
              flexWrap: 'wrap',
              gap: '16px',
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: '#fff', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#0f172a' }}>
                  <Package size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Order {order.id}</h3>
                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>Placed on {order.date}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{order.total}</p>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  color: order.status === 'Completed' || order.status === 'Delivered' ? '#16a34a' 
                       : order.status === 'Cancelled' ? '#ef4444' 
                       : '#d97706',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  marginTop: '4px'
                }}>
                  {getStatusIcon(order.status)}
                  {order.status}
                </div>
              </div>
            </div>

            {/* Body Payload Visualizer */}
            <div style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {order.payload && Array.isArray(order.payload) ? (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {order.payload.slice(0, 3).map((item, idx) => (
                        <div key={idx} style={{ width: '72px', height: '72px', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', background: '#f8fafc' }}>
                          <img src={item.images?.[0] || item.image || 'https://via.placeholder.com/150'} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                      {order.payload.length > 3 && (
                        <div style={{ width: '72px', height: '72px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 700, fontSize: '1rem' }}>
                          +{order.payload.length - 3}
                        </div>
                      )}
                    </div>
                    <span style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 500, marginLeft: '4px' }}>
                      {order.items} Item{order.items !== 1 && 's'} Included
                    </span>
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '0.95rem' }}>
                    <span style={{fontWeight: 600, color: '#334155'}}>{order.items} Items</span> historically processed without payload mapping.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                {['Pending', 'Shipped'].includes(order.status) && (
                  <button style={{ 
                    padding: '12px 24px', 
                    background: '#0f172a', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontWeight: 600, 
                    fontSize: '0.95rem',
                    transition: 'background 0.2s',
                    fontFamily: 'inherit'
                  }}>
                    Track Route
                  </button>
                )}
                <button onClick={() => setSelectedOrder(order)} style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 24px', 
                  background: '#fff', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontWeight: 600, 
                  color: '#334155', 
                  fontSize: '0.95rem',
                  transition: 'background 0.2s, border-color 0.2s',
                  fontFamily: 'inherit'
                }}>
                  View Invoice <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: '6rem 2rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Package size={36} color="#94a3b8" />
            </div>
            <h3 style={{ fontSize: '1.35rem', color: '#0f172a', margin: '0 0 8px 0', fontWeight: 800 }}>No Orders Found</h3>
            <p style={{ color: '#64748b', fontSize: '1rem', margin: '0 0 24px 0' }}>It looks like you haven't placed any {filter !== 'All' ? filter.toLowerCase() : ''} orders yet.</p>
            <Link href="/shop">
              <button style={{ padding: '14px 32px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                Start Shopping Now
              </button>
            </Link>
          </div>
        )}
      </div>

      </div>

      {/* Invoice Modal */}
      {selectedOrder && (
        <>
          <div 
            onClick={() => setSelectedOrder(null)}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9998, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}
          />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, background: '#fff', borderRadius: '16px', maxWidth: '600px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <button onClick={() => setSelectedOrder(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
            
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', margin: '0 0 8px 0', color: '#0f172a' }}>Invoice</h2>
              <p style={{ color: '#64748b', margin: 0 }}>Order #{selectedOrder.id}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', fontSize: '0.9rem' }}>
              <div>
                <strong style={{ display: 'block', color: '#0f172a', marginBottom: '4px' }}>Billed To:</strong>
                <p style={{ margin: 0, color: '#475569' }}>{user.name || selectedOrder.name}<br/>{user.email || selectedOrder.email}<br/>Vadodara, Gujarat</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ display: 'block', color: '#0f172a', marginBottom: '4px' }}>Order Date:</strong>
                <p style={{ margin: 0, color: '#475569' }}>{selectedOrder.date}</p>
                <div style={{ marginTop: '12px', display: 'inline-block', background: selectedOrder.status === 'Completed' || selectedOrder.status === 'Delivered' ? '#dcfce7' : '#f1f5f9', color: selectedOrder.status === 'Completed' || selectedOrder.status === 'Delivered' ? '#16a34a' : '#475569', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{selectedOrder.status}</div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#0f172a', fontSize: '0.9rem', width: '60%' }}>Item Description</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#0f172a', fontSize: '0.9rem' }}>Qty</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#0f172a', fontSize: '0.9rem' }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.payload ? selectedOrder.payload.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px 12px', fontSize: '0.95rem', color: '#334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={item.images?.[0] || item.image || 'https://via.placeholder.com/50'} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                        <span>{item.title}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center', fontSize: '0.95rem', color: '#334155' }}>{item.cartQuantity || 1}</td>
                    <td style={{ padding: '16px 12px', textAlign: 'right', fontSize: '0.95rem', color: '#334155' }}>₹{item.price * (item.cartQuantity || 1)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" style={{ padding: '16px 12px', fontSize: '0.95rem', color: '#64748b', fontStyle: 'italic' }}>Historical legacy purchase (Items: {selectedOrder.items})</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: '250px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#475569', fontSize: '0.95rem' }}>
                  <span>Subtotal</span>
                  <span>{selectedOrder.total}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#475569', fontSize: '0.95rem' }}>
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', color: '#0f172a', fontSize: '1.25rem', fontWeight: 800 }}>
                  <span>Total</span>
                  <span>{selectedOrder.total}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
              <button onClick={() => window.print()} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}><Printer size={18} /> Print Invoice</button>
            </div>
          </div>
        </>
      )}

    </>
  );
}
