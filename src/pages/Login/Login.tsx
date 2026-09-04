import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";

// Assets
import logo from "../../assets/logos/scenario-logo-color.png";

// Hooks
import useFetch from "../../hooks/useFetch";

// Stores
import useAuthStore from "../../store/authStore";
import useUIStore from "../../store/uiStore";

// Types
import { FetchResponse } from "../../hooks/useFetch";

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_tipo: string;
  expira_en: string;
}

const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuthStore();
  const { openAlert } = useUIStore();
  const navigate = useNavigate();

  const { fetchData, loading: isFetching } = useFetch<FetchResponse<LoginResponse>>();

  const [formData, setFormData] = useState({
    correo: "",
    contrasena: "",
  });

  const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetchData({
        url: `${import.meta.env.VITE_API_URL}/auth/login`,
        method: "POST",
        body: {
          correo: formData.correo,
          contrasena: formData.contrasena,
        },
      });

      if (response.success && response.data?.access_token) {
        await login(response.data.access_token);
      } else {
        openAlert(response.message || "Credenciales incorrectas", "error");
      }
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);
      openAlert(error.message || "Ocurrió un error inesperado", "error");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/inicio");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="h-full flex items-center justify-center">
      <div className="card w-full max-w-sm shadow-lg bg-base-100">
        <form onSubmit={handleSubmit} className="card-body">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Scenario Logo" className="h-16" />
          </div>
          <h1 className="text-3xl font-bold text-center mb-4 text-primary">Comencemos</h1>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Usuario</span>
            </label>
            <input
              type="text"
              name="correo"
              value={formData.correo}
              onChange={handleFormChange}
              placeholder="usuario@prueba.com"
              className="input input-bordered w-full"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Contraseña</span>
            </label>
            <input
              type="password"
              name="contrasena"
              value={formData.contrasena}
              onChange={handleFormChange}
              placeholder="******"
              className="input input-bordered w-full"
              required
            />
            <label className="label">
              <a href="#" className="label-text-alt link link-hover">
                ¿Olvidaste tu contraseña?
              </a>
            </label>
          </div>

          <div className="form-control mt-6">
            <button
              type="submit"
              className={`btn btn-primary w-full`}
              disabled={isFetching}
            >
              {isFetching && <span className="loading loading-spinner"></span>}
              {isFetching ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

