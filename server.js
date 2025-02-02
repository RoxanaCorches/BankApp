const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const mysql = require("mysql2");
const app = express();
const cors = require("cors");
const { title } = require("process");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cont_bancar",
  //port: 3307,
});

db.connect((err) => {
  if (err) {
    console.error("Eroare la conectarea la baza de date:", err);
    return;
  }
  console.log("Conectat la baza de date MySQL");
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
// Endpoint pentru autentificare (login)
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    // console.log("Req: ", username);
    // Căutăm utilizatorul în baza de date
    const query = "SELECT * FROM users WHERE Username=?";

    db.query(query, [username], async (err, results) => {
      if (err) {
        console.log("Eroare la interogarea bazei de date:", err);
        return res.status(500).send("Eroare la autentificare");
      }
      // console.log("Result", results);
      if (results.length === 0) {
        console.log("Utilizatorul nu există");
        return res.status(400).send("Utilizatorul nu există");
      }

      const user = results[0];
      const match = password === user.Password;
      console.log("Password:", password);
      console.log(user.Password);
      if (match) {
        // Parola este corectă, logăm utilizatorul
        console.log("Autentificare reușită pentru utilizator:", user.Username);
        console.log("Numele utilizatorului:", user.Name);
        console.log("Adreasa este:", user.Address);
        console.log("ID ul utilizatorului este:", user.UserID);

        const queryAccount = `SELECT * FROM accounts WHERE UserID = ? AND (AccountType = 'current' OR AccountType = 'savings');
`;
        db.query(queryAccount, [user.UserID], (err, accountResults) => {
          if (err) {
            console.log("Eroare la interogarea bazei de date:", err);
            return res.status(500).send("Eroare la verificarea conturilor");
          }
          console.log("Account Results:", accountResults);

          if (accountResults.length === 0) {
            console.log(
              "Nu există conturi asociate pentru utilizatorul cu UserID:",
              user.UserID
            );
            return res.status(404).send({
              result: "Nu există conturi asociate pentru acest utilizator",
            });
          }
          let currentBalance = null;
          let savingsBalance = null;
          accountResults.forEach((acc) => {
            if (acc.AccountType === "current") {
              currentBalance = acc.Balance;
            } else if (acc.AccountType === "savings") {
              savingsBalance = acc.Balance;
            }
          });
          const account = accountResults[0];

          console.log(
            `Utilizatorul ${user.Name} are un cont curent cu balance: ${currentBalance}`
          );

          console.log(
            `Utilizatorul ${user.Name} are un cont curent de economii cu balance: ${savingsBalance}`
          );
          res.send({
            result: "Autentificare reușită",
            name: user.Name,
            userID: user.UserID,
            address: user.Address,
            title: user.Title,
            email: user.Email,
            birthday: user.DateOfBirth,
            phoneNumber: user.PhoneNumber,
            occupation: user.Occupation,
            age: user.Age,
            balance: account.Balance,
            currentBalance: currentBalance || 0,
            savingsBalance: savingsBalance || 0,
          });
        });
      } else {
        console.log("Parola incorectă");
        res.status(400).send({ result: "Parola incorectă" });
      }
    });
  } catch (e) {
    console.log(e);
    res.status(500).send("Eroare la autentificare");
  }
});

