import axios from "axios";
import { TokenResponse } from "../types/token-response";

const API_URL = import.meta.env.VITE_API_URL;
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;

// sends request to our backend with authorization code
// backend then sends a request to identity.fhict.nl/connect/token
// to exchange the code for a token
// and returns the token to the frontend

export async function exchangeCodeForToken(
  code: string,
): Promise<TokenResponse> {
  const response = await axios.get<TokenResponse>(`${API_URL}auth/exchange`, {
    params: {
      code: code,
    },
  });

  // store in session storage for now
  sessionStorage.setItem("access_token", response.data.access_token);
  sessionStorage.setItem("expires_in", response.data.expires_in.toString());
  sessionStorage.setItem("id_token", response.data.id_token);

  return response.data;
}

export function redirectToLogin() {
  const authorizationUrl = new URL(
    "https://identity.fhict.nl/connect/authorize",
  );
  authorizationUrl.searchParams.append("client_id", CLIENT_ID);
  authorizationUrl.searchParams.append("redirect_uri", REDIRECT_URI);
  authorizationUrl.searchParams.append("scope", "fhict fhict_personal openid");
  authorizationUrl.searchParams.append("response_type", "code");
  window.location.href = authorizationUrl.toString();
}

export async function authorize() {
  const response = await axios.get(`${API_URL}auth/authorize`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
    },
  });
  sessionStorage.setItem("Access_token", response.data.accessToken);
  sessionStorage.setItem("Refresh_token", response.data.refreshToken);
  return response.data;
}

export async function getRefreshToken(refreshToken: string) {
  const response = await axios.post(`${API_URL}auth/refresh-token`, { refreshToken: refreshToken });
  return response;
}
