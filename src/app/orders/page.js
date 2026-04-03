'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Package, ChevronRight, Clock, CheckCircle2, XCircle, Printer, X, Truck, MapPin, RefreshCw, Search } from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const [filter, setFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { orders } = useOrders();
  const router = useRouter();

  const fetchTracking = useCallback(async (orderId) => {
    setTrackingLoading(true);
    setTrackingData(null);
    setTrackingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/track`);
      const data = await res.json();
      setTrackingData(data);
    } catch (err) {
      console.error('Tracking fetch error:', err);
      setTrackingData({ success: false, error: 'Unable to reach tracking service.' });
    } finally {
      setTrackingLoading(false);
    }
  }, []);

  // Filter orders by search query (email or order ID) and status
  const matchesSearch = (order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (order.id && order.id.toLowerCase().includes(q)) ||
      (order.email && order.email.toLowerCase().includes(q)) ||
      (order.name && order.name.toLowerCase().includes(q))
    );
  };

  const filteredOrders = orders
    .filter(matchesSearch)
    .filter(o => filter === 'All' ? true : o.status === filter);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Completed':
      case 'Delivered': return <CheckCircle2 size={16} />;
      case 'Cancelled': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const closeTracking = () => {
    setTrackingData(null);
    setTrackingOrderId(null);
  };

  return (
    <>
      <div className="container animate-fade-in" style={{ padding: '4rem 2rem', minHeight: '80vh', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Outfit, sans-serif' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>Order History</h1>
        <p style={{ color: '#64748b', fontSize: '1.05rem', margin: 0 }}>Track, manage, and review your recent purchases.</p>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '12px', 
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', 
          padding: '12px 16px', transition: 'border-color 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <Search size={20} color="#94a3b8" />
          <input 
            type="text"
            placeholder="Search by order ID, email, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              flex: 1, border: 'none', outline: 'none', fontSize: '1rem', 
              color: '#0f172a', background: 'transparent', fontFamily: 'inherit'
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
            >
              <X size={18} />
            </button>
          )}
        </div>
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
                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>Placed on {order.date} {order.name ? `· ${order.name}` : ''}</p>
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

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {['Pending', 'Shipped'].includes(order.status) && (
                  <button 
                    onClick={() => fetchTracking(order.id)}
                    style={{ 
                      padding: '12px 24px', 
                      background: '#0f172a', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: '8px', 
                      cursor: 'pointer', 
                      fontWeight: 600, 
                      fontSize: '0.95rem',
                      transition: 'background 0.2s',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Truck size={18} /> Track Order
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

            {/* Tracking Panel — shown inline when tracking is requested for this order */}
            {trackingOrderId === order.id && (
              <div style={{ 
                padding: '0 24px 24px', 
                borderTop: '1px solid #e2e8f0',
                animation: 'fadeIn 0.3s ease'
              }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%)', 
                  borderRadius: '12px', 
                  padding: '24px',
                  marginTop: '16px',
                  border: '1px solid #e0f2fe'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={18} color="#0ea5e9" /> Shipment Tracking
                    </h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => fetchTracking(order.id)}
                        disabled={trackingLoading}
                        style={{ 
                          background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', 
                          padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                          gap: '4px', fontSize: '0.8rem', fontWeight: 600, color: '#475569',
                          opacity: trackingLoading ? 0.5 : 1
                        }}
                      >
                        <RefreshCw size={14} style={{ animation: trackingLoading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
                      </button>
                      <button 
                        onClick={closeTracking}
                        style={{ 
                          background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', 
                          padding: '6px 8px', cursor: 'pointer', color: '#64748b'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {trackingLoading ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      <div style={{ 
                        width: '32px', height: '32px', border: '3px solid #e2e8f0', 
                        borderTopColor: '#0ea5e9', borderRadius: '50%', margin: '0 auto 12px',
                        animation: 'spin 0.8s linear infinite'
                      }} />
                      Fetching tracking details...
                    </div>
                  ) : trackingData ? (
                    <div>
                      {/* Tracking Info Grid */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                        gap: '16px',
                        marginBottom: trackingData.activities?.length > 0 ? '20px' : 0
                      }}>
                        <div style={{ background: '#fff', borderRadius: '10px', padding: '16px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 600 }}>AWB Number</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', wordBreak: 'break-all' }}>
                            {trackingData.awbCode || '—'}
                          </div>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '10px', padding: '16px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 600 }}>Courier</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                            {trackingData.courierName || '—'}
                          </div>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '10px', padding: '16px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 600 }}>Status</div>
                          <div style={{ 
                            fontSize: '0.9rem', fontWeight: 700,
                            color: trackingData.trackingStatus === 'Delivered' ? '#16a34a' 
                                 : trackingData.trackingStatus === 'pending_sync' ? '#d97706'
                                 : '#0ea5e9'
                          }}>
                            {formatTrackingStatus(trackingData.trackingStatus)}
                          </div>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '10px', padding: '16px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 600 }}>Expected Delivery</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                            {trackingData.expectedDelivery || 'Calculating...'}
                          </div>
                        </div>
                      </div>

                      {/* No AWB message */}
                      {!trackingData.awbCode && trackingData.message && (
                        <div style={{ 
                          display: 'flex', alignItems: 'center', gap: '12px', 
                          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', 
                          padding: '16px', marginTop: '12px'
                        }}>
                          <Clock size={20} color="#d97706" />
                          <div>
                            <div style={{ fontWeight: 600, color: '#92400e', fontSize: '0.9rem' }}>Shipment Being Arranged</div>
                            <div style={{ color: '#a16207', fontSize: '0.85rem', marginTop: '2px' }}>{trackingData.message}</div>
                          </div>
                        </div>
                      )}

                      {/* Activity Timeline */}
                      {trackingData.activities && trackingData.activities.length > 0 && (
                        <div>
                          <h5 style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Activity</h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {trackingData.activities.map((activity, idx) => (
                              <div key={idx} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '20px' }}>
                                  <div style={{ 
                                    width: '10px', height: '10px', borderRadius: '50%', 
                                    background: idx === 0 ? '#0ea5e9' : '#cbd5e1', 
                                    flexShrink: 0, marginTop: '5px'
                                  }} />
                                  {idx < trackingData.activities.length - 1 && (
                                    <div style={{ width: '2px', background: '#e2e8f0', flex: 1, minHeight: '24px' }} />
                                  )}
                                </div>
                                <div style={{ paddingBottom: '16px' }}>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{activity.activity || activity.status}</div>
                                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                                    {activity.location && <span>{activity.location} · </span>}
                                    {activity.date}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: '6rem 2rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Package size={36} color="#94a3b8" />
            </div>
            <h3 style={{ fontSize: '1.35rem', color: '#0f172a', margin: '0 0 8px 0', fontWeight: 800 }}>No Orders Found</h3>
            <p style={{ color: '#64748b', fontSize: '1rem', margin: '0 0 24px 0' }}>
              {searchQuery ? `No orders match "${searchQuery}".` : `It looks like there are no ${filter !== 'All' ? filter.toLowerCase() : ''} orders yet.`}
            </p>
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
                <p style={{ margin: 0, color: '#475569' }}>{selectedOrder.name}<br/>{selectedOrder.email}</p>
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

      {/* Inline CSS for animations */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

/** Format tracking status for display */
function formatTrackingStatus(status) {
  if (!status) return 'Unknown';
  const statusMap = {
    'pending_sync': 'Awaiting Shipment',
    'pending': 'Awaiting Shipment',
    'processing': 'Processing',
    'assigned': 'Courier Assigned',
    'picked_up': 'Picked Up',
    'in_transit': 'In Transit',
    'out_for_delivery': 'Out for Delivery',
    'delivered': 'Delivered',
    'rto': 'Return to Origin',
  };
  return statusMap[status.toLowerCase()] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
