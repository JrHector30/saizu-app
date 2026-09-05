import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Eye, EyeOff } from 'lucide-react';

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
    </svg>
);

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [displayName, setDisplayName] = useState('');

    const handleGoogleAuth = async () => {
        setGoogleLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error) {
            alert(error.error_description || error.message);
            setGoogleLoading(false);
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;

                if (data?.user) {
                    await supabase.from('user_profiles').upsert({
                        owner_id: data.user.id,
                        profile_name: displayName.trim() || 'Sin Nombre',
                        saizu_id: `SAI-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
                    }, { onConflict: 'owner_id' });
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (error) {
            alert(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            {/* Efecto sol japonés — fondo decorativo */}
            <div className="login-sun-bg" aria-hidden="true">
                <div className="login-sun-circle" />
                {Array.from({ length: 18 }).map((_, i) => (
                    <div
                        key={i}
                        className="login-sun-ray"
                        style={{ transform: `rotate(${i * 20}deg)` }}
                    />
                ))}
            </div>

            <div className="login-container">
                <h1 className="login-title">ログイン — LOGIN</h1>

                {/* Botón Google OAuth */}
                <button
                    type="button"
                    className="login-google-btn"
                    onClick={handleGoogleAuth}
                    disabled={googleLoading || loading}
                >
                    <GoogleIcon />
                    <span>{googleLoading ? 'Conectando con Google...' : 'Continuar con Google'}</span>
                </button>

                {/* Divisor estético */}
                <div className="login-divider">
                    <span>o con correo</span>
                </div>

                <form className="login-form" onSubmit={handleAuth}>
                    {isSignUp && (
                        <input
                            type="text"
                            placeholder="Tu nombre"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="login-input"
                            maxLength={30}
                            required={isSignUp}
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="login-input"
                        required
                    />

                    <div className="login-password-wrapper">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="login-input"
                            required
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            className="login-eye-btn"
                            onClick={() => setShowPassword(prev => !prev)}
                            tabIndex={-1}
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <button type="submit" className="login-btn" disabled={loading || googleLoading}>
                        {loading ? 'Cargando...' : (isSignUp ? 'Crear Perfil' : 'Ingresar')}
                    </button>
                </form>

                <button className="toggle-auth-btn" onClick={() => {
                    setIsSignUp(!isSignUp);
                    setDisplayName('');
                }}>
                    {isSignUp
                        ? '¿Ya tienes un perfil? Inicia sesión'
                        : '¿No tienes una cuenta en Saizu? Regístrate'}
                </button>
            </div>
        </div>
    );
};

export default Login;
