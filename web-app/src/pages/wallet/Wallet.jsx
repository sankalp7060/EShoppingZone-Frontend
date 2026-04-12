import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    getWalletBalance, 
    getWalletStatements, 
    withdrawFromWallet,
    createRazorpayOrder,
    verifyRazorpayPayment,
    createWallet
} from '../../services/walletService';
import Layout from '../../components/layout/Layout';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Landmark, CreditCard, RefreshCw } from 'lucide-react';
import './Wallet.css';

const Wallet = () => {
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, amount: 0 });

    useEffect(() => {
        loadWalletData();
    }, []);

    const loadWalletData = async () => {
        setLoading(true);
        try {
            // Try balance first — if 404, auto-init wallet
            let balRes;
            try {
                balRes = await getWalletBalance();
                if (balRes.success) setBalance(balRes.data.currentBalance);
            } catch (balErr) {
                if (balErr.response?.status === 404) {
                    console.log('Wallet not found. Auto-initializing...');
                    try {
                        const createRes = await createWallet();
                        if (createRes.success) setBalance(0);
                    } catch (initErr) {
                        console.error('Failed to auto-initialize wallet');
                    }
                }
            }
            // Load statements independently
            try {
                const transRes = await getWalletStatements();
                if (transRes.success) setTransactions(transRes.data);
            } catch (_) {}
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (type) => {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) {
            setMessage({ type: 'error', text: 'Please enter a valid amount (at least ₹1)' });
            return;
        }

        if (type === 'withdraw' && val > balance) {
            setMessage({ type: 'error', text: '❌ Insufficient balance in your secure vault.' });
            return;
        }

        setProcessing(true);
        setMessage({ type: '', text: '' });

        try {
            if (type === 'add') {
                // Razorpay Step 1: Create Order on Backend
                const orderRes = await createRazorpayOrder(val);
                if (!orderRes.success) throw new Error(orderRes.message || 'Order creation failed');

                const { orderId, key } = orderRes.data;

                // Razorpay Step 2: Open Checkout UI
                const options = {
                    key: key,
                    amount: val * 100,
                    currency: "INR",
                    name: "EShoppingZone",
                    description: "Secure Wallet Top-up",
                    order_id: orderId,
                    handler: async (response) => {
                        try {
                            setProcessing(true);
                            // Razorpay Step 3: Verify Signature on Backend
                            const verifyRes = await verifyRazorpayPayment({
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpayOrderId: response.razorpay_order_id,
                                razorpaySignature: response.razorpay_signature,
                                amount: val
                            });

                            if (verifyRes.success) {
                                setMessage({ type: 'success', text: `✅ Successfully deposited ₹${val.toLocaleString()} via Razorpay!` });
                                setAmount('');
                                setBalance(verifyRes.data.newBalance);
                                loadWalletData(); // Refresh history
                            } else {
                                setMessage({ type: 'error', text: `❌ ${verifyRes.message || 'Payment verification failed.'}` });
                            }
                        } catch (err) {
                            console.error('Final verification failed:', err);
                            const errMsg = err.response?.data?.message || 'Error verifying payment. Please contact support.';
                            setMessage({ type: 'error', text: `❌ ${errMsg}` });
                        } finally {
                            setProcessing(false);
                        }
                    },
                    prefill: {
                        name: user?.fullName,
                        email: user?.email
                    },
                    theme: { color: "#ff6e40" },
                    modal: { ondismiss: () => setProcessing(false) }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            } else {
                // Withdrawal Flow — open custom confirm modal
                setConfirmModal({ isOpen: true, amount: val });
            }
        } catch (error) {
            console.error('Wallet Action Error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'A secure communication error occurred.';
            setMessage({ type: 'error', text: `❌ ${errorMsg}` });
            setProcessing(false);
        }
    };

    const executeWithdrawal = async (val) => {
        setProcessing(true);
        setConfirmModal({ isOpen: false, amount: 0 });
        try {
            const res = await withdrawFromWallet(val);
            if (res.success) {
                setBalance(res.data.newBalance ?? res.data.balance);
                setAmount('');
                setMessage({ type: 'success', text: `✅ Successfully withdrawn ₹${val.toLocaleString()}!` });
                loadWalletData();
            } else {
                setMessage({ type: 'error', text: res.message || 'Withdrawal failed' });
            }
        } catch (error) {
            console.error('Wallet Action Error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'A secure communication error occurred.';
            setMessage({ type: 'error', text: `❌ ${errorMsg}` });
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <Layout><div className="loading">Syncing Secure Vault...</div></Layout>;

    return (
        <Layout>
            <div className="wallet-container">
                <header className="wallet-header">
                    <div className="badge-premium">Financial Security</div>
                    <h1>Premium E-Wallet</h1>
                    <p>Experience seamless transactions across the EShoppingZone ecosystem</p>
                </header>

                <div className="wallet-grid">
                    <div className="wallet-main">
                        <div className="balance-card">
                            <div className="balance-info">
                                <span className="label">Available Funds</span>
                                <span className="value">₹{(balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="card-decoration">
                                <span className="chip"></span>
                                <span className="brand">Platinum Preferred</span>
                            </div>
                        </div>

                        <div className="wallet-ops">
                            <div className="op-card">
                                <h3>Manage Funds</h3>
                                <div className="input-group">
                                    <span className="currency">₹</span>
                                    <input 
                                        type="number" 
                                        placeholder="0.00" 
                                        value={amount} 
                                        onChange={(e) => setAmount(e.target.value)}
                                        disabled={processing}
                                    />
                                </div>
                                <div className="quick-amounts">
                                    {[500, 1000, 2000, 5000].map(amt => (
                                        <button 
                                            key={amt} 
                                            type="button" 
                                            onClick={() => setAmount(amt.toString())}
                                        >
                                            +₹{amt}
                                        </button>
                                    ))}
                                </div>
                                <div className="op-actions">
                                    <button 
                                        className="op-btn add-btn" 
                                        onClick={() => handleAction('add')} 
                                        disabled={processing}
                                    >
                                        <ArrowUpRight size={18} />
                                        Add Money
                                    </button>
                                    <button 
                                        className="op-btn withdraw-btn" 
                                        style={{ marginTop: '12px' }}
                                        onClick={() => handleAction('withdraw')} 
                                        disabled={processing}
                                    >
                                        <ArrowDownLeft size={18} />
                                        Withdrawal
                                    </button>
                                </div>
                                {message.text && (
                                    <div className={`message ${message.type}`}>
                                        {message.text}
                                    </div>
                                )}
                            </div>

                            <div className="benefits-card op-card">
                                <h3>Wallet Benefits</h3>
                                <ul className="benefits-list">
                                    <li>🛡️ Bank-Grade AES Encryption</li>
                                    <li>⚡ 1-Click Order Fulfillment</li>
                                    <li>🎁 5% Cashback on First Deposit</li>
                                    <li>✨ Instant Refund Processing</li>
                                    <li>📞 24/7 Priority Support</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <aside className="transaction-history">
                        <div className="history-header">
                            <h3>Transaction Statements</h3>
                            <button className="refresh-btn" onClick={loadWalletData}><RefreshCw size={14} /></button>
                        </div>
                        <div className="transaction-list">
                            {transactions.length === 0 ? (
                                <div className="empty-state">
                                    <Landmark size={48} className="empty-icon" />
                                    <p>No transactions found</p>
                                </div>
                            ) : (
                                transactions.slice().reverse().map((t) => (
                                    <div key={t.id} className="transaction-item">
                                        <div className={`transaction-icon ${t.transactionType?.toLowerCase() || ''}`}>
                                            {t.transactionType === 'CREDIT' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                                        </div>
                                        <div className="transaction-info">
                                            <p className="description">{t.transactionRemarks || (t.transactionType === 'CREDIT' ? 'Wallet Top-up' : 'Purchase Settle')}</p>
                                            <div className="meta-row">
                                                <span className="date">{t.transactionDate ? new Date(t.transactionDate).toLocaleDateString(undefined, {
                                                    month: 'short', day: 'numeric', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                }) : 'Date N/A'}</span>
                                                <span className="after-balance">Balance: ₹{t.balanceAfterTransaction?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className={`transaction-amount ${t.transactionType?.toLowerCase() || ''}`}>
                                            {t.transactionType === 'DEBIT' ? '-' : '+'}₹{(t.amount || 0).toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </aside>
                </div>
            </div>

            {/* Custom Confirm Modal */}
            {confirmModal.isOpen && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal">
                        <div className="modal-icon">
                            <ArrowDownLeft size={32} />
                        </div>
                        <h3>Confirm Withdrawal</h3>
                        <p>Withdraw <strong>₹{confirmModal.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> from your wallet?</p>
                        <p className="modal-subtext">The amount will be immediately deducted from your secure vault.</p>
                        <div className="modal-actions">
                            <button 
                                className="modal-btn cancel" 
                                onClick={() => { setConfirmModal({ isOpen: false, amount: 0 }); setProcessing(false); }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="modal-btn confirm" 
                                onClick={() => executeWithdrawal(confirmModal.amount)}
                            >
                                Confirm Withdraw
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Wallet;
