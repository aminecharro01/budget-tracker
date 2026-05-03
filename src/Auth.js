import { useState } from 'react';
import { supabase } from './supabaseClient';
import styles from './Auth.module.css';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMsg('Check your email for the login link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.error_description || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authWrap}>
      <div className={styles.authCard}>
        <div className={styles.logo}>₿</div>
        <h1 className={styles.title}>Budget Tracker</h1>
        
        {error && <div className={styles.error}>{error}</div>}
        {msg && <div className={styles.msg}>{msg}</div>}

        <form className={styles.form} onSubmit={handleAuth}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <div className={styles.switch}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button 
            type="button" 
            className={styles.switchBtn} 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setMsg('');
            }}
          >
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
