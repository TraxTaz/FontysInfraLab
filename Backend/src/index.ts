import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import userController from "./controller/user-controller";
import teacherController from "./controller/teacher-controller";
import authController from "./controller/auth-controller";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL!,
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.header("Content-Type", "application/json");
  next();
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Import and use your controller
app.use("/user", userController);
app.use("/teacher", teacherController);
app.use("/auth", authController);

// Handling 404
app.use((req, res, next) => {
  res.status(404).send("Not Found");
});

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
  }
);

const port = process.env.PORT || "3000";
app.listen(port, () => console.log(`Listening on ${port}...`));
