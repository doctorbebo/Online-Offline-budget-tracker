let transactions = [];
let myChart;



fetch("/api/transaction")
  .then(response => {
    return response.json();
  })
  .then(data => {
    // save db data on global variable
    transactions = data;

    populateTotal();
    populateTable();
    populateChart();
  });

function populateTotal() {
  // reduce transaction amounts to a single total value
  let total = transactions.reduce((total, t) => {
    return total + parseInt(t.value);
  }, 0);

  let totalEl = document.querySelector("#total");
  totalEl.textContent = total;
}

function populateTable() {
  let tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";

  transactions.forEach(transaction => {
    // create and populate a table row
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
    `;

    tbody.appendChild(tr);
  });
}

function populateChart() {
  // copy array and reverse it
  let reversed = transactions.slice().reverse();
  let sum = 0;

  // create date labels for chart
  let labels = reversed.map(t => {
    let date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  // create incremental values for chart
  let data = reversed.map(t => {
    sum += parseInt(t.value);
    return sum;
  });

  // remove old chart if it exists
  if (myChart) {
    myChart.destroy();
  }

  let ctx = document.getElementById("myChart").getContext("2d");

  myChart = new Chart(ctx, {
    type: 'line',
      data: {
        labels,
        datasets: [{
            label: "Total Over Time",
            fill: true,
            backgroundColor: "#6666ff",
            data
        }]
    }
  });
}

function sendTransaction(isAdding) {
  let nameEl = document.querySelector("#t-name");
  let amountEl = document.querySelector("#t-amount");
  let errorEl = document.querySelector(".form .error");

  // validate form
  if (nameEl.value === "" || amountEl.value === "") {
    errorEl.textContent = "Missing Information";
    return;
  }
  else {
    errorEl.textContent = "";
  }

  // create record
  let transaction = {
    name: nameEl.value,
    value: amountEl.value,
    date: new Date().toISOString()
  };

  // if subtracting funds, convert amount to negative number
  if (!isAdding) {
    transaction.value *= -1;
  }

  // add to beginning of current array of data
  transactions.unshift(transaction);

  // re-run logic to populate ui with new record
  populateChart();
  populateTable();
  populateTotal();
  
  // send local saved data first to server
  sendSavedData((res)=>{
    if(res === true)
    {
      // then send this transaction to server
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(transaction),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => {    
        return response.json();
      })
      .then(data => {
        if (data.errors) {
          errorEl.textContent = "Missing Information";
        }
        else {
          // clear form
          nameEl.value = "";
          amountEl.value = "";
        }
      })
      .catch(err => {
        // fetch failed, so save in indexed db
        addData(transaction);

        // clear form
        nameEl.value = "";
        amountEl.value = "";
      }); 
    }else
    {
      addData(transaction);

      // clear form
      nameEl.value = "";
      amountEl.value = "";
    }
  });
}

document.querySelector("#add-btn").onclick = function() {
  sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function() {
  sendTransaction(false);
};


  function intializeDataBase(cb)
  {
    console.log("initializing database");  
    const request = window.indexedDB.open("failedTransactions", 1);
    // Create schema
    request.onupgradeneeded = event => {
      console.log("upgrade");
      const db = event.target.result;
      // Creates an object store with a listID keypath that can be used to query on.
      transactionStore = db.createObjectStore("attempedTransactions", {keyPath: "date" });
    };
  
    request.onsuccess = (event) => {
      console.log("sucess");
      cb(event);
      event.target.result.close();
      }
  }

  function addData (data)
  {
    intializeDataBase((event)=>
    {
      const db = event.target.result;
      db.transaction("attempedTransactions", "readwrite").objectStore("attempedTransactions").add(data);
    })
  }

  function sendSavedData(cb)
  { 
    intializeDataBase((event)=>
    {
      sendSecessful = true;
      const db = event.target.result
      const tran = db.transaction("attempedTransactions", "readwrite")
      const objStore = tran.objectStore("attempedTransactions")
      const req = objStore.getAll();
      req.onsuccess  = () =>{
        const list = req.result;
        list.forEach((e, i) =>
          {

            if(sendSecessful === false)
            {
              return;
            }

            console.log(e);
            console.log(`index: ${i + 1}`);

            fetch("/api/transaction", {
              method: "POST",
              body: JSON.stringify(e),
              headers: {
                Accept: "application/json, text/plain, */*",
                "Content-Type": "application/json"
              }
            })
            .then(() => {  

              deleteData(e.date);

            }).catch(err  =>
              {
                console.log("sent failed");
                sendSecessful = false
              });
          });
        cb(sendSecessful);  
      }
    });
  }

  function deleteData (keyIndex)
  {
    intializeDataBase((event)=>
    {
      const db = event.target.result
      const delTran = db.transaction("attempedTransactions", "readwrite");
      const delStore = delTran.objectStore("attempedTransactions");
      const delreq  = delStore.delete(keyIndex);
      delreq.onsuccess = () =>
      {
        console.log("item deleted at" + keyIndex);
      }
      delreq.onerror = () =>
      {
        console.log("error item not deleted at:" + keyIndex);
      }
    })
  }

