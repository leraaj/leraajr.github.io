const mongoose = require("mongoose");
const UserModel = require("./models/users");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const app = express();
const BASE_URL = "http://localhost:3000";
const RENDER_URL = "https://darkshot-aj.onrender.com";
require("dotenv").config();
const MONGODB_URL = process.env.MONGODB_URL;
const PORT = process.env.PORT;

app.use(cors({ credentials: true, origin: [BASE_URL, RENDER_URL] }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
const cookieExpires = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, "cookie", {
    expiresIn: cookieExpires,
  });
};
app.get("/api/users", async (request, response) => {
  try {
    const user = await UserModel.find({});
    response.status(200).json(user);
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

app.post("/api/user", async (request, response) => {
  try {
    const user = await UserModel.create(request.body);
    response.status(200).json(user);
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});
app.get("/api/user/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const user = await UserModel.findById(id);
    response.status(200).json({ user });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
});

app.put("/api/user/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const user = await UserModel.findByIdAndUpdate(id, request.body);
    if (!user) {
      return response
        .status(404)
        .json({ message: `cannot find any product with ID: ${id}` });
    }
    const userUpdatedData = await UserModel.findById(id);
    response.status(200).json({ userUpdatedData });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
});

app.delete("/api/user/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const user = await UserModel.findByIdAndDelete(id);
    if (!user) {
      return response
        .status(404)
        .json({ message: `cannot find any product  with ID ${id}` });
    }
    response.status(200).json(user);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
});

app.post("/api/user/login", async (request, response) => {
  try {
    const inputUsername = request.body.username;
    const inputPassword = request.body.password;

    const userFields = Object.keys(request.body);
    let isEmptyField = false;
    for (const field of userFields) {
      if (!request.body[field]) {
        isEmptyField = true;
        break; // Exit the loop if any empty field is found
      }
    }
    if (isEmptyField) {
      return response.status(401).json({ message: "All fields are required" });
    }
    const user = await UserModel.findOne({
      username: inputUsername,
    });
    if (!user) {
      return response.status(401).json({ message: "User doesn't exists" });
    }
    const passwordMatch = await bcrypt.compare(inputPassword, user.password);

    if (passwordMatch) {
      var userToken = createToken(user.id);
      response
        .cookie("Auth_Token", userToken, {
          httpOnly: true,
          maxAge: cookieExpires,
        })
        .status(200)
        .json({
          user: user,
          message: "Cookie set!",
          redirectUrl: `/admin/accounts`,
        });
    } else {
      response.status(401).json({ message: "Invalid login credentials." });
    }
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
});

app.post("/api/user/logout", async (request, response) => {
  try {
    response.cookie("JWT_authorized", { maxAge: 1 });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
});

app.post("/api/user/current-user", async (request, response) => {
  try {
    const decoded = jwt.decode(userToken);
    const user = await UserModel.findOne({ _id: decoded.id });
    response.status(200).json(user);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
});

mongoose.set("strictQuery", false);
mongoose
  .connect(MONGODB_URL)
  .then(() => {
    app.listen(PORT, () => {
      console.log("server is running");
    });
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });
