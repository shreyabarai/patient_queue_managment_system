import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Monitor, LogIn, LayoutDashboard } from "lucide-react";
import hospitalLogo from "@/assets/hospital-logo.png";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-card border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src={hospitalLogo} alt="Logo" className="h-8 w-auto" />
          <span className="font-bold text-foreground hidden sm:inline">
            Mahatme Eye Hospital
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant={isActive("/") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/")}
            className="gap-1.5"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Button>
          <Button
            variant={isActive("/display") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/display")}
            className="gap-1.5"
          >
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">Display</span>
          </Button>
          <Button
            variant={isActive("/staff") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/staff")}
            className="gap-1.5"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Staff</span>
          </Button>
          <Button
            variant={isActive("/auth") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/auth")}
            className="gap-1.5"
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Login</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
