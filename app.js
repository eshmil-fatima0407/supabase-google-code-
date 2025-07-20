import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://fchdnxrlpbbdesymqsjv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjaGRueHJscGJiZGVzeW1xc2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0Mzk4OTksImV4cCI6MjA2NzAxNTg5OX0.59J7wP1RjnDB2sXgivS7Q6BwOV7-hZO8gDyZME2IHxg"; // NOT the service key
const supabase = createClient(supabaseUrl, supabaseKey);

// Get current page
const currentPage = window.location.pathname;

// ------------------ AUTH PAGE ------------------
if (currentPage.includes("index.html") || currentPage === "/") {
  const nameInput = document.getElementById("user-name");
  const emailInput = document.getElementById("signup-email");
  const passInput = document.getElementById("signup-password");
  const signupBtn = document.getElementById("signupBtn");
  const loginBtn = document.getElementById("loginBtn");
  const googleBtn = document.getElementById("googleBtn");
  const msg = document.getElementById("message");

  signupBtn?.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passInput.value.trim();
    const name = nameInput.value.trim();

    if (!name || !email || !password) {
      msg.textContent = "❌ Fill all fields.";
      msg.style.color = "red";
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    msg.textContent = error ? error.message : "✅ Signup! Check your email.";
    msg.style.color = error ? "red" : "green";
  });

  loginBtn?.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passInput.value.trim();

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      msg.textContent = "❌ " + error.message;
      msg.style.color = "red";
    } else {
      msg.textContent = "✅ Logged in!";
      setTimeout(() => (window.location.href = "post.html"), 1000);
    }
  });

  googleBtn?.addEventListener("click", async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/post.html",
      },
    });
  });
}

// ------------------ POST PAGE ------------------
if (currentPage.includes("post.html")) {
  const titleInput = document.getElementById("title");
  const descInput = document.getElementById("description");
  const imageInput = document.getElementById("image");
  const postBtn = document.getElementById("postBtn");
  const message = document.getElementById("message");
  const logoutBtn = document.getElementById("logoutBtn");
  const userInfo = document.getElementById("user-info");

  // Check if logged in
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "index.html";
  } else {
    userInfo.textContent = user.email;
  }

  window.addEmoji = function (emoji) {
    descInput.value += emoji;
  };

  postBtn?.addEventListener("click", async () => {
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const imageFile = imageInput.files[0];

    if (!title || !description || !imageFile) {
      alert("All fields required");
      return;
    }

    const imageName = `${Date.now()}-${imageFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(imageName, imageFile);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return;
    }

    const { data: imageData } = supabase.storage
      .from("post-images")
      .getPublicUrl(imageName);

    const imageUrl = imageData.publicUrl;

    const { error: dbError } = await supabase.from("posts").insert([
      {
        title,
        description,
        image_url: imageUrl,
        user_id: user.id,
      },
    ]);

    if (dbError) {
      message.textContent = "❌ Failed to save post!";
      message.style.color = "red";
    } else {
      message.textContent = "✅ Post saved!";
      titleInput.value = "";
      descInput.value = "";
      imageInput.value = "";
    }
  });

  logoutBtn?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "index.html";
  });
}



