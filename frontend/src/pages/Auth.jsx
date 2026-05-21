import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Access Granted.', {
          style: { background: '#171717', color: '#00ff3f', border: '1px solid #00ff3f' }
        });
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('Registration successful. You may now log in.', {
          style: { background: '#171717', color: '#00f3ff', border: '1px solid #00f3ff' }
        });
        setIsLogin(true);
      }
    } catch (error) {
      toast.error(error.message, {
        style: { background: '#171717', color: '#ff003c', border: '1px solid #ff003c' }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-dark-800/80 backdrop-blur-xl border border-dark-700/50 rounded-2xl shadow-[0_0_40px_rgba(0,243,255,0.1)] p-8 relative z-10">
        
        <div className="flex flex-col items-center mb-10">
          <Shield className="w-16 h-16 text-neon-cyan drop-shadow-[0_0_15px_rgba(0,243,255,0.8)] mb-4" />
          <h1 className="text-3xl font-bold text-white tracking-widest text-center">
            SENTINEL<span className="text-neon-cyan">.AI</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm uppercase tracking-widest">
            {isLogin ? 'Authorized Personnel Only' : 'Register New Operative'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider ml-1">Secure Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-dark-900/50 border border-dark-600 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all placeholder:text-gray-600"
                placeholder="operative@sentinel.ai"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider ml-1">Encryption Key</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-dark-900/50 border border-dark-600 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all placeholder:text-gray-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/50 py-3 rounded-xl font-bold tracking-widest hover:bg-neon-cyan/20 hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? 'PROCESSING...' : (isLogin ? 'AUTHENTICATE' : 'INITIALIZE')}
            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-gray-500 hover:text-white transition-colors text-sm font-medium"
          >
            {isLogin ? "Don't have access? Register" : "Already registered? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
