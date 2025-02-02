class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach((listener) => listener(...args));
    }
  }

  off(event, listenerToRemove) {
    if (!this.events[event]) return;

    this.events[event] = this.events[event].filter(
      (listener) => listener !== listenerToRemove
    );
  }
}

const eventEmitter = new EventEmitter();
const btn_login = document.querySelector(".login-btn");
const flipButton = document.querySelector(".flip-button");
const signup_btn = document.querySelector(".signup-btn");
// Function to update balance and emit event
function updateBalance(newBalance) {
  localStorage.setItem("currentBalance", newBalance.toFixed(2));
  eventEmitter.emit("balanceUpdated", newBalance);
}

// Update balance display when the event is emitted
eventEmitter.on("balanceUpdated", (newBalance) => {
  const balanceElement = document.querySelector(".balance-value");
  if (balanceElement) {
    balanceElement.textContent = `${newBalance.toFixed(2)} €`;
  }
});

//PT SIGNUP
document.addEventListener("DOMContentLoaded", function () {
  const signup_btn = document.querySelector(".signup-btn");
  if (signup_btn) {
    signup_btn.addEventListener("click", () => {
      window.location.href = "signup.html";
    });
  } else {
    console.error("Butonul signup-btn nu a fost găsit în DOM.");
  }
});

//PT LOGIN
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("login-form");
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const data = {
      username: username,
      password: password,
    };

    fetch("http://localhost:7000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Login failed!");
        }
        return response.json();
      })
      .then((data) => {
        if (data.result === "Autentificare reușită") {
          //alert("Login successful!");
          localStorage.setItem("username", data.name);
          localStorage.setItem("userID", data.userID);
          localStorage.setItem("address", data.address);
          localStorage.setItem("title", data.title);
          localStorage.setItem("email", data.email);
          localStorage.setItem("phoneNumber", data.phoneNumber);
          localStorage.setItem("birthday", data.birthday);
          localStorage.setItem("occupation", data.occupation);
          localStorage.setItem("age", data.age);
          localStorage.setItem("balance", data.balance);
          localStorage.setItem("currentBalance", data.currentBalance);
          localStorage.setItem("savingsBalance", data.savingsBalance);
          window.location.href = "new_page1.html";
        } else {
          //alert("Login failed: " + data.result);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        //alert("Login failed!");
      });
  });
});

//PT CFREARE CONT
document.addEventListener("DOMContentLoaded", function () {
  const createAccountForm = document.getElementById("createAccountForm");
  createAccountForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const name = document.getElementById("name").value;
    const date = document.getElementById("date").value;
    const age = document.getElementById("age").value;
    const user = document.getElementById("user").value;
    const pass = document.getElementById("pass").value;
    const contact = document.getElementById("contact").value;
    const occupation = document.getElementById("occupation").value;
    const title = document.getElementById("title").value;
    const address = document.getElementById("address").value;
    const email = document.getElementById("email").value;
    const data = {
      name: name,
      date: date,
      age: age,
      user: user,
      pass: pass,
      contact: contact,
      occupation: occupation,
      title: title,
      address: address,
      email: email,
    };

    console.log("Date trimise către backend:", data);
    fetch("http://localhost:7000/createAccount", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Eroare la crearea contului!");
        }
        return response.json();
      })
      .then((result) => {
        // alert(result.result);
        createAccountForm.reset();
      })
      .catch((error) => {
        console.error("Eroare:", error);
        //alert("Eroare la crearea contului!");
      });
  });
});

document.querySelectorAll(".personal-data").forEach((input) => {
  input.addEventListener("input", function () {
    const icon = this.nextElementSibling;
    if (icon) {
      if (this.value) {
        icon.style.display = "none";
      } else {
        icon.style.display = "block";
      }
    }
  });
});

