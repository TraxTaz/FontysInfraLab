import { Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import useAuth from "../services/use-auth";
import { Token } from "../types/token";

const ProtectedRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
    const { accessToken } = useAuth();
    let decodedToken: Token = null;

    if (accessToken) {
        decodedToken = jwtDecode(accessToken);
    }

    if (
        !accessToken ||
        !decodedToken ||
        !allowedRoles.includes(decodedToken.role)
    ) {
        return <Navigate to="/" replace />;
    }

    return (
        <>
            <Outlet />
        </>
    );
};

export default ProtectedRoute;