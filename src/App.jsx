import React, { useEffect, useRef, useState } from "react";
import { getDatabase, ref as dbRef, set, onValue } from "firebase/database";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
} from "@mui/material";
import AuthProvider from "./Auth";

function UploadImage() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  const db = getDatabase();
  const storage = getStorage();

  return (
    <div style={{ padding: 50 }}>
      <input
        ref={fileRef}
        type="file"
        accept=".png, .jpg, .jpeg .gif"
        onChange={(event) => {
          setFile(event.target.files[0]);
        }}
      />
      <br />
      <br />
      <button
        type="submit"
        onClick={async () => {
          setLoading(true);
          const imageRef = ref(storage, "images/" + file.name);
          await uploadBytes(imageRef, file);
          const url = await getDownloadURL(imageRef);
          await set(dbRef(db, "posts/" + Date.now()), {
            url,
          });
          fileRef.current.value = "";
          setLoading(false);
        }}
      >
        Submit
      </button>
      <br />
      <br />
      {loading && (
        <Box sx={{ display: "flex" }}>
          <CircularProgress />
        </Box>
      )}
    </div>
  );
}

function Post({ uuid, url }) {
  return (
    <div key={uuid} style={{ padding: 50 }}>
      <Card sx={{ maxWidth: 345 }}>
        <CardMedia
          component="img"
          height="350"
          image={url}
          alt="User uploaded"
        />
        <CardContent>
          <p>{new Date(parseInt(uuid)).toLocaleString()}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Feed() {
  const [posts, setPosts] = useState([]);
  const db = getDatabase();
  useEffect(() => {
    const databaseRef = dbRef(db, "posts/");
    return onValue(databaseRef, (snapshot) => {
      const data = Object.entries(snapshot.val())
        .map(([key, value]) => {
          return { id: key, url: value.url };
        })
        .sort((a, b) => parseInt(b.id) - parseInt(a.id));
      setPosts(data);
    });
  }, [db]);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {posts.map((post) => (
        <Post key={post.id} uuid={post.id} url={post.url} />
      ))}
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <h1>Blatzzz</h1>
        <UploadImage />
        <Feed />
      </AuthProvider>
    </div>
  );
}

export default App;
