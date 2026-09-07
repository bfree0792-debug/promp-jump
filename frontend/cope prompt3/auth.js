const API_BASE_URL = "https://promp-jump-54.onrender.com";
let googleClientId = "";
let googleTokenClient = null;

async function sendAuthRequest(path, data) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error(
      "Cannot reach the API. Start the backend on port 4000."
    );
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Something went wrong.");
  }

  return result;
}

function showAuthMessage(form, message, type) {
  const messageBox = form ? form.querySelector(".auth-message") : document.querySelector(".auth-message");
  if (!messageBox) return;

  messageBox.textContent = message;
  messageBox.className = `auth-message ${type}`;
}

function setSubmitState(form, isLoading) {
  const button = form ? form.querySelector(".signup-btn") : null;
  if (!button) return;

  button.disabled = isLoading;
  button.textContent = isLoading ? "Please wait..." : (button.dataset.defaultText || "Submit");
}

async function handleGoogleSuccess(authResponse) {
  try {
    const activeForm = document.querySelector("#loginForm") || document.querySelector("#signupForm");
    if (activeForm) {
      showAuthMessage(activeForm, "Authenticating with Google...", "info");
    }

    const payload = authResponse.credential
      ? { credential: authResponse.credential }
      : { token: authResponse.access_token || authResponse.token };

    const result = await sendAuthRequest("/api/auth/google", payload);

    localStorage.setItem("promptgenieToken", result.token);
    localStorage.setItem("promptgenieUser", JSON.stringify(result.user));

    const params = new URLSearchParams({
      token: result.token,
      user: JSON.stringify(result.user),
    });

    window.location.href = `https://promp-jump-userpanel.vercel.app/?${params.toString()}`;
  } catch (error) {
    console.error("Google Auth Error:", error);
    const activeForm = document.querySelector("#loginForm") || document.querySelector("#signupForm");
    if (activeForm) {
      showAuthMessage(activeForm, error.message || "Google authentication failed.", "error");
    } else {
      alert(error.message || "Google authentication failed.");
    }
  }
}

async function initGoogleAuth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/google/client-id`);
    if (res.ok) {
      const data = await res.json();
      if (data.clientId) {
        googleClientId = data.clientId;
      }
    }
  } catch {
    // Keep fallback googleClientId
  }

  const setupGIS = () => {
    if (typeof window.google === "undefined" || !window.google.accounts) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleSuccess,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (window.google.accounts.oauth2) {
        googleTokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: "email profile openid",
          callback: handleGoogleSuccess,
        });
      }

      // Render official Google button into .social .google buttons if present
      const googleBtns = document.querySelectorAll(".social .google, button.google");
      googleBtns.forEach((btn) => {
        const container = document.createElement("div");
        container.className = "google-btn-rendered-wrapper";
        btn.parentNode.insertBefore(container, btn);
        btn.style.display = "none";
        window.google.accounts.id.renderButton(container, {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "rectangular",
          text: "continue_with",
          logo_alignment: "left",
          width: 320,
        });
      });
    } catch (e) {
      console.warn("Google Sign-In initialization note:", e);
    }
  };

  if (window.google && window.google.accounts) {
    setupGIS();
  } else {
    window.addEventListener("load", setupGIS);
  }
}

function triggerGoogleSignIn() {
  if (googleTokenClient) {
    googleTokenClient.requestAccessToken();
  } else if (window.google && window.google.accounts && window.google.accounts.id) {
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        console.log("GIS Prompt not displayed, fallback to popup if available");
      }
    });
  } else {
    alert("Google Sign-In is still loading. Please try again in a moment.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initGoogleAuth();

  // Attach Google Sign-In handlers to Google buttons
  const googleButtons = document.querySelectorAll(".social .google, button.google");
  googleButtons.forEach((btn) => {
    btn.setAttribute("type", "button");
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      triggerGoogleSignIn();
    });
  });

  const signupForm = document.querySelector("#signupForm");
  const loginForm = document.querySelector("#loginForm");

  if (signupForm) {
    const submitButton = signupForm.querySelector(".signup-btn");
    if (submitButton) {
      submitButton.dataset.defaultText = submitButton.textContent.trim();
    }

    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setSubmitState(signupForm, true);
      showAuthMessage(signupForm, "", "");

      try {
        const result = await sendAuthRequest("/api/auth/signup", {
          email: signupForm.email.value.trim(),
          fullName: signupForm.fullName.value.trim(),
          password: signupForm.password.value,
        });

        localStorage.setItem("promptgenieUser", JSON.stringify(result.user));
        showAuthMessage(signupForm, "Account created successfully. You can log in now.", "success");
        signupForm.reset();
      } catch (error) {
        showAuthMessage(signupForm, error.message, "error");
      } finally {
        setSubmitState(signupForm, false);
      }
    });
  }

  if (loginForm) {
    const submitButton = loginForm.querySelector(".signup-btn");
    if (submitButton) {
      submitButton.dataset.defaultText = submitButton.textContent.trim();
    }

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setSubmitState(loginForm, true);
      showAuthMessage(loginForm, "", "");



      try {
        const result = await sendAuthRequest("/api/auth/login", {
          email: loginForm.email.value.trim(),
          password: loginForm.password.value,
        });

        localStorage.setItem("promptgenieToken", result.token);
        localStorage.setItem("promptgenieUser", JSON.stringify(result.user));

        const params = new URLSearchParams({
          token: result.token,
          user: JSON.stringify(result.user),
        });

        window.location.href = `https://promp-jump-userpanel.vercel.app/?${params.toString()}`;
      } catch (error) {
        showAuthMessage(loginForm, error.message, "error");
      } finally {
        setSubmitState(loginForm, false);
      }
    });
  }
});