//PT TRANSFER
document.addEventListener("DOMContentLoaded", function () {
  const transferForm = document.getElementById("transferForm");

  transferForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const recipient = document.getElementById("recipient").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const senderUserID = localStorage.getItem("userID"); // ID-ul utilizatorului logat

    const data = {
      senderUserID: senderUserID,
      recipientUsername: recipient,
      amount: amount,
    };

    fetch("http://localhost:7000/transfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((result) => {
        //alert(result.result);
        if (result.result === "Transfer realizat cu succes!") {
          // Actualizează soldul în frontend
          /*
          const currentBalance = parseFloat(
            document.querySelector(".balance-value").textContent
          );
          const newBalance = currentBalance - amount;
          document.querySelector(
            ".balance-value"
          ).textContent = `${newBalance} €`;
          localStorage.setItem("balance", newBalance);
        }
*/
          // Update balance
          const newBalance =
            parseFloat(localStorage.getItem("currentBalance")) - amount;
          updateBalance(newBalance);
        }
      })
      .catch((error) => {
        console.error("Eroare:", error);
        //alert("Transfer eșuat.");
      });
  });
});

//PT DEPUNERE
flipButton.addEventListener("click", function () {
  flipButton.classList.toggle(".rotated");
});

function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Adaugă 1 deoarece getMonth() returnează un index de la 0 la 11
  const day = String(date.getDate()).padStart(2, "0"); // Adaugă 0 în față pentru zilele mai mici de 10
  return `${year}-${month}-${day}`;
}

