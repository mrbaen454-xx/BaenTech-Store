import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../context/AuthContext";

function OAuthSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setSessionFromToken } = useAuth();

  useEffect(() => {
    const token = params.get("token");

    if (token) {
      setSessionFromToken(token);
      window.dispatchEvent(new Event("baentech-auth-changed"));
      navigate("/products", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [params, navigate, setSessionFromToken]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm dark:bg-slate-900">
        <p className="text-sm font-black text-slate-700 dark:text-slate-200">
          Memproses login Google...
        </p>
      </div>
    </div>
  );
}

export default OAuthSuccess;
