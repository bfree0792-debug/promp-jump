const API_BASE_URL = "";

async function sendAuthRequest(path, data) {
  let response;

  try {
    response = await fetch(`http://localhost:4000${path}`, {
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
  const messageBox = form.querySelector(".auth-message");
  if (!messageBox) return;

  messageBox.textContent = message;
  messageBox.className = `auth-message ${type}`;
}

function setSubmitState(form, isLoading) {
  const button = form.querySelector(".signup-btn");
  if (!button) return;

  button.disabled = isLoading;
  button.textContent = isLoading ? "Please wait..." : button.dataset.defaultText;
}

document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.querySelector("#signupForm");
  const loginForm = document.querySelector("#loginForm");

  if (signupForm) {
    const submitButton = signupForm.querySelector(".signup-btn");
    submitButton.dataset.defaultText = submitButton.textContent.trim();

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
    submitButton.dataset.defaultText = submitButton.textContent.trim();

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

        window.location.href = `http://localhost:3001/?${params.toString()}`;
      } catch (error) {
        showAuthMessage(loginForm, error.message, "error");
      } finally {
        setSubmitState(loginForm, false);
      }
    });
  }
});
