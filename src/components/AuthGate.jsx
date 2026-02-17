import React, { useState } from 'react';
import { LogIn, UserPlus, Eye, EyeOff, Loader2 } from 'lucide-react';

// Écran d'authentification affiché devant chaque outil protégé
// Props : onAuth(user) appelé après connexion réussie
//         signIn / signUp / appName
export default function AuthGate({ signIn, signUp, appName = 'HORIZON' }) {
  const [mode, setMode]         = useState('login'); // 'login' | 'signup'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);

    const { error } =
      mode === 'login'
        ? await signIn(email, password)
        : await signUp(email, password, fullName);

    setLoading(false);

    if (error) {
      setError(error.message.includes('Invalid login')
        ? 'Email ou mot de passe incorrect.'
        : error.message);
    } else if (mode === 'signup') {
      setSuccess('Compte créé ! Vérifiez vos emails pour confirmer votre inscription.');
    }
  };

  return (
    <div className="min-h-screen bg-[#003D5C] flex items-center justify-center p-4">
      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-[#003D5C] px-8 py-8 text-center">
          <img
            src="/logo-artelia.png"
            alt="Artelia"
            className="h-10 mx-auto mb-4 object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h1 className="text-2xl font-bold text-white">{appName}</h1>
          <p className="text-[#8BBCC8] text-sm mt-1">Hub de Pilotage Projet · Artelia</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {[['login', 'Connexion', LogIn], ['signup', 'Créer un compte', UserPlus]].map(([m, label, Icon]) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setSuccess(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors
                ${mode === m
                  ? 'text-[#009BA4] border-b-2 border-[#009BA4]'
                  : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handle} className="p-8 space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Nom complet
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Prénom Nom"
                required
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-[#009BA4] focus:outline-none transition-colors"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@artelia.fr"
              required
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-[#009BA4] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-sm focus:border-[#009BA4] focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
              {success}
            </div>
            
          )}
          

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#009BA4] hover:bg-[#007A82] text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />
            }
            {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 pb-6">
          Usage interne Artelia — accès réservé aux collaborateurs
        </p>
      </div>
    </div>
  );
}