function showPanel(option) {
  const panel = document.getElementById("rightPanel");
  const content = document.getElementById("content");
  let url = "";

  switch (option) {
    case "home":
      const username = localStorage.getItem("username");
      const profileText = username ? `Welcome, ${username} !` : "Profile";

      const [firstName, lastName] = username.split(" ");
      const firstNameText = firstName ? `${firstName}` : "FirstName";
      const lastNameText = lastName ? `${lastName}` : "LastName";

      const userID = localStorage.getItem("userID");
      const userIDText = userID ? `${userID}` : "UserID";

      const age = localStorage.getItem("age");
      const ageText = age ? `${age}` : "Age";

      const address = localStorage.getItem("address");
      const addressText = address ? `${address}` : "Address";

      const title = localStorage.getItem("title");
      const TitleText = title ? `${title}` : "Title";

      const email = localStorage.getItem("email");
      const EmailText = email ? `${email}` : "Email";

      const phoneNumber = localStorage.getItem("phoneNumber");
      const numberText = phoneNumber ? `${phoneNumber}` : "PhoneNumber";

      const birthday = localStorage.getItem("birthday");
      const birthdayText = birthday ? formatDate(birthday) : "Birthday";

      const occupation = localStorage.getItem("occupation");
      const occupationText = occupation ? `${occupation}` : "Occupation";

      const currentBalance = localStorage.getItem("currentBalance") || "0";
      const savingsBalance = localStorage.getItem("savingsBalance") || "0";
      console.log("Current Balance:", currentBalance);
      console.log("Savings Balance:", savingsBalance);

      content.innerHTML = `
      <h2>My Profile</h2>
      <div class="my_profile">
        <p>${profileText}</p>
      </div>
      <div class="view-profile">
        <h3>View Profile-Personal </h3>
      </div>
     <div class="container-information">
    <h4>User Information</h4>
    <div class="inf">
        <span class="label">Title:</span><span class="value">${TitleText}</span>
    </div>
    <div class="inf">
        <span class="label">First Name(s):</span><span class="value">${firstName}</span>
    </div>
    <div class="inf">
        <span class="label">Last Name(s):</span><span class="value">${lastNameText}</span>
    </div>
    <div class="inf">
        <span class="label">Date of Birth:</span><span class="value">${birthdayText}</span>
    </div>
     <div class="inf">
        <span class="label">Age:</span><span class="value">${ageText}</span>
    </div>
     <div class="inf">
        <span class="label">ID Number:</span><span class="value">${userIDText}</span>
    </div>

    <div class="inf">
        <span class="label">Address:</span><span class="value">${addressText}</span>
    </div>
    <div class="inf">
        <span class="label">E-mail Address:</span><span class="value">${EmailText}</span>
    </div>

    <div class="inf">
        <span class="label">Occupation:</span><span class="value">${occupationText}</span>
    </div>
    <div class="inf">
        <span class="label">Home Phone:</span><span class="value">${numberText}</span>
    </div>

   
    <div class="inf">
        <span class="label">Current Account:</span><span class="value">${currentBalance} €</span>
    </div>
    <div class="inf">
        <span class="label">Savings Account:</span><span class="value">${savingsBalance} €</span>
    </div>
</div>
     `;
      break;
    case "transferTo":
      const balance = localStorage.getItem("currentBalance");
      const balanceText = balance ? `${balance}` : "Balance";
      const currentDate = new Date().toLocaleDateString("ro-RO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      content.innerHTML = `<h2 class="section-title">Transfer to</h2>
      <div class="container-transfer-img">
            <img class="transfer-img" src="images/transfer3.avif" alt="Trasnfer to">
     </div>

     <div class="container-transfer">
     <div class="balance">
        <div class="balance-left-right">
            <div class="balance-left">
                <p class="balance-label">Current balance </p>
                <p class="balance-date">As of  <span class="date">${currentDate}</span></p>
            </div>
           
            <div class="balance-right">
                <p class="balance-value">${balanceText}€</p>
            </div>
        </div>

        <div class="balance-transaction">
            <h3>Recent Transfers </h3>
            <div class="transactions-list">
            <p>Loading transfers...</p>
          </div>
            
        </div>         
     </div>
    
    <div class="transfer-section">
            <form id="transferForm" class=" trsf transfer_amount">
                 <input type="text" placeholder="Recipient Username" class="introducere input-beneficiar" id="recipient">
                 <input type="text" placeholder="Amount" class=" introducere input-valoare" id="amount">
                 <button class=" btn button_submit ">Confirm</button>
                 
            </form>
    </div>
    </div>
     `;
      loadTransferHistory();
      const btn_submit_transfer_section = document.querySelector(".btn");
      const balance_value = document.querySelector(".balance-value");

      btn_submit_transfer_section.addEventListener("click", function (e) {
        e.preventDefault();

        const currentUserID = localStorage.getItem("userID");
        const currentUserName = localStorage.getItem("username");
        const recipientName = document.querySelector(".input-beneficiar").value;
        console.log(currentUserName);
        console.log(recipientName);
        const amountInput = document.querySelector("#amount");
        const amount = parseInt(amountInput.value);

        if (
          recipientName.trim() === "" ||
          (recipientName.trim() === "" && amountInput.value.trim() === "")
        ) {
          //alert("Completați ambele câmpuri!");
          return;
        }

        if (isNaN(amount) || amount <= 0) {
          //alert("Introduceți o sumă validă.");
          amountInput.value = "";
          return;
        }

        if (amount > parseInt(balance_value.textContent)) {
          //alert("Fonduri insuficiente!");
          amountInput.value = "";
          return;
        }

        // Verifică dacă destinatarul este același cu expeditorul
        if (
          recipientName.replace(/\s+/g, "").toLowerCase() ===
          currentUserName.replace(/\s+/g, "").toLowerCase()
        ) {
          //alert("Nu se pot transfera bani către propriul cont!");
          document.querySelector(".input-beneficiar").value = "";
          amountInput.value = "";
          return;
        }

        const data = {
          senderUserID: currentUserID,
          recipientUsername: recipientName,
          amount: amount,
        };

        console.log("Cerere de transfer trimisă:", data);

        fetch("http://localhost:7000/transfer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Transferul a eșuat în backend.");
            }
            return response.json();
          })
          .then((result) => {
            // alert(result.result || "Transfer realizat cu succes!");

            /*
            const newBalance =
              parseFloat(localStorage.getItem("currentBalance")) - amount;
            localStorage.setItem("currentBalance", newBalance.toFixed(2));

            // Actualizăm valoarea în secțiunea HTML
            const balanceElement = document.querySelector(".balance-value");
            if (balanceElement) {
              balanceElement.textContent = `${newBalance.toFixed(2)} €`;
            }
              
              */
            // Update balance
            const newBalance =
              parseFloat(localStorage.getItem("currentBalance")) - amount;
            updateBalance(newBalance);

            document.querySelector(".input-beneficiar").value = "";
            amountInput.value = "";

            loadTransferHistory();
          })
          .catch((error) => {
            console.error("Eroare la transfer:", error);
            //alert("Transferul a eșuat.");
          });
      });

      function loadTransferHistory() {
        const currentUserID = localStorage.getItem("userID");

        fetch("http://localhost:7000/transactionsTransfer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userID: currentUserID }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Eroare la preluarea tranzacțiilor.");
            }
            return response.json();
          })
          .then((transactions) => {
            const transactionList =
              document.querySelector(".transactions-list");
            transactionList.innerHTML = "";

            if (transactions.length === 0) {
              transactionList.innerHTML =
                "<p>Nu există tranzacții recente.</p>";
              return;
            }

            transactions.forEach((transaction) => {
              const listItem = document.createElement("div");
              listItem.classList.add("transaction-item");
              listItem.innerHTML = `
                <div class="transaction-details">
                  <p><strong>${transaction.FormattedDate} ${transaction.Amount} ${transaction.Currency}</strong></p>
                   <p>From <strong> ${transaction.SenderName}</strong> to <strong>${transaction.ReceiverName}.</strong></p>
                  
                </div>
              `;
              transactionList.appendChild(listItem);
            });
          })
          .catch((error) => {
            console.error("Eroare la încărcarea tranzacțiilor:", error);
            const transactionList =
              document.querySelector(".transactions-list");
            transactionList.innerHTML =
              "<p>Eroare la încărcarea tranzacțiilor.</p>";
          });
      }

      function updateUserBalances() {
        const currentBalance =
          parseFloat(localStorage.getItem("currentBalance")) || 0;
        const savingsBalance =
          parseFloat(localStorage.getItem("savingsBalance")) || 0;

        // Actualizează valoarea contului curent
        const currentBalanceElement =
          document.getElementById("current-balance");
        if (currentBalanceElement) {
          currentBalanceElement.textContent = `${currentBalance.toFixed(2)} €`;
        }

        // Actualizează valoarea contului de economii
        const savingsBalanceElement =
          document.getElementById("savings-balance");
        if (savingsBalanceElement) {
          savingsBalanceElement.textContent = `${savingsBalance.toFixed(2)} €`;
        }
      }
      break;
    case "deposit":
      const balance_deposit = localStorage.getItem("currentBalance");
      const balanceTextDeposit = balance_deposit
        ? `${balance_deposit}`
        : "Balance";
      const currentDate1 = new Date().toLocaleDateString("ro-RO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      content.innerHTML = `
            <h2>Deposit</h2>
      <div class="container-deposit-img">
            <img class="deposit-img" src="images/deposit.jpg" alt="Trasnfer to">
     </div>

     <div class="container-deposit">
     <div class="balance">
        <div class="balance-left-right">
            <div class="balance-left">
                <p class="balance-label">Current balance </p>
                <p class="balance-date">As of  <span class="date">${currentDate1}</span></p>
            </div>
           
            <div class="balance-right">
                <p class="balance-value">${balanceTextDeposit}€</p>
            </div>
        </div>

        <div class="balance-transaction">
            <h3>Recent Transfers </h3>
            <div class="transactions-list">
            <p>Loading transfers...</p>
         </div>   
          </div>    
     </div>
    
    <div class="transfer-section">
   
    

    <div class="form-row-deposit">
        <label for="select-account">Select account:</label>
        <select id="select-account">
            <option value="savings">Savings account</option>
            <option value="current">Current account</option>
        </select>
    </div>

    <div class="form-row-deposit">
        <label for="amount">Amount:</label>
        <input type="number" id="amount" placeholder="Enter deposit amount">
    </div>

    <div class="form-row-deposit">
        <label for="currency">Currency:</label>
        <select id="currency">
            <option value="RON">RON</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
        </select>
    </div>

    <div class="form-row-deposit">
        <button type="submit" id="confirm-deposit">Deposit</button>
    </div>
</div>

    </div>
      `;
      loadDepositHistory();
      updateUserBalances();
      // Cursuri de schimb
      const exchangeRates = {
        EUR: 1,
        RON: 0.2, // 1 RON = 0.20 EUR
        USD: 0.92, // 1 USD = 0.92 EUR
      };

      document
        .getElementById("confirm-deposit")
        .addEventListener("click", function (e) {
          e.preventDefault();

          const accountSelect = document.getElementById("select-account");
          const selectedAccount = accountSelect.value;
          console.log(selectedAccount);

          const depositAmount = parseFloat(
            document.getElementById("amount").value
          );
          const senderUserID = localStorage.getItem("userID");
          const selectedCurrency = document.getElementById("currency").value;
          const accountType = document.getElementById("select-account").value;

          if (!depositAmount || depositAmount <= 0) {
            alert("Introduceți o sumă validă.");
            document.getElementById("amount").value = "";
            return;
          }

          // Aplicăm conversia în euro
          const amountInEUR = depositAmount * exchangeRates[selectedCurrency];

          const data = {
            senderUserID: senderUserID,
            amount: depositAmount,
            currency: selectedCurrency,
            accountType: accountType,
          };

          console.log("Cerere de depunere trimisă:", data);

          fetch("http://localhost:7000/deposit", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error("Depunerea a eșuat în backend.");
              }
              return response.json();
            })
            .then((balanceData) => {
              console.log("Răspuns primit de la server:", balanceData);
              if (balanceData.newBalance) {
                document.querySelector(
                  ".balance-value"
                ).textContent = `${balanceData.newBalance} €`;
                document.getElementById("amount").value = "";
              }
              //alert("Depunere realizata cu success!");
              loadDepositHistory();

              if (selectedAccount === "savings") {
                const savingsBalance =
                  parseFloat(localStorage.getItem("savingsBalance")) || 0;
                const newSavingsBalance = savingsBalance + amountInEUR;
                localStorage.setItem(
                  "savingsBalance",
                  newSavingsBalance.toFixed(2)
                );
              } else {
                const currentBalance =
                  parseFloat(localStorage.getItem("currentBalance")) || 0;
                const newCurrentBalance = currentBalance + amountInEUR;
                localStorage.setItem(
                  "currentBalance",
                  newCurrentBalance.toFixed(2)
                );
              }
              updateUserBalances();
            })

            .catch((error) => {
              console.error("Eroare la depunere:", error);
              //alert("Nu s-a putut actualiza soldul in interfata.");
            });
        });
      function loadDepositHistory() {
        const currentUserID = localStorage.getItem("userID");

        fetch("http://localhost:7000/transactionsDeposit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userID: currentUserID }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Eroare la preluarea tranzacțiilor.");
            }
            return response.json();
          })
          .then((transactions) => {
            const transactionList =
              document.querySelector(".transactions-list");
            transactionList.innerHTML = "";

            if (transactions.length === 0) {
              transactionList.innerHTML =
                "<p>Nu există tranzacții recente.</p>";
              return;
            }

            transactions.forEach((transaction) => {
              const listItem = document.createElement("div");
              listItem.classList.add("transaction-item");
              listItem.innerHTML = `
                  <div class="transaction-details">
                    <p><strong>${transaction.FormattedDate} ${transaction.Amount} ${transaction.Currency} ${transaction.AmountInEUR} EUR </strong></p>
                    <p>Account: <strong>${transaction.AccountType}</strong></p>
                    
                  </div>
                `;
              transactionList.appendChild(listItem);
            });
          })
          .catch((error) => {
            console.error("Eroare la încărcarea tranzacțiilor:", error);
            const transactionList =
              document.querySelector(".transactions-list");
            transactionList.innerHTML =
              "<p>Eroare la încărcarea tranzacțiilor.</p>";
          });
      }

      break;
    case "withdraw":
      const balance_withdraw = localStorage.getItem("currentBalance");
      const balanceTextWithdraw = balance_withdraw
        ? `${balance_withdraw}`
        : "Withdraw";

      const currentDate2 = new Date().toLocaleDateString("ro-RO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      content.innerHTML = `
            <h2>Withdraw</h2>
      <div class="container-deposit-img">
            <img class="deposit-img" src="images/card2.jpg" alt="Trasnfer to">
     </div>

     <div class="container-deposit">
     <div class="balance">
        <div class="balance-left-right">
            <div class="balance-left">
                <p class="balance-label">Current balance </p>
                <p class="balance-date">As of  <span class="date">${currentDate2}</span></p>
            </div>
           
            <div class="balance-right">
                <p class="balance-value">${balanceTextWithdraw}€</p>
            </div>
        </div>

        <div class="balance-transaction">
            <h3>Recent Transfers </h3>
            <div class="transactions-list">
            <p>Loading transfers...</p>
         </div>   
          </div>       
     </div>
    
    <div class="transfer-section">
   
    

    <div class="form-row-deposit">
        <label for="select-account">Select account:</label>
        <select id="select-account">
            <option value="savings">Savings account</option>
            <option value="current">Current account</option>
        </select>
    </div>

    <div class="form-row-deposit">
        <label for="amount">Amount:</label>
        <input type="number" id="amount" placeholder="Enter deposit amount">
    </div>

    <div class="form-row-deposit">
        <label for="currency">Currency:</label>
        <select id="currency">
            <option value="RON">RON</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
        </select>
    </div>

    <div class="form-row-deposit">
        <button type="submit" id="confirm-withdraw">Withdraw</button>

    </div>
</div>

    </div>
      `;
      loadWithdrawHistory();
      updateUserBalances();

      // Cursuri de schimb
      const exchangeRates1 = {
        EUR: 1,
        RON: 0.2, // 1 RON = 0.20 EUR
        USD: 0.92, // 1 USD = 0.92 EUR
      };

      document
        .getElementById("confirm-withdraw")
        .addEventListener("click", function (e) {
          e.preventDefault();

          const accountSelect = document.getElementById("select-account");
          const selectedAccount = accountSelect.value;
          console.log(selectedAccount);

          const withdrawAmount = parseFloat(
            document.getElementById("amount").value
          );
          const senderUserID = localStorage.getItem("userID");
          const selectedCurrency = document.getElementById("currency").value;
          const accountType = document.getElementById("select-account").value;
          // Aplicăm conversia în euro
          const amountInEUR = withdrawAmount * exchangeRates1[selectedCurrency];
          // Obține soldurile disponibile
          const currentBalance =
            parseFloat(localStorage.getItem("currentBalance")) || 0;
          const savingsBalance =
            parseFloat(localStorage.getItem("savingsBalance")) || 0;

          if (!withdrawAmount || withdrawAmount <= 0) {
            alert("Introduceți o sumă validă.");
            document.getElementById("amount").value = "";
            return;
          }
          // Verifică dacă suma retrasă depășește soldul contului selectat
          if (selectedAccount === "current" && amountInEUR > currentBalance) {
            alert("Fonduri insuficiente în contul curent.");
            document.getElementById("amount").value = "";
            return;
          }

          if (selectedAccount === "savings" && amountInEUR > savingsBalance) {
            alert("Fonduri insuficiente în contul de economii.");
            document.getElementById("amount").value = "";
            return;
          }

          const data = {
            senderUserID: senderUserID,
            amount: withdrawAmount,
            currency: selectedCurrency,
            accountType: accountType,
          };

          console.log("Cerere de retragere trimisă:", data);

          fetch("http://localhost:7000/withdraw", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error("Depunerea a eșuat în backend.");
              }
              return response.json();
            })
            .then((balanceData) => {
              console.log("Răspuns primit de la server:", balanceData);
              if (balanceData.newBalance) {
                console.log(
                  `Soldul pentru contul ${selectedAccount} este: ${balanceData.newBalance} €`
                );
                document.querySelector(
                  ".balance-value"
                ).textContent = `${balanceData.newBalance} €`;
                document.getElementById("amount").value = "";
              } else {
                console.log("Nu s-a primit un sold valid.");
              }
              //alert("Retragere realizata cu success!");
              loadWithdrawHistory();

              if (selectedAccount === "savings") {
                const savingsBalance =
                  parseFloat(localStorage.getItem("savingsBalance")) || 0;
                const newSavingsBalance = savingsBalance - amountInEUR;
                localStorage.setItem(
                  "savingsBalance",
                  newSavingsBalance.toFixed(2)
                );
              } else {
                const currentBalance =
                  parseFloat(localStorage.getItem("currentBalance")) || 0;
                const newCurrentBalance = currentBalance - amountInEUR;
                localStorage.setItem(
                  "currentBalance",
                  newCurrentBalance.toFixed(2)
                );
              }
              updateUserBalances();
            })
            .catch((error) => {
              console.error("Eroare la depunere:", error);
              //alert("Nu s-a putut actualiza soldul in interfata.");
            });
        });
      function loadWithdrawHistory() {
        const currentUserID = localStorage.getItem("userID");

        fetch("http://localhost:7000/transactionsWithdraw", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userID: currentUserID }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Eroare la preluarea tranzacțiilor.");
            }
            return response.json();
          })
          .then((transactions) => {
            const transactionList =
              document.querySelector(".transactions-list");
            transactionList.innerHTML = "";

            if (transactions.length === 0) {
              transactionList.innerHTML =
                "<p>Nu există tranzacții recente.</p>";
              return;
            }

            transactions.forEach((transaction) => {
              const listItem = document.createElement("div");
              listItem.classList.add("transaction-item");
              listItem.innerHTML = `
                    <div class="transaction-details">
                      <p><strong>${transaction.FormattedDate} ${transaction.Amount} ${transaction.Currency} ${transaction.AmountInEUR} EUR </strong></p>
                      <p>Account: <strong>${transaction.AccountType}</strong></p>
                      
                    </div>
                  `;
              transactionList.appendChild(listItem);
            });
          })
          .catch((error) => {
            console.error("Eroare la încărcarea tranzacțiilor:", error);
            const transactionList =
              document.querySelector(".transactions-list");
            transactionList.innerHTML =
              "<p>Eroare la încărcarea tranzacțiilor.</p>";
          });
      }

      break;
    case "transactionsnsHistory":
      content.innerHTML = `
        <h2>Transactions History</h2>
        <div class="my_profile">
        <p>Transactions</p>
      </div>
      <div class="view-profile">
        <h3>View Transactions </h3>
      </div>
        <div class="container-information">
          <div class="transactions-list-all">
            <p>Loading transactions...</p>
          </div>
        </div>
        `;

      loadAllTransactions();
      break;
      function loadAllTransactions() {
        const userID = localStorage.getItem("userID");

        fetch("http://localhost:7000/allTransactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userID }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Eroare la încărcarea tranzacțiilor.");
            }
            return response.json();
          })
          .then((transactions) => {
            const transactionList = document.querySelector(
              ".transactions-list-all"
            );
            transactionList.innerHTML = "";

            if (transactions.length === 0) {
              transactionList.innerHTML =
                "<p>Nu există tranzacții recente.</p>";
              return;
            }

            transactions.forEach((transaction) => {
              const listItem = document.createElement("div");
              listItem.classList.add("transaction-item");
              listItem.innerHTML = `
                <div class="transaction-details">
                  <p>Transaction Date: <strong>${
                    transaction.FormattedDate
                  }</strong></p>
                  <p>Transaction Type: <strong>${
                    transaction.TransactionType
                  }</strong></p>
                  <p>Amount: <strong>${transaction.Amount} ${
                transaction.Currency
              }</strong></p>
                  <p>Account Type: <strong>${
                    transaction.AccountType
                  }</strong></p>
                  <p>From: <strong>${transaction.SenderName}</strong></p>
                  <p>To: <strong>${
                    transaction.ReceiverName || transaction.SenderName
                  }</strong></p>
                </div>
              `;

              transactionList.appendChild(listItem);
            });
          })
          .catch((error) => {
            console.error("Eroare la încărcarea tranzacțiilor:", error);
            const transactionList = document.querySelector(
              ".transactions-list-all"
            );
            transactionList.innerHTML =
              "<p>Eroare la încărcarea tranzacțiilor.</p>";
          });
      }

      break;
    case "changePassword":
      content.innerHTML = `
        <h2>Change Password</h2>
         <div class="my_profile">
        <p>Change Password</p>
        </div>

         <div class="view-profile">
             <h3>Choose a new password </h3>
        </div>

        <div class="container-changePassword">
              <div class="form-group-change">
              <label for="old-password">Password:</label>
                <div class=" input-icon-hidden-password">
              <input type="password" class="pass" id="old-pass">
               <img class="new_account_img" src="images/hidden.png">
              
             </div>
             </div>
             


             <div class="form-group-change">
              <label for="new-password">New Password:</label>
                <div class=" input-icon-hidden-password">
              <input type="password" class="pass" id="new-pass">
               <img class="new_account_img" src="images/hidden.png">
              
             </div>
             </div>
           


             <div class="form-group-change">
              <label for="confirm-password">Confirm Password:</label>
                <div class=" input-icon-hidden-password">
              <input type="password" class="pass" id="confirm-pass">
               <img class="new_account_img" src="images/hidden.png">
               
             </div>
             </div>


             <div class="button-container-change-password">
              <button type="submit" class="change-password">Change</button>
              <button type="reset" class="reset-password ">Reset</button>
            </div> 
          
            </div>
        
      `;
      const changePasswordButton = document.querySelector(".change-password");

      changePasswordButton.addEventListener("click", function (event) {
        event.preventDefault();

        const oldPassword = document.getElementById("old-pass").value;
        const newPassword = document.getElementById("new-pass").value;
        const confirmPassword = document.getElementById("confirm-pass").value;

        const userID = localStorage.getItem("userID");
        if (!oldPassword || !newPassword || !confirmPassword) {
          //alert("Please fill in all fields.");
          return;
        }

        if (newPassword !== confirmPassword) {
          alert("Noua parolă și confirmarea parolei nu coincid.");
          return;
        }

        const data = {
          userID: userID,
          oldPassword: oldPassword,
          newPassword: newPassword,
        };

        fetch("http://localhost:7000/changePassword", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Schimbarea parolei a eșuat.");
            }
            return response.json();
          })
          .then((result) => {
            alert(result.result);
            document.getElementById("old-pass").value = "";
            document.getElementById("new-pass").value = "";
            document.getElementById("confirm-pass").value = "";
          })
          .catch((error) => {
            console.error("Eroare:", error);
            alert("Parola nu a fost schimbată.");
          });
      });
      const resetButton = document.querySelector(".reset-password");

      resetButton.addEventListener("click", function (event) {
        event.preventDefault();

        document.getElementById("old-pass").value = "";
        document.getElementById("new-pass").value = "";
        document.getElementById("confirm-pass").value = "";

        document.querySelectorAll(".pass").forEach((input) => {
          const icon = input.nextElementSibling;
          if (icon) {
            icon.style.display = "block";
          }
        });

        //alert("Fields have been reset.");
      });

      document.querySelectorAll(".pass").forEach((input) => {
        input.addEventListener("input", function () {
          const icon = this.nextElementSibling;
          if (icon) {
            icon.style.display = this.value ? "none" : "block";
          }
        });
      });
      break;
    case "logout":
      window.location.href = "index.html";
      return;

    default:
      content.innerHTML =
        "<h2>Select an Option</h2><p>Selectați un link din stânga pentru a vedea detalii.</p>";
  }

  panel.classList.add("visible");
}
