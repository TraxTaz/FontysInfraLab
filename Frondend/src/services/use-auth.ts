import { useState, useEffect } from "react";
import { getRefreshToken } from "./auth-service";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const useAuth = () => {
    const [accessToken, setAccessToken] = useState<string>(
        sessionStorage.getItem("Access_token") || ""
    );
    const [refreshToken, setRefreshToken] = useState<string>(
        sessionStorage.getItem("Refresh_token") || ""
    );
    const navigate = useNavigate();

    useEffect(() => {
        const checkTokenExpiration = async () => {
            if (accessToken) {
                const decodedToken = jwtDecode(accessToken);
                const currentTime = Date.now() / 1000;
                if (decodedToken && decodedToken.exp !== undefined && decodedToken.exp < currentTime) {
                    try {
                        const response = await getRefreshToken(refreshToken);
                        if (response.status === 200) {
                            setAccessToken(response.data.accessToken);
                            sessionStorage.setItem("Access_token", response.data.accessToken);
                            setRefreshToken(response.data.refreshToken);
                            sessionStorage.setItem(
                                "Refresh_token",
                                response.data.refreshToken
                            );
                        } else {
                            if (response.status === 400 || response.status === 401)
                                navigate("/");
                        }
                    } catch (error) {
                        console.error("Error checking refresh token", error);
                        navigate("/");
                    }
                }
            }
        };

        checkTokenExpiration();
        const intervalId = setInterval(checkTokenExpiration, 100);

        return () => clearInterval(intervalId);
    }, [accessToken, refreshToken, navigate]);

    return { accessToken, refreshToken, setAccessToken, setRefreshToken };
};

export default useAuth;