const express = require("express");
const cron = require("node-cron");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const port = process.env.Port || 3000;

const app = express();
app.use(express.json());

let toDoData = JSON.parse(fs.readFileSync("./todo.json", "utf-8"));

function sendResponse(res, status, data, message = null) {
  const response = {
    status,
    data,
  };

  if (message) {
    response.message = message;
  }

  res.json(response);
}

function addDataToFile() {
  fs.writeFileSync("./todo.json", JSON.stringify(toDoData));
}
const taskStatus = {
  OPEN: "OPEN",
  COMPLETE: "COMPLETE",
};

//<------------------------Create------------------------>//
//this route is used to create a new task

app.post("/todo", (req, res) => {
  const newTodo = req.body;
  newTodo.status = newTodo.status.toUpperCase() || taskStatus.OPEN;
  if (!Object.values(taskStatus).includes(newTodo.status)) {
    sendResponse(res, "fail", null, "No data found.");
  }
  newTodo.id = uuidv4();
  toDoData.todo.push(newTodo);
  addDataToFile();
  sendResponse(res, "success", newTodo);
});

//<------------------------Create------------------------>//

//<------------------------Read------------------------>//

//this route is used to get all the task
app.get("/todo", (req, res) => {
  res.json(toDoData);
});

//this route is used to get the task by id
app.get("/todo/:id", (req, res) => {
  const { id } = req.params;

  const data = toDoData.todo.find((todo) => todo.id === id);
  if (data) {
    res.json(data);
  } else {
    res.status(404).send("Data not found");
  }
});

//<------------------------Read------------------------>//

//<------------------------Update------------------------>//
//this route is used to update the task by id

app.put("/todo/:id", (req, res) => {
  const { id } = req.params;
  const updateTodo = req.body;
  const index = toDoData.todo.findIndex((todo) => todo.id === id);

  console.log(index);
  if (index !== -1) {
    toDoData.todo[index].task = updateTodo.task;

    toDoData.todo[index].status = updateTodo.status
      ? updateTodo.status.toUpperCase()
      : toDoData.todo[index].status;
    if (!Object.values(taskStatus).includes(toDoData.todo[index].status)) {
      return res.status(400).json({ error: "error message" });
    }

    addDataToFile();
    res
      .send({
        status: "success",
        data: toDoData,
      })
      .status(200);
  } else {
    res.status(404).send("Data not found");
  }
});
//<------------------------Update------------------------>//

//<------------------------Delete------------------------>//

//this route is used to delete the task by id
app.delete("/todo/:id", (req, res) => {
  const { id } = req.params;
  const index = toDoData.todo.findIndex((todo) => todo.id === id);
  if (index !== -1) {
    toDoData.todo.splice(index, 1);
    addDataToFile();
    res.status(200).send("Data Deleted");
  } else {
    res.status(404).send("Data not found");
  }
});
//this route is used to delete all the task
app.delete("/todo", (req, res) => {
  toDoData.todo = [];
  addDataToFile();
  res.status(200).send("Data Deleted");
});

//<------------------------Delete------------------------>//

//<------------------------Cron Job------------------------>//
//here scheduller is set for a minute to check the status of the task and delete the task if it is completed.

cron.schedule("* * * * *", () => {
  console.log("Running Cron Job");
  for (let i = toDoData.todo.length - 1; i > -1; i--) {
    if (toDoData.todo[i].status === taskStatus.COMPLETE) {
      toDoData.todo.splice(i, 1);
      addDataToFile();
    }
  }
});
//<------------------------Cron Job------------------------>//

app.listen(port, (req, res) => {
  console.log(`Server is Up on Port :${port}`);
});
