'use client';
import { Wallet, ArrowDownLeft, ArrowUpRight, Clock, Plus } from 'lucide-react';
import Link from 'next/link';

export default function WalletPage() {
  const transactions = [
    { id: 'TXN-9824', type: 'credit', amount: 500, date: '2023-11-15', title: 'Refund for Order #1002', status: 'Completed' },
    { id: 'TXN-8812', type: 'debit', amount: 1250, date: '2023-10-22', title: 'Purchase applied to Order #994', status: 'Completed' },
    { id: 'TXN-7431', type: 'credit', amount: 2000, date: '2023-09-05', title: 'Loyalty Bonus Credit', status: 'Completed' }
  ];

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 2rem', minHeight: '80vh', maxWidth: '800px', margin: '0 auto', fontFamily: 'Outfit, sans-serif' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>Khdecotis Wallet</h1>
        <p style={{ color: '#64748b', fontSize: '1.05rem', margin: 0 }}>Manage your store credits, refunds, and loyalty bonuses.</p>
      </div>

      <div style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', 
        borderRadius: '24px', 
        padding: '32px', 
        color: '#fff',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '32px'
      }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
          <Wallet size={200} />
        </div>
        
        <p style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available Balance</p>
        <h2 style={{ margin: '0 0 24px 0', fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>₹1,250.00</h2>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <button style={{ 
            background: '#fff', 
            color: '#0f172a', 
            border: 'none', 
            padding: '12px 24px', 
            borderRadius: '12px', 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            fontFamily: 'inherit'
          }}>
            <Plus size={18} /> Add Money
          </button>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Recent Transactions</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {transactions.map(txn => (
            <div key={txn.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '20px', 
              background: '#fff', 
              borderRadius: '16px', 
              border: '1px solid #e2e8f0',
              transition: 'transform 0.2s',
              cursor: 'default'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  background: txn.type === 'credit' ? '#dcfce7' : '#fef2f2', 
                  color: txn.type === 'credit' ? '#16a34a' : '#ef4444',
                  padding: '12px',
                  borderRadius: '12px'
                }}>
                  {txn.type === 'credit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 600, color: '#0f172a' }}>{txn.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {txn.date} &bull; {txn.id}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                  display: 'block', 
                  fontSize: '1.1rem', 
                  fontWeight: 800, 
                  color: txn.type === 'credit' ? '#16a34a' : '#0f172a'
                }}>
                  {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{txn.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
