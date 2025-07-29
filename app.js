const projectUrl = "https://fchdnxrlpbbdesymqsjv.supabase.co";
const projectKey ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjaGRueHJscGJiZGVzeW1xc2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0Mzk4OTksImV4cCI6MjA2NzAxNTg5OX0.59J7wP1RjnDB2sXgivS7Q6BwOV7-hZO8gDyZME2IHxg"; // (Keep your real key here)
const { createClient } = supabase;
const client = createClient(projectUrl, projectKey);

// === SIGNUP ===
const signupBtn = document.getElementById("signupBtn");
signupBtn &&
  signupBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    if (email && password) {
      try {
        const { data, error } = await client.auth.signUp({ email, password });
        if (error) throw error;

        Swal.fire("Signup successful! Redirecting...");
        setTimeout(() => (window.location.href = "post.html"), 2000);
      } catch (error) {
        Swal.fire("Error", error.message, "error");
      }
    } else {
      Swal.fire("Please fill all fields");
    }
  });

// === LOGIN ===
const loginBtn = document.getElementById("loginBtn");
loginBtn &&
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    if (email && password) {
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        Swal.fire("Login successful! Redirecting...");
        setTimeout(() => (window.location.href = "post.html"), 2000);
      } catch (error) {
        Swal.fire("Error", error.message, "error");
      }
    } else {
      Swal.fire("Please fill all fields");
    }
  });

// === Google OAuth ===
const loginWithGoogle = document.getElementById("loginWithGoogle");
loginWithGoogle &&
  loginWithGoogle.addEventListener("click", async () => {
    localStorage.setItem("googleLoginSuccess", "true");
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href },
    });
    if (error) alert("Google login failed");
  });

// === Logout ===
const logoutBtn = document.getElementById("logoutBtn");
logoutBtn &&
  logoutBtn.addEventListener("click", async () => {
    await client.auth.signOut();
    window.location.href = "index.html";
  });

// === Load Profile on Post Page ===
async function displayUserProfile() {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (user) {
    document.getElementById("profile-name").textContent =
      user.user_metadata?.full_name || user.email;
    document.getElementById("profile-email").textContent = user.email;
    document.getElementById("profile-avatar").src =
      user.user_metadata?.avatar_url || "https://www.gravatar.com/avatar/?d=mp";
  } else {
    window.location.href = "login.html";
  }
}

// === Post Submit ===
const submitPost = document.getElementById("submitPost");
const loaderOverlay = document.getElementById("loader-overlay");

function showLoader() {
  loaderOverlay.style.display = "flex";
}
function hideLoader() {
  loaderOverlay.style.display = "none";
}

submitPost &&
  submitPost.addEventListener("click", async () => {
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    const postTitle = document.getElementById("post-title").value.trim();
    const postdescrib = document.getElementById("postdescrib").value.trim();

    if (!postTitle || !postdescrib) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please enter both a title and a description.",
      });
      return;
    }

    showLoader();
    submitPost.disabled = true;

    try {
      if (authError || !user) throw authError || new Error("User not found");

      const { error } = await client.from("users").insert([
        {
          user_id: user.id,
          Title: postTitle,
          Description: postdescrib,
        },
      ]);
      if (error) throw error;

      Swal.fire({
        icon: "success",
        title: "Post Created!",
        timer: 1500,
        showConfirmButton: false,
      });
      document.getElementById("post-title").value = "";
      document.getElementById("postdescrib").value = "";
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      hideLoader();
      submitPost.disabled = false;
    }
  });

// === Read All Posts ===
if (window.location.pathname.includes("all-blogs.html")) {
  const box = document.getElementById("container1");
  client
    .from("users")
    .select()
    .then(({ data }) => {
      if (data) {
        box.innerHTML = data
          .map(
            ({ id, Title, Description }) => `
          <div class="card bg-dark text-white border border-danger m-2 p-2" style="width: 18rem;">
            <div class="card-body">
              <h5>${Title}</h5>
              <p>${Description}</p>
            </div>
          </div>
        `
          )
          .join("");
      }
    });
}

// === Read My Posts ===
const readMyPosts = async () => {
  const {
    data: { user },
  } = await client.auth.getUser();

  const { data } = await client.from("users").select().eq("user_id", user.id);
  const box = document.getElementById("container1");
  box.innerHTML = data
    .map(
      ({ id, Title, Description }) => `
    <div class="card bg-dark text-white border-danger m-2 p-2" style="width: 18rem;">
      <div class="card-body">
        <h5>${Title}</h5>
        <p>${Description}</p>
        <button onclick="updatePost('${id}', '${Title}', '${Description}')" class="btn btn-outline-light btn-sm">Edit</button>
        <button onclick="deletePost('${id}')" class="btn btn-outline-danger btn-sm">Delete</button>
      </div>
    </div>
  `
    )
    .join("");
};

if (window.location.pathname.includes("my-blogs.html")) {
  readMyPosts();
}

// === Delete Post ===
async function deletePost(id) {
  const confirm = await Swal.fire({
    title: "Are you sure?",
    text: "This post will be deleted!",
    icon: "warning",
    showCancelButton: true,
  });

  if (confirm.isConfirmed) {
    await client.from("users").delete().eq("id", id);
    Swal.fire("Deleted!", "Your post has been deleted.", "success");
    readMyPosts();
  }
}

// === Update Post ===
async function updatePost(id, oldTitle, oldDesc) {
  const { value: formValues } = await Swal.fire({
    title: "Edit Post",
    html: `
      <input id="swal-title" class="swal2-input" value="${oldTitle}" />
      <input id="swal-desc" class="swal2-input" value="${oldDesc}" />
    `,
    focusConfirm: false,
    preConfirm: () => {
      return [
        document.getElementById("swal-title").value,
        document.getElementById("swal-desc").value,
      ];
    },
  });

  if (formValues) {
    const [newTitle, newDesc] = formValues;
    await client
      .from("users")
      .update({ Title: newTitle, Description: newDesc })
      .eq("id", id);
    Swal.fire("Updated!", "Post has been updated.", "success");
    readMyPosts();
  }
}

// === Load Profile if Logged In ===
document.addEventListener("DOMContentLoaded", async () => {
  const {
    data: { session },
  } = await client.auth.getSession();

  if (session) {
    displayUserProfile();
  } else if (window.location.pathname.includes("post.html")) {
    window.location.href = "login.html";
  }
});
