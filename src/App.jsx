import React, { useEffect, useRef, useState, Fragment } from "react";
import { getDatabase, ref as dbRef, set, onValue } from "firebase/database";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
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

function delete_image(image_ref) {
  return new Promise((resolve, reject) => {
    deleteObject(image_ref).then(() => {
      // File deleted successfully
      resolve('deleted');
    }).catch((error) => {
      // Uh-oh, an error occurred!
      reject(error);
    });  
  })
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
          return { id: key, url: value.url };
        })
        .sort((a, b) => parseInt(b.id) - parseInt(a.id));
      setPosts(data);
    });
  }, [db]);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {posts.map((post) => (
        <Fragment key={post.id}>
          <Post uuid={post.id} url={post.url} />
          {window.location.href.endsWith('admin') &&
            <button onClick={() => delete_post(post.id, post.url)}>Delete image</button>
          }
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
