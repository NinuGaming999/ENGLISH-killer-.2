// ========== CONFIG ==========
const API_KEY = "$2a$10$En69WYD5e.SZpM5aUICUaeHcOPLP3XAMkf1OkDgcVSxSMgMNqleYC";
const BIN_USERS = "689f6021ae596e708fcace20";
const BIN_MCQ = "689f606fd0ea881f405a019d";
const BIN_MATERIALS = "689f6094ae596e708fcace6f";
const BIN_ZOOM = "689f60caae596e708fcace93";
const BASE_URL = "https://api.jsonbin.io/v3/b/";

// ========== UTILS ==========
function getBinUrl(bin) {
  return BASE_URL + bin;
}
function getHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Master-Key": API_KEY
  };
}

function showMsg(id, msg, color="lime") {
  const el = document.getElementById(id);
  if (el) {
    el.innerHTML = `<span style="color:${color};">${msg}</span>`;
    setTimeout(() => { el.innerHTML = ""; }, 3000);
  }
}

// ========== LOGIN & REGISTER ==========
document.addEventListener('DOMContentLoaded', function() {
  // Enable all login/register fields
  ["loginUsername","loginPassword","registerUsername","registerPassword"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = false;
  });

  // Login handler
  if (document.getElementById("loginForm")) {
    document.getElementById("loginForm").onsubmit = async function(e) {
      e.preventDefault();
      const username = document.getElementById("loginUsername").value.trim();
      const password = document.getElementById("loginPassword").value.trim();
      showMsg("loginMsg", "Logging in...", "yellow");
      const res = await fetch(getBinUrl(BIN_USERS) + "/latest", { headers: getHeaders() });
      const data = await res.json();
      const users = data.record;
      const user = users.find(u => u.username === username && u.password === password);
      if (user) {
        localStorage.setItem("ekweb_user", JSON.stringify(user));
        if (user.role === "admin") {
          location.href = "admin.html";
        } else {
          location.href = "user.html";
        }
      } else {
        showMsg("loginMsg", "Invalid credentials!", "red");
      }
    };
  }

  // Register handler
  if (document.getElementById("registerForm")) {
    document.getElementById("registerForm").onsubmit = async function(e) {
      e.preventDefault();
      // Admin page logic
      if (location.pathname.endsWith("admin.html")) {
        // Zoom link
        document.getElementById("zoomForm").onsubmit = async function(e) {
          e.preventDefault();
          const link = document.getElementById("zoomLink").value.trim();
          if (!link) {
            showMsg("zoomMsg", "Please enter a Zoom link.", "red");
            return;
          }
          await fetch(getBinUrl(BIN_ZOOM), {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify({ link })
          });
          showMsg("zoomMsg", "Zoom link updated!");
        };
        // Load current zoom link
        (async function() {
          const res = await fetch(getBinUrl(BIN_ZOOM) + "/latest", { headers: getHeaders() });
          const data = await res.json();
          document.getElementById("zoomLink").value = data.record.link || "";
        })();

        // MCQ Management
        async function loadMcqs() {
          const res = await fetch(getBinUrl(BIN_MCQ) + "/latest", { headers: getHeaders() });
          const data = await res.json();
          const mcqs = Array.isArray(data.record) ? data.record : [];
          let html = "";
          mcqs.forEach((q, i) => {
            html += `<div class="card">
              <b>Q${i+1}:</b> ${q.question}<br>
              <ol type="A">${q.options.map((o, idx) => `<li${q.answer==idx?' style=\"color:lime;\"':''}>${o}</li>`).join("")}</ol>
              <button onclick="deleteMcq(${q.id})">Delete</button>
            </div>`;
          });
          document.getElementById("mcqList").innerHTML = html || "No MCQs yet.";
        }
        window.deleteMcq = async function(id) {
          const res = await fetch(getBinUrl(BIN_MCQ) + "/latest", { headers: getHeaders() });
          const data = await res.json();
          let mcqs = Array.isArray(data.record) ? data.record : [];
          mcqs = mcqs.filter(q => q.id !== id);
          await fetch(getBinUrl(BIN_MCQ), {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(mcqs)
          });
          loadMcqs();
        };

        document.getElementById("mcqForm").onsubmit = async function(e) {
          e.preventDefault();
          const question = document.getElementById("mcqQuestion").value.trim();
          const options = [
            document.getElementById("mcqOption0").value.trim(),
            document.getElementById("mcqOption1").value.trim(),
            document.getElementById("mcqOption2").value.trim(),
            document.getElementById("mcqOption3").value.trim()
          ];
          const answerStr = document.getElementById("mcqAnswer").value;
          const answer = parseInt(answerStr);
          if (!question) {
            showMsg("mcqMsg", "Please enter a question.", "red");
            return;
          }
          if (options.some(o => !o)) {
            showMsg("mcqMsg", "All options are required.", "red");
            return;
          }
          if (isNaN(answer) || answerStr === "") {
            showMsg("mcqMsg", "Select the correct option.", "red");
            return;
          }
          const res = await fetch(getBinUrl(BIN_MCQ) + "/latest", { headers: getHeaders() });
          const data = await res.json();
          const mcqs = Array.isArray(data.record) ? data.record : [];
          mcqs.push({ id: Date.now(), question, options, answer });
          await fetch(getBinUrl(BIN_MCQ), {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(mcqs)
          });
          showMsg("mcqMsg", "MCQ added!");
          document.getElementById("mcqForm").reset();
          loadMcqs();
        };
        loadMcqs();

        // Study Materials
        async function loadMaterials() {
          const res = await fetch(getBinUrl(BIN_MATERIALS) + "/latest", { headers: getHeaders() });
          const data = await res.json();
          const materials = data.record;
          let html = "";
          materials.forEach((m, i) => {
            html += `<div class="card">
              <b>${m.title}</b> <a href="${m.url}" target="_blank" style="color:yellow;">[Download]</a>
              <button onclick="deleteMaterial(${m.id})">Delete</button>
            </div>`;
          });
          document.getElementById("materialList").innerHTML = html || "No materials yet.";
        }
        window.deleteMaterial = async function(id) {
          const res = await fetch(getBinUrl(BIN_MATERIALS) + "/latest", { headers: getHeaders() });
          const data = await res.json();
          let materials = data.record;
          materials = materials.filter(m => m.id !== id);
          await fetch(getBinUrl(BIN_MATERIALS), {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(materials)
          });
          loadMaterials();
        };
        document.getElementById("materialForm").onsubmit = async function(e) {
          e.preventDefault();
          const title = document.getElementById("materialTitle").value.trim();
          const url = document.getElementById("materialUrl").value.trim();
          if (!title || !url) return;
          const res = await fetch(getBinUrl(BIN_MATERIALS) + "/latest", { headers: getHeaders() });
          const data = await res.json();
          const materials = data.record;
          materials.push({ id: Date.now(), title, url });
          await fetch(getBinUrl(BIN_MATERIALS), {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(materials)
          });
          showMsg("materialMsg", "Material added!");
          loadMaterials();
          e.target.reset();
        };
        loadMaterials();

        // User List
        async function loadUsers() {
          const res = await fetch(getBinUrl(BIN_USERS) + "/latest", { headers: getHeaders() });
          const data = await res.json();
          const users = data.record;
          let html = "<ul>";
          users.forEach(u => {
            html += `<li>${u.username} (${u.role})</li>`;
          });
          html += "</ul>";
          document.getElementById("userList").innerHTML = html;
        }
        loadUsers();
      }
    };
  }

  window.showRegister = function() {
    document.getElementById("registerContainer").style.display = "";
  }
  window.hideRegister = function() {
    document.getElementById("registerContainer").style.display = "none";
  }

  // User dashboard logic
  if (location.pathname.endsWith("user.html")) {
    (async function() {
      const res = await fetch(getBinUrl(BIN_ZOOM) + "/latest", { headers: getHeaders() });
      const data = await res.json();
      document.getElementById("zoomJoin").href = data.record.link || "#";
      document.getElementById("zoomJoin").innerText = data.record.link ? "Join Meeting" : "No link set";
    })();
    (async function() {
      const res = await fetch(getBinUrl(BIN_MATERIALS) + "/latest", { headers: getHeaders() });
      const data = await res.json();
      const materials = data.record;
      let html = "";
      materials.forEach(m => {
        html += `<div><b>${m.title}</b> <a href="${m.url}" target="_blank" style="color:yellow;">[Download]</a></div>`;
      });
      document.getElementById("userMaterialList").innerHTML = html || "No materials yet.";
    })();
  }

  // MCQ test logic
  if (location.pathname.endsWith("mcq.html")) {
    (async function() {
      const res = await fetch(getBinUrl(BIN_MCQ) + "/latest", { headers: getHeaders() });
      const data = await res.json();
      const mcqs = data.record;
      let current = 0, score = 0;
      const mcqTest = document.getElementById("mcqTest");
      function showQ() {
        if (current >= mcqs.length) {
          mcqTest.innerHTML = `<h2>Test Complete!</h2><p>Your Score: ${score} / ${mcqs.length}</p>`;
          return;
        }
        const q = mcqs[current];
        mcqTest.innerHTML = `
          <div class="card">
            <b>Q${current+1}:</b> ${q.question}<br>
            <ol type="A">
              ${q.options.map((o, i) => `<li><button onclick=\"answerQ(${i})\">${o}</button></li>`).join("")}
            </ol>
          </div>
        `;
      }
      window.answerQ = function(i) {
        if (mcqs[current].answer === i) score++;
        current++;
        showQ();
      };
      showQ();
    })();
  }
});
