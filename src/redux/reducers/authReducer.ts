import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { authApi, LoginResponse } from "../../adapter/adapter";

// Define user type
interface User {
  id: string;
  name: string;
  email: string;
}

// Define authentication state
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async thunks for authentication
export const login = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await authApi.login(email, password);
      // Store token and user in localStorage
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      return response;
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || "Failed to login");
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (
    {
      name,
      email,
      password,
    }: { name: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await authApi.register(name, email, password);
      // Store token and user in localStorage
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      return response;
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || "Failed to register");
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      // Remove token and user from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || "Failed to logout");
    }
  }
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (
    {
      currentPassword,
      newPassword,
      token,
    }: { currentPassword: string; newPassword: string; token: string },
    { rejectWithValue }
  ) => {
    try {
      await authApi.changePassword(currentPassword, newPassword, token);
      return null;
    } catch (error: unknown) {
      return rejectWithValue(
        (error as Error).message || "Failed to change password"
      );
    }
  }
);

// Check authentication status from localStorage
export const checkAuthStatus = createAsyncThunk(
  "auth/checkAuthStatus",
  async (_, { rejectWithValue }) => {
    try {
      if (typeof window === "undefined") {
        return null;
      }

      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (!token || !userStr) {
        // No stored auth data
        return null;
      }

      try {
        const user = JSON.parse(userStr);
        return { token, user };
      } catch {
        // Invalid stored data, clear it
        // localStorage.removeItem("token");
        // localStorage.removeItem("user");
        return null;
      }
    } catch (error: unknown) {
      return rejectWithValue(
        (error as Error).message || "Failed to check auth status"
      );
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthError: (state) => {
      state.error = null;
    },
    resetAuth: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        login.fulfilled,
        (state, action: PayloadAction<LoginResponse>) => {
          state.loading = false;
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.error = null;
        }
      )
      .addCase(login.rejected, (state, action: PayloadAction<unknown>) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload as string;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        register.fulfilled,
        (state, action: PayloadAction<LoginResponse>) => {
          state.loading = false;
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.error = null;
        }
      )
      .addCase(register.rejected, (state, action: PayloadAction<unknown>) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action: PayloadAction<unknown>) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Change password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(
        changePassword.rejected,
        (state, action: PayloadAction<unknown>) => {
          state.loading = false;
          state.error = action.payload as string;
        }
      )
      // Check auth status
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          // Restore authentication state from localStorage
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
        } else {
          // No stored auth data
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
        }
        state.error = null;
      })
      .addCase(
        checkAuthStatus.rejected,
        (state, action: PayloadAction<unknown>) => {
          state.loading = false;
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
          state.error = action.payload as string;
        }
      );
  },
});

export const { resetAuthError, resetAuth } = authSlice.actions;
export default authSlice.reducer;
