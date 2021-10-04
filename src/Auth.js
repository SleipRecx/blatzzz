import React, { useContext, useEffect, useState } from "react";
import { GithubAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
const provider = new GithubAuthProvider();

const UserContext = React.createContext(null);

export function useAuth() {
  return useContext(UserContext);
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    return auth.onAuthStateChanged((user) => {
      if (!user) {
        signInWithPopup(auth, provider)
          .then((result) => {
            const user = result.user;
            setUser(user);
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        setUser(user);
      }
    });
  }, []);

  return (
    <UserContext.Provider value={user}>{user && children}</UserContext.Provider>
  );
}
