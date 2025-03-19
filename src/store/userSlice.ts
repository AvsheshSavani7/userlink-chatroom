
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  id: string;
  name: string;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  id: '',
  name: '',
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    createUser: (state, action: PayloadAction<{ name: string }>) => {
      state.id = Date.now().toString();
      state.name = action.payload.name;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.id = '';
      state.name = '';
      state.isAuthenticated = false;
    },
  },
});

export const { createUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
