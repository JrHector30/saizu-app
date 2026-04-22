import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
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
            </div>

            <div className="login-container">
                <h1 className="login-title">ログイン — LOGIN</h1>

                <form className="login-form" onSubmit={handleAuth}>
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

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Cargando...' : (isSignUp ? 'Crear Perfil' : 'Ingresar')}
                    </button>
                </form>

                <button className="toggle-auth-btn" onClick={() => setIsSignUp(!isSignUp)}>
                    {isSignUp
                        ? '¿Ya tienes un perfil? Inicia sesión'
                        : '¿No tienes espacio guardado? Regístrate'}
                </button>
            </div>
        </div>
    );
};

export default Login;
