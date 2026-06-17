import { Link } from "react-router";

import logo from "../assets/baentech-logo.png";

function BrandLogo({
  to = "/",
  onClick,
  dark = false,
  center = false,
  compact = false,
}) {
  const iconSize = compact ? "h-10 w-10" : "h-11 w-11";

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 ${center ? "justify-center" : ""}`}
    >
      <div
        className={`flex ${iconSize} shrink-0 items-center justify-center overflow-hidden rounded-2xl p-1 ${
          dark
            ? "bg-white/10 ring-1 ring-white/15"
            : "bg-blue-50 ring-1 ring-blue-100 dark:bg-blue-950/40 dark:ring-blue-900/50"
        }`}
      >
        <img
          src={logo}
          alt="BaenTech Store"
          className="h-full w-full object-contain"
        />
      </div>

      <div className="leading-tight">
        <p
          className={`text-base font-black ${
            dark ? "text-white" : "text-slate-950 dark:text-white"
          }`}
        >
          BaenTech
        </p>

        <p
          className={`-mt-0.5 text-xs font-black tracking-wide ${
            dark ? "text-blue-300" : "text-blue-600 dark:text-blue-400"
          }`}
        >
          Store
        </p>
      </div>
    </Link>
  );
}

export default BrandLogo;
