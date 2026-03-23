// FIREBASE INIT
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_ID",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// AUTO LOGIN
if (auth.isSignInWithEmailLink(window.location.href)) {
  let email = localStorage.getItem("email");
  auth.signInWithEmailLink(email, window.location.href);
}

// USER
let userId;

auth.onAuthStateChanged(user => {
  if (user) {
    userId = user.uid;
    init();
  } else {
    window.location.href = "login.html";
  }
});

// INIT
function init(){
  checkDate();
  loadData();
}

// ADD TODAY
function addToday(){
  let text = todayInput.value;

  db.collection("users").doc(userId).collection("today").add({
    text: text,
    done: false
  });
}

// ADD TOMORROW
function addTomorrow(){
  let text = tomorrowInput.value;

  db.collection("users").doc(userId).collection("tomorrow").add({
    text: text
  });
}

// LOAD DATA
function loadData(){

  let completed = 0;
  let total = 0;

  db.collection("users").doc(userId).collection("today")
  .onSnapshot(snapshot => {

    todayList.innerHTML = "";

    snapshot.forEach(doc => {
      let d = doc.data();
      total++;
      if(d.done) completed++;

      todayList.innerHTML += `
        <div onclick="toggle('${doc.id}', ${d.done})">
        ${d.done ? "✅" : "⬜"} ${d.text}
        </div>`;
    });

    updateStats(completed, total);
  });

  db.collection("users").doc(userId).collection("tomorrow")
  .onSnapshot(snapshot => {

    tomorrowList.innerHTML = "";

    snapshot.forEach(doc => {
      tomorrowList.innerHTML += `<div>🕒 ${doc.data().text}</div>`;
    });
  });
}

// TOGGLE TASK
function toggle(id, done){
  db.collection("users").doc(userId)
  .collection("today").doc(id)
  .update({ done: !done });
}

// DISCIPLINE SYSTEM
function updateStats(done, total){

  let missed = total - done;

  let percent = total ? (done / total) * 100 : 0;

  stats.innerHTML = `
    ✅ Done: ${done} <br>
    ❌ Missed: ${missed} <br>
    📊 Discipline: ${percent.toFixed(1)}%
  `;

  bar.style.width = percent + "%";
}

// AUTO SHIFT (12 AM)
function checkDate(){

  let today = new Date().toDateString();
  let last = localStorage.getItem("date");

  if(last !== today){

    db.collection("users").doc(userId)
    .collection("tomorrow").get()
    .then(snapshot => {

      snapshot.forEach(doc => {
        db.collection("users").doc(userId)
        .collection("today").add({
          text: doc.data().text,
          done: false
        });

        doc.ref.delete();
      });
    });

    localStorage.setItem("date", today);
  }
}