// Endpoint pentru creare cont
app.post("/createAccount", async (req, res) => {
  console.log("Am primit cererea la /createAccount");

  try {
    console.log("Request body primit:", req.body);
    const {
      name,
      date,
      age,
      user,
      pass,
      contact,
      occupation,
      title,
      address,
      email,
    } = req.body;

    console.log("Request body primit:", req.body);
    console.log("Începe verificarea în baza de date pentru:", user);

    const checkQuery = "SELECT * FROM users WHERE Username = ?";
    db.query(checkQuery, [user], async (err, results) => {
      if (err) {
        console.error("Eroare interogare:", err);
        return res.status(500).send("Eroare la verificarea utilizatorului");
      }
      console.log("Rezultate interogare:", results);

      if (results.length > 0) {
        console.log("Utilizatorul există deja");
        return res.status(400).send("Utilizatorul există deja!");
      }

      console.log("Începem inserarea utilizatorului nou...");

      const userID = Math.floor(100000 + Math.random() * 900000);
      const insertQuery = `
        INSERT INTO users (UserID, Username, Password, Name, Address, Email, PhoneNumber, Occupation, Title, Age, DateOfBirth)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertQuery,
        [
          userID,
          user,
          pass,
          name,
          address,
          email,
          contact,
          occupation,
          title,
          age,
          date,
        ],
        (err, result) => {
          if (err) {
            console.error("Eroare la inserare:", err);
            return res.status(500).send("Eroare la creare cont");
          }
          console.log("Utilizator adăugat cu succes, ID:", userID);
          res.status(201).send({
            result: "Cont creat cu succes!",
            userID: userID,
          });
        }
      );
    });
  } catch (error) {
    console.error("Eroare server:", error);
    res.status(500).send("Eroare internă la crearea contului");
  }
});

app.post("/transfer", (req, res) => {
  const { senderUserID, recipientUsername, amount } = req.body;

  console.log("Cerere de transfer:", req.body);
  console.log("senderUserID primit:", senderUserID);
  console.log("recipientUsername primit:", recipientUsername);

  if (!senderUserID) {
    return res
      .status(400)
      .send({ result: "Expeditorul nu are UserID definit. Relogați-vă." });
  }

  db.beginTransaction((err) => {
    if (err) {
      console.error("Eroare la inițierea tranzacției:", err);
      return res.status(500).send("Eroare la inițierea tranzacției.");
    }

    console.log("Pas 1: Tranzacția a început cu succes.");

    // Verificare expeditor
    const querySender = `
      SELECT * FROM accounts 
      WHERE UserID = ? AND AccountType = 'current'
    `;
    db.query(querySender, [senderUserID], (err, senderResults) => {
      if (err || senderResults.length === 0) {
        console.error("Expeditorul nu a fost găsit sau eroare SQL:", err);
        return db.rollback(() => {
          res.status(404).send("Expeditorul nu a fost găsit.");
        });
      }

      const sender = senderResults[0];
      console.log("Pas 2: Expeditor găsit, sold curent:", sender.Balance);

      if (sender.Balance < amount) {
        return db.rollback(() => {
          res
            .status(400)
            .send({ result: "Fonduri insuficiente pentru transfer." });
        });
      }

      // Verificare destinatar
      const queryRecipient = `
        SELECT * FROM accounts 
        WHERE UserID IN (SELECT UserID FROM users WHERE Username = ?) 
        AND AccountType = 'current'
      `;
      db.query(queryRecipient, [recipientUsername], (err, recipientResults) => {
        if (err || recipientResults.length === 0) {
          console.error("Destinatarul nu a fost găsit:", err);
          return db.rollback(() => {
            res.status(404).send("Destinatarul nu a fost găsit.");
          });
        }

        const recipient = recipientResults[0];
        console.log("Pas 3: Destinatar găsit, sold curent:", recipient.Balance);

        // Actualizare solduri
        const updateSenderBalance = `
        UPDATE accounts 
        SET Balance = Balance - ? 
        WHERE UserID = ? AND AccountType = 'current'
      `;
        const updateRecipientBalance = `
      UPDATE accounts 
      SET Balance = Balance + ? 
      WHERE UserID = ? AND AccountType = 'current'
    `;

        db.query(updateSenderBalance, [amount, sender.UserID], (err) => {
          if (err) {
            console.error(
              "Eroare la actualizarea soldului expeditorului:",
              err
            );
            return db.rollback(() => {
              res
                .status(500)
                .send("Eroare la actualizarea soldului expeditorului.");
            });
          }
          console.log("Pas 4: Soldul expeditorului actualizat.");

          db.query(
            updateRecipientBalance,
            [amount, recipient.UserID],
            (err) => {
              if (err) {
                console.error(
                  "Eroare la actualizarea soldului destinatarului:",
                  err
                );
                return db.rollback(() => {
                  res
                    .status(500)
                    .send("Eroare la actualizarea soldului destinatarului.");
                });
              }
              console.log("Pas 5: Soldul destinatarului actualizat.");

              const insertTransaction = `
              INSERT INTO transactions (SenderID, ReceiverID, Amount, Currency,AmountInEUR,TransactionType)
              VALUES (?, ?, ?,'EUR',?,'transfer')
            `;
              db.query(
                insertTransaction,
                [sender.UserID, recipient.UserID, amount, amount],
                (err) => {
                  if (err) {
                    console.error("Eroare la înregistrarea tranzacției:", err);
                    return db.rollback(() => {
                      res
                        .status(500)
                        .send("Eroare la înregistrarea tranzacției.");
                    });
                  }
                  console.log("Pas 6: Tranzacția înregistrată.");

                  db.commit((err) => {
                    if (err) {
                      return db.rollback(() => {
                        res
                          .status(500)
                          .send("Eroare la finalizarea tranzacției.");
                      });
                    }
                    console.log("Pas 7: Tranzacție finalizată.");
                    res.send({
                      result: "Transfer realizat cu succes!",
                    });
                  });
                }
              );
            }
          );
        });
      });
    });
  });
});

//follosesc pentru a face conversia intre valuta
const exchangeRates = {
  EUR: 1,
  RON: 0.2, // 1 RON = 0.20 EUR
  USD: 0.92, // 1 USD = 0.92 EUR
};

app.post("/deposit", (req, res) => {
  const { senderUserID, amount, currency, accountType } = req.body;

  if (!senderUserID || !amount || !currency || !accountType) {
    return res
      .status(400)
      .send({ result: "Toate câmpurile sunt necesare pentru depunere." });
  }

  const exchangeRate = exchangeRates[currency] || 1;
  const amountInEUR = amount * exchangeRate; // Conversie în euro

  db.beginTransaction((err) => {
    if (err) {
      console.error("Eroare la inițierea tranzacției:", err);
      return res.status(500).send("Eroare la inițierea tranzacției.");
    }

    // Actualizare sold
    const updateBalance = `
      UPDATE accounts 
      SET Balance = Balance + ? 
      WHERE UserID = ? AND AccountType = ?
    `;
    db.query(
      updateBalance,
      [amountInEUR, senderUserID, accountType],
      (err, results) => {
        if (err) {
          console.error("Eroare la actualizarea soldului:", err);
          return db.rollback(() => {
            res.status(500).send("Eroare la actualizarea soldului.");
          });
        }

        // Înregistrarea tranzacției cu valuta selectată
        const insertTransaction = `
        INSERT INTO transactions (SenderID, Amount, Currency, AmountInEUR, TransactionType,AccountType)
        VALUES (?, ?, ?, ?, ?,?)
      `;
        db.query(
          insertTransaction,
          [senderUserID, amount, currency, amountInEUR, "deposit", accountType],
          (err) => {
            if (err) {
              console.error("Eroare la înregistrarea tranzacției:", err);
              return db.rollback(() => {
                res.status(500).send("Eroare la înregistrarea tranzacției.");
              });
            }

            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).send("Eroare la finalizarea tranzacției.");
                });
              }

              // Returnează noul sold după depunere
              db.query(
                `SELECT Balance,AccountType FROM accounts WHERE UserID = ?  AND AccountType = ?`,
                [senderUserID, accountType],
                (err, balanceResults) => {
                  if (err) {
                    console.error(
                      "Eroare la obținerea soldului actualizat:",
                      err
                    );
                    return res
                      .status(500)
                      .send("Eroare la obținerea soldului.");
                  }
                  const newBalance = balanceResults[0].Balance;
                  const updatedAccountType = balanceResults[0].AccountType;
                  res.send({
                    result: "Depunere realizată cu succes!",
                    newBalance: newBalance,
                    accountType: updatedAccountType,
                  });
                }
              );
            });
          }
        );
      }
    );
  });
});

//pt a obtine soldul din contul current sau saving in functie de ceea ce selectez

app.post("/getBalance", (req, res) => {
  const { userID, accountType } = req.body;

  console.log("Cerere primită:", req.body);

  if (!userID || !accountType) {
    return res.status(400).send({
      error: "Lipsesc câmpurile necesare (userID și accountType).",
    });
  }

  const sql = `
    SELECT Balance 
    FROM accounts 
    WHERE UserID = ? AND AccountType = ?
  `;

  db.query(sql, [userID, accountType], (err, results) => {
    if (err) {
      console.error("Eroare SQL:", err);
      return res.status(500).send({
        error: "Eroare la interogarea bazei de date.",
      });
    }

    if (results.length === 0) {
      console.warn("Contul nu a fost găsit pentru:", userID, accountType);
      return res.status(404).send({
        error: "Contul nu a fost găsit.",
      });
    }

    res.send({
      balance: results[0].Balance,
    });
  });
});

//pt retragere
app.post("/withdraw", (req, res) => {
  const { senderUserID, amount, currency, accountType } = req.body;
  console.log("Cerere de retragere primită:");
  console.log("UserID:", senderUserID);
  console.log("Amount:", amount);
  console.log("Currency:", currency);
  console.log("AccountType:", accountType);
  if (!senderUserID || !amount || !currency || !accountType) {
    return res
      .status(400)
      .send({ result: "Toate câmpurile sunt necesare pentru depunere." });
  }

  const exchangeRate = exchangeRates[currency] || 1;
  const amountInEUR = amount * exchangeRate; // Conversie în euro

  db.beginTransaction((err) => {
    if (err) {
      console.error("Eroare la inițierea tranzacției:", err);
      return res.status(500).send("Eroare la inițierea tranzacției.");
    }

    // Actualizare sold
    const updateBalance = `
      UPDATE accounts 
      SET Balance = Balance - ? 
      WHERE UserID = ?  AND AccountType = ?

    `;
    db.query(
      updateBalance,
      [amountInEUR, senderUserID, accountType],
      (err, results) => {
        if (err) {
          console.error("Eroare la actualizarea soldului:", err);
          return db.rollback(() => {
            res.status(500).send("Eroare la actualizarea soldului.");
          });
        }

        const insertTransaction = `
        INSERT INTO transactions (SenderID, Amount, Currency, AmountInEUR, TransactionType,AccountType)
        VALUES (?, ?, ?, ?, ?,?)

      `;
        db.query(
          insertTransaction,
          [
            senderUserID,
            amount,
            currency,
            amountInEUR,
            "withdraw",
            accountType,
          ],
          (err) => {
            if (err) {
              console.error("Eroare la înregistrarea tranzacției:", err);
              return db.rollback(() => {
                res.status(500).send("Eroare la înregistrarea tranzacției.");
              });
            }

            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).send("Eroare la finalizarea tranzacției.");
                });
              }

              // Returnează noul sold după depunere
              db.query(
                `SELECT Balance, AccountType FROM accounts WHERE UserID = ?  AND AccountType = ?`,
                [senderUserID, accountType],
                (err, balanceResults) => {
                  if (err) {
                    console.error(
                      "Eroare la obținerea soldului actualizat:",
                      err
                    );
                    return res
                      .status(500)
                      .send("Eroare la obținerea soldului.");
                  }
                  const newBalance = balanceResults[0].Balance;
                  const updatedAccountType = balanceResults[0].AccountType;
                  res.send({
                    result: "Retragere realizată cu succes!",
                    newBalance: newBalance,
                    accountType: updatedAccountType,
                  });
                }
              );
            });
          }
        );
      }
    );
  });
});

//endpoint pt tranzactii transfer
app.post("/transactionsTransfer", (req, res) => {
  const { userID } = req.body;
  console.log(req.body);
  if (!userID) {
    return res.status(400).send({ error: "UserID este necesar." });
  }

  const query = `
SELECT t.*, 
       DATE_FORMAT(t.TransferDate, '%Y-%m-%d %H:%i:%s') as FormattedDate, 
       s.name AS SenderName, 
       r.name AS ReceiverName
FROM transactions t
JOIN users s ON t.SenderID = s.userID
JOIN users r ON t.ReceiverID = r.userID
WHERE (t.SenderID = ? )
AND t.TransactionType = 'transfer'
ORDER BY t.TransferDate DESC
LIMIT 10;


`;

  db.query(query, [userID, userID], (err, results) => {
    if (err) {
      console.error("Eroare la interogarea bazei de date:", err);
      return res.status(500).send({ error: "Eroare server." });
    }
    results.forEach((transaction) => {
      console.log(`Tranzacție ID: ${transaction.TransactionID}`);
      console.log(`Data: ${transaction.FormattedDate}`);
      console.log(`Suma: ${transaction.Amount} ${transaction.Currency}`);
      console.log(
        `De la ${transaction.SenderName} către ${transaction.ReceiverName}`
      );
    });
    res.status(200).json(results);
  });
});

//endpoint pt tranzactii depunere
app.post("/transactionsDeposit", (req, res) => {
  const { userID } = req.body;
  console.log(req.body);
  if (!userID) {
    return res.status(400).send({ error: "UserID este necesar." });
  }

  const query = `
    SELECT t.*, 
           DATE_FORMAT(t.TransferDate, '%Y-%m-%d %H:%i:%s') as FormattedDate, 
           s.name AS SenderName, 
           t.AccountType
    FROM transactions t
    JOIN users s ON t.SenderID = s.userID
    WHERE t.SenderID = ? 
    AND t.TransactionType = 'deposit'
    ORDER BY t.TransferDate DESC
    LIMIT 10;
  `;

  db.query(query, [userID], (err, results) => {
    if (err) {
      console.error("Eroare la interogarea bazei de date:", err);
      return res.status(500).send({ error: "Eroare server." });
    }
    results.forEach((transaction) => {
      console.log(`Tranzacție ID pentru deposit: ${transaction.TransactionID}`);
      console.log(`Data pentru deposit: ${transaction.FormattedDate}`);
      console.log(
        `Suma deposit: ${transaction.Amount} ${transaction.Currency}`
      );
      console.log(`Depus în contul: ${transaction.AccountType}`);
    });
    res.status(200).json(results);
  });
});

//endpoint pt tranzactii retragere sold
app.post("/transactionsWithdraw", (req, res) => {
  const { userID } = req.body;
  console.log(req.body);
  if (!userID) {
    return res.status(400).send({ error: "UserID este necesar." });
  }

  const query = `
    SELECT t.*, 
           DATE_FORMAT(t.TransferDate, '%Y-%m-%d %H:%i:%s') as FormattedDate, 
           s.name AS SenderName, 
           t.AccountType
    FROM transactions t
    JOIN users s ON t.SenderID = s.userID
    WHERE t.SenderID = ? 
    AND t.TransactionType = 'withdraw'
    ORDER BY t.TransferDate DESC
    LIMIT 10;
  `;

  db.query(query, [userID], (err, results) => {
    if (err) {
      console.error("Eroare la interogarea bazei de date:", err);
      return res.status(500).send({ error: "Eroare server." });
    }
    results.forEach((transaction) => {
      console.log(
        `Tranzacție ID pentru retragere: ${transaction.TransactionID}`
      );
      console.log(`Data pentru retragere: ${transaction.FormattedDate}`);
      console.log(
        `Suma retragere: ${transaction.Amount} ${transaction.Currency}`
      );
      console.log(`Retragere din contul: ${transaction.AccountType}`);
    });
    res.status(200).json(results);
  });
});

app.post("/allTransactions", (req, res) => {
  const { userID } = req.body;

  if (!userID) {
    return res.status(400).send({ error: "UserID este necesar." });
  }

  const query = `
    SELECT t.*, 
           DATE_FORMAT(t.TransferDate, '%Y-%m-%d %H:%i:%s') as FormattedDate, 
           s.Name AS SenderName, 
           r.Name AS ReceiverName,
           t.AccountType
    FROM transactions t
    LEFT JOIN users s ON t.SenderID = s.UserID
    LEFT JOIN users r ON t.ReceiverID = r.UserID
    WHERE t.SenderID = ? OR t.ReceiverID = ?
    ORDER BY t.TransferDate DESC
  `;

  db.query(query, [userID, userID], (err, results) => {
    if (err) {
      console.error("Eroare la interogarea tranzacțiilor:", err);
      return res.status(500).send({ error: "Eroare server." });
    }
    res.status(200).json(results);
  });
});

// Endpoint pentru schimbarea parolei
app.post("/changePassword", async (req, res) => {
  const { userID, oldPassword, newPassword } = req.body;

  if (!userID || !oldPassword || !newPassword) {
    return res.status(400).send({ error: "Toate câmpurile sunt necesare." });
  }

  const query = "SELECT * FROM users WHERE UserID = ?";
  db.query(query, [userID], async (err, results) => {
    if (err) {
      console.error("Eroare la interogarea bazei de date:", err);
      return res.status(500).send({ error: "Eroare server." });
    }
    if (results.length === 0) {
      return res.status(404).send({ error: "Utilizatorul nu a fost găsit." });
    }

    const user = results[0];

    // Verifică dacă parola veche este corectă
    const passwordMatch = oldPassword === user.Password;
    if (!passwordMatch) {
      return res.status(400).send({ error: "Parola veche este incorectă." });
    }

    // Actualizează parola în baza de date
    const updateQuery = "UPDATE users SET Password = ? WHERE UserID = ?";
    db.query(updateQuery, [newPassword, userID], (err, updateResult) => {
      if (err) {
        console.error("Eroare la actualizarea parolei:", err);
        return res
          .status(500)
          .send({ error: "Eroare la actualizarea parolei." });
      }
      res.send({ result: "Parola a fost schimbată cu succes!" });
    });
  });
});

const port = 7000;
app.listen(port, () => {
  console.log(`Serverul rulează pe http://localhost:${port}`);
});
