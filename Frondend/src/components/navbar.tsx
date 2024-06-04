import { NavLink } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Token } from "../types/token";

export default function Navbar() {
  const token = sessionStorage.getItem("Access_token");
  if (!token) {
    return null;
  }
  else {
    const decodedToken: Token = jwtDecode(token);
    const role = decodedToken!.role;
    return (
      <nav className="bg-primary-purple sticky top-0">
        <div className="max-w-7xl px-2">
          <div className="relative flex items-center justify-between h-16">
            <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
              <div className="flex-shrink-0 flex items-center">
                <NavLink
                  to="/"
                  className="text-white hover:bg-primary-purple-dark hover:text-white px-3 py-2 rounded-md"
                >
                  <p>InfralabConnect</p>
                </NavLink>
              </div>
              <div className="hidden sm:block md:ml-10">
                <div className="flex space-x-4">
                  {role === "teacher" && (
                    <NavLink
                      to="/teachers"
                      className={({ isActive }) =>
                        `text-white hover:bg-primary-purple-dark hover:text-white px-3 py-2 rounded-md ${isActive ? "bg-primary-purple-dark text-white" : ""}`
                      }
                    >
                      Teachers List
                    </NavLink>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }
}
