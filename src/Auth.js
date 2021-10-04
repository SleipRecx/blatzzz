import React, { useContext, useEffect, useState } from "react";
import { getAuth, GithubAuthProvider, signInWithPopup } from "firebase/auth";
import { Button } from "@mui/material";

const provider = new GithubAuthProvider();

const UserContext = React.createContext(null);

export function useAuth() {
  return useContext(UserContext);
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    return auth.onAuthStateChanged((user) => {
      setLoading(false);
      if (user) {
        setUser(user);
      }
    });
  }, []);

  const login = () => {
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
  };

  return (
    <div>
      <UserContext.Provider value={user}>
        {user
          ? children
          : !loading && <Button onClick={login}>Login with Github</Button>}
      </UserContext.Provider>
    </div>
  );
}
