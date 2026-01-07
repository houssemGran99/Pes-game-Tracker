import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
    const { login, loginGuest } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Please fill in all fields');
            return;
        }

        const success = await login(username, password);
        if (!success) {
            setError('Invalid username or password');
        }
    };

    return (
        <div className="login-screen animate-fade-in" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            maxWidth: '400px',
            margin: '0 auto',
            padding: '2rem'
        }}>
            <div className="home-logo" style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚽</div>
            <h1 className="title" style={{ marginBottom: '2rem', textAlign: 'center' }}>PES 6 Tracker</h1>

            <form onSubmit={handleSubmit} className="card" style={{ width: '100%', gap: '1rem', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Admin Login</h2>

                {error && (
                    <div style={{
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        textAlign: 'center',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="form-input"
                        placeholder="Enter username"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                    />
                </div>

                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="form-input"
                        placeholder="Enter password"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '1rem' }}
                >
                    Login as Admin
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                </div>

                <button
                    type="button"
                    onClick={loginGuest}
                    className="btn"
                    style={{
                        width: '100%',
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #e2e8f0'
                    }}
                >
                    Continue as Guest
                </button>
            </form>
        </div>
    );
}
