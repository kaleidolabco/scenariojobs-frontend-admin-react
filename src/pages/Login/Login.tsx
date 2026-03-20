import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";

// Assets
import logo from "../../assets/logos/scenario-logo-color.png";

// Stores
import useAuthStore from "../../store/authStore";
import useUIStore from "../../store/uiStore";

const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuthStore();
  const { openAlert } = useUIStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (
        formData.username === "usuario@prueba.com" &&
        formData.password === "123456"
      ) {
        const token =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub21icmVzIjoidXN1YXJpbyIsImFwZWxsaWRvcyI6InBydWViYSIsImZvdG9fZGVfcGVyZmlsIjoiIiwiY29ycmVvIjoidXN1YXJpb0BwcnVlYmEuY29tIiwicm9sIjoicGMiLCJleHAiOjE4Mzg1MTQ2ODB9.xpXiEWohnojdNORcZgaoca6TdFOS92GFt2DRYkuLm2E";
        login(token);
      } else {
        openAlert("Credenciales incorrectas", "error");
      }
    } catch (error) {
      console.error("Error al procesar el token:", error);
    } finally {
      setIsLoading(false);
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
              name="username"
              value={formData.username}
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
              name="password"
              value={formData.password}
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
              disabled={isLoading}
            >
              {isLoading && <span className="loading loading-spinner"></span>}
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

