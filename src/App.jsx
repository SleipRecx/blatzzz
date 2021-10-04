import { useEffect, useRef, useState, Fragment } from "react";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  getDatabase,
  ref as dbRef,
  get,
  set,
  onValue,
  limitToLast,
  endBefore,
  query,
  orderByKey,
} from "firebase/database";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  CircularProgress,
  IconButton,
  Button,
} from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import AuthProvider, { useAuth } from "./Auth";

const LOADING_CHUNK_SIZE = 25;

/* Transforms posts from raw firebase output to list of nicely formatted objects. */
function transformPosts(raw) {
  return Object.entries(raw)
    .map(([id, value]) => ({ ...value, id }))
    .sort((a, b) => b.likes - a.likes);
}

/* Merges two lists of posts ordered by id. Prefer items in b. */
function mergePosts(a, b) {
  /* Could be done in O(n) if needed later. */
  const seenSet = new Set();
  const merged = [];
  for (const item of [...b, ...a]) {
    if (seenSet.has(item.id)) {
      continue;
    }
    seenSet.add(item.id);
    merged.push(item);
  }
  merged.sort((a, b) => b.likes - a.likes);
  return merged;
}

function UploadImage() {
  const [loading, setLoading] = useState(false);

  const user = useAuth();

  const db = getDatabase();
  const storage = getStorage();

  return (
    <div>
      <input
        type="file"
        accept=".png, .jpg, .jpeg .gif"
        onChange={async (event) => {
          const file = event.target.files[0];
          const target = event.nativeEvent.target;
          if (!file) {
            return;
          }
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
          target.value = "";
          setLoading(false);
        }}
      />
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
  const [reachedEndOfFeed, setReachedEndOfFeed] = useState(false);
  const db = useRef(getDatabase());

  useEffect(() => {
    /* TODO: I haven't tested how well this works with new posts coming in in
     * real time. */
    const databaseRef = query(
      dbRef(db.current, "posts/"),
      orderByKey(),
      limitToLast(LOADING_CHUNK_SIZE)
    );
    return onValue(databaseRef, (snapshot) => {
      const value = snapshot.val();
      if (!value || value.length < LOADING_CHUNK_SIZE) {
        setReachedEndOfFeed(true);
        return;
      }
      const data = transformPosts(value);
      setPosts((old) => mergePosts(old, data));
    });
  }, []);

  const loadMore = async () => {
    const oldestId = (posts[posts.length - 1] || {}).id;
    /* This triggers onValue snapshot listener with the data for some reason
     * (maybe I should read some more firebase docs), so we ignore the results
     * here and pick them up there instead. */
    get(
      query(
        dbRef(db.current, "posts"),
        limitToLast(LOADING_CHUNK_SIZE),
        orderByKey(),
        ...(oldestId ? [endBefore(oldestId)] : [])
      )
    );
  };

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

      {!reachedEndOfFeed && posts.length > 0 && (
        <Button
          onClick={(e) => {
            e.preventDefault();
            loadMore();
          }}
        >
          Load more...
        </Button>
      )}
    </div>
  );
}

const SelfAvatar = () => {
  const user = useAuth();

  return (
    <Avatar alt={user?.displayName ?? "John Doe"} src={user?.photoURL ?? ""} />
  );
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <div style={{ backgroundColor: "#94d9b7", margin: -30, padding: 30 }}>
          <div>
            <span
              style={{
                fontFace: "San Fransisco",
                fontSize: 48,
                fontWeight: 300,
              }}
            >
              Blatzzz
            </span>
            <div style={{ display: "inline", float: "right" }}>
              <SelfAvatar />
            </div>
          </div>
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
