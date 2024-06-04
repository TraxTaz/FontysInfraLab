import { useEffect, useState } from "react";
import {
  authorize,
  exchangeCodeForToken,
  redirectToLogin,
} from "../services/auth-service";
import ConfigFileCard from "../components/config-file-card";
import { TokenResponse } from "../types/token-response";
import { AxiosError } from "axios";
import { LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Token } from "../types/token";
import TeacherPage from "./teacher-view-page";

const Login = () => {
  const [response, setResponse] = useState<TokenResponse | null>(null);
  const [user, setUser] = useState<any | null>(null); // TODO: replace with proper user type
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchToken = async () => {
      setIsLoading(true);

      // Parse the code from the URL
      const urlParams = new URLSearchParams(window.location.search);
      const authorizationCode = urlParams.get("code");

      if (!authorizationCode) {
        redirectToLogin();
      } else {
        // Exchange the code for an access token via backend
        try {
          const response = await exchangeCodeForToken(authorizationCode);
          setResponse(response);

          window.history.replaceState({}, document.title, "/");

          const user = await authorize();
          setUser(user);
          const decodedToken: Token = jwtDecode(user.accessToken);
          setRole(decodedToken!.role);
        } catch (error) {
          if (error instanceof Error) {
            const axiosError = error as AxiosError;
            if (axiosError.response && axiosError.response.status === 404) {
              setError("User not found.");
            } else {
              setError("Error");
            }
          } else {
            setError("Error");
          }
          sessionStorage.clear();
        }
      }
      setIsLoading(false);
    };

    fetchToken();
  }, []);

  const handleLogout = async () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("expires_in");
    sessionStorage.removeItem("id_token");
    sessionStorage.removeItem("Access_token");
    sessionStorage.removeItem("Refresh_token");

    // Clear the URL parameters
    window.history.replaceState({}, document.title, "/");
    navigate("/", { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoaderCircle className="animate-spin rounded-full h-32 w-32 text-primary-purple" />
      </div>
    );
  }

  if (error === "User not found." || error === "Error") {
    return (
      <div className="flex flex-col items-center mt-20">
        <p className="mb-4">403 Forbidden</p>
        <p className="text-2xl mb-2">
          You do not have access to InfralabConnect.
        </p>
        <p className="text-gray-700">
          If you think this might be an error, please reach out to a system
          administrator.
        </p>
        <button
          className="text-primary-purple-dark underline mt-4 hover:text-primary-purple"
          onClick={handleLogout}
        >
          Try logging in again
        </button>
      </div>
    );
  }

  return (
    <>
      {response && user && role === "student" && (
        <>
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-96 m-4 px-4 py-5 border flex flex-col gap-2">
            <p>Name: {user.displayName}</p>
            <p>Email: {user.mail}</p>
            <p>Title: {user.title}</p>
            <p>Personal title: {user.personalTitle}</p>
          </div>
          <ConfigFileCard />
        </>
      )}
      {role === "teacher" && <TeacherPage />}
    </>
  );
};

export default Login;
