import React, { Fragment, useEffect, useRef, useState } from "react";
import { getDatabase, onValue, ref as dbRef, set, get } from "firebase/database";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";

import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  CircularProgress,
  IconButton,
} from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import AuthProvider, { useAuth } from "./Auth";

function UploadImage() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  const user = useAuth();

  const db = getDatabase();
  const storage = getStorage();

  return (
    <div>
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

          const imageRef = ref(
            storage,
            "images/" + Date.now() + "_" + file.name
          );

          await uploadBytes(imageRef, file);
          const url = await getDownloadURL(imageRef);
          await set(dbRef(db, "posts/" + Date.now()), {
            url,
            name: user.displayName,
            avatar: user.photoURL,
            likes: 0,
            email: user.email,
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

function Post({ uuid, avatarUrl, url, likes, username }) {
  return (
    <div key={uuid} style={{ padding: 50 }}>
      <Card sx={{ maxWidth: 345 }}>
        <CardHeader
          avatar={
            <Avatar src={avatarUrl} aria-label="recipe">
              {username[0]}
            </Avatar>
          }
          title={username}
          subheader={new Date(parseInt(uuid)).toLocaleString()}
        />
        <CardMedia
          component="img"
          height="350"
          image={url}
          alt="User uploaded"
        />
        <CardContent onClick={() => increase_likes(uuid)}>
          <IconButton>
            <ThumbUpIcon />
          </IconButton>
          {likes}
        </CardContent>
      </Card>
    </div>
  );
}

async function increase_likes(img_id) {
  const db = getDatabase();
  const databaseRef = dbRef(db, `posts/${img_id}/likes`);
  const snapshot = await get(databaseRef);
  set(databaseRef, snapshot.val() + 1);
}

function delete_image(image_ref) {
  return new Promise((resolve, reject) => {
    deleteObject(image_ref)
      .then(() => {
        // File deleted successfully
        resolve("deleted");
      })
      .catch((error) => {
        // Uh-oh, an error occurred!
        reject(error);
      });
  });
}

async function delete_post(img_id, img_url) {
  const db = getDatabase();
  const databaseRef = dbRef(db, `posts/${img_id}`);
  const storage = getStorage();
  const imageRef = ref(storage, img_url);
  await delete_image(imageRef);
  set(databaseRef, null);
}

function Feed() {
  const [posts, setPosts] = useState([]);
  const db = getDatabase();
  useEffect(() => {
    const databaseRef = dbRef(db, "posts/");
    return onValue(databaseRef, (snapshot) => {
      if (!snapshot.val()) {
        setPosts([]);
        return;
      }
      const data = Object.entries(snapshot.val())
        .map(([key, value]) => {
          return { id: key, ...value };
        })
        .sort((a, b) => parseInt(b.id) - parseInt(a.id));
      setPosts(data);
    });
  }, [db]);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {posts.map((post) => (
        <Fragment key={post.id}>
          <Post
            key={post.id}
            uuid={post.id}
            avatarUrl={post.avatar || post.url}
            url={post.url}
            likes={post.likes || 0}
            username={post.name || "John Doe"}
          />
          {window.location.href.endsWith("admin") && (
            <button onClick={() => delete_post(post.id, post.url)}>
              Delete image
            </button>
          )}
        </Fragment>
      ))}
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <div style={{ backgroundColor: "#94d9b7", margin: -30, padding: 30 }}>
          <span
            style={{
              textAlign: "center",
              fontFace: "San Fransisco",
              fontSize: 48,
              fontWeight: 300,
            }}
          >
            Blatzzz
          </span>
          <div style={{ marginTop: 20 }}>
            <UploadImage />
          </div>
        </div>
        <Feed />
      </AuthProvider>
    </div>
  );
}

export default App;
