import { createContext, useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";

export const AuthContext = createContext();
// ...provider component with state, login, signup, logout methods
