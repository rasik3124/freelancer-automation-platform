import api from "./api";

export interface AuthUserResponse {
  id: string;
  email: string;
  fullName: string;
  role: "freelancer" | "client" | null;
  onboardingComplete: boolean;
  avatarUrl?: string;
}

export interface AuthDataResponse {
  accessToken: string;
  user: AuthUserResponse;
}

export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<AuthDataResponse> => {
    const response = await api.post("/auth/login", credentials);
    const { data } = response.data;
    return data;
  },

  signup: async (userData: { email: string; password: string; name: string }): Promise<AuthDataResponse> => {
    const response = await api.post("/auth/signup", userData);
    const { data } = response.data;
    return data;
  },

  updateProfile: async (profileData: Record<string, unknown>): Promise<AuthUserResponse> => {
    const response = await api.put("/auth/profile", profileData);
    const { data } = response.data;
    return data.user;
  },

  getMe: async (): Promise<AuthUserResponse> => {
    const response = await api.get("/auth/me");
    return response.data.data.user;
  },

  logout: () => {
    localStorage.removeItem("accessToken");
  },
};
