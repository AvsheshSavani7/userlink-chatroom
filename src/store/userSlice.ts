import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  id: string;
  name: string;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  id: "",
  name: "",
  isAuthenticated: false
};

interface CreateUserPayload {
  id?: string;
  name: string;
}

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    createUser: (state, action: PayloadAction<CreateUserPayload>) => {
      // Use the id from the payload if available, otherwise generate a new one
      state.id = action.payload.id || Date.now().toString();
      state.name = action.payload.name;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.id = "";
      state.name = "";
      state.isAuthenticated = false;
    }
  }
});

export const { createUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
