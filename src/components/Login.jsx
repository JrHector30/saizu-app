import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                alert("Verifica tu correo para confirmar el registro.");
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                // redirect is automatic via AuthContext state change in App.jsx
            }
        } catch (error) {
            alert(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-container">
                <h1 className="login-title">ログイン - Login</h1>
                <p className="login-subtitle">Entra a tu armario personal.</p>
                
                <form className="login-form" onSubmit={handleAuth}>
                    <input 
                        type="email" 
                        placeholder="Correo electrónico" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="login-input"
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Contraseña" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="login-input"
                        required 
                    />
                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Cargando...' : (isSignUp ? 'Crear Perfil' : 'Ingresar')}
                    </button>
                </form>

                <button className="toggle-auth-btn" onClick={() => setIsSignUp(!isSignUp)}>
                    {isSignUp ? '¿Ya tienes un perfil? Inicia sesión' : '¿No tienes espacio guardado? Regístrate'}
                </button>
            </div>
        </div>
    );
};

export default Login;
