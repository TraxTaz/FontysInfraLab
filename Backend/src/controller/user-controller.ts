import express, { Request, Response } from "express";
import { UserService } from "../service/user-service";
import fs from "fs";
import jwt from "jsonwebtoken";
const router = express.Router();
const userService = new UserService();

const SECRET_KEY = process.env.SECRET_KEY || "";

const verifyToken = (req: Request, res: Response, next: () => void) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(401)
      .send(
        //"Authorization header is required and should be in format '<token>'"
        "UNAUTHORIZED"
        //Same reason as in auth controller
      );
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).send("Invalid token");
    }
    if (decoded && typeof decoded === "object" && decoded.role === "student") {
      next();
    } else {
      return res.status(403).send(
        "User role is not allowed"
        //Or we can say
        //"ACCESS_FORBIDDEN"
      );
    }
  });
};

router.post("/get_file", verifyToken, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).send("Email is required");
    }

    const filePath = await userService.getFile(email);
    res.download(filePath, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error sending file");
      }
      fs.unlinkSync(filePath);
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error querying database");
  }
});

export default router;
