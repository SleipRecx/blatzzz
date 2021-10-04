import React, { useEffect, useRef, useState } from "react";
import { getDatabase, ref as dbRef, set, onValue } from "firebase/database";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

function UploadImage() {
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  const db = getDatabase();
  const storage = getStorage();

  return (
    <>
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
          console.log(file);
          const imageRef = ref(storage, "images/" + file.name);
          await uploadBytes(imageRef, file);
          const url = await getDownloadURL(imageRef);
          const result = await set(dbRef(db, "posts/" + Date.now()), {
            url,
          });
          console.log(result);
          fileRef.current.value = "";
        }}
      >
        Submit
      </button>
    </>
  );
}

function Post({ uuid, url }) {
  return (
    <div key={uuid}>
      <img src={url} />
      <p>{new Date(parseInt(uuid)).toLocaleString()}</p>
    </div>
  );
}

function Feed() {
  const [posts, setPosts] = useState([]);
  const db = getDatabase();
  useEffect(() => {
    const databaseRef = dbRef(db, "posts/");
    return onValue(databaseRef, (snapshot) => {
      const data = Object.entries(snapshot.val()).map(([key, value]) => {
        return { id: key, url: value.url };
      });
      setPosts(data);
    });
  }, []);

  const rawPosts = posts.map((post) => (
    <Post key={post.id} uuid={post.id} url={post.url} />
  ));
  return rawPosts;
}

function App() {
  return (
    <div className="App">
      <h1>Blatzzz</h1>
      <UploadImage />
      <Feed />
    </div>
  );
}

export default App;
