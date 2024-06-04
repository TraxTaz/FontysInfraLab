import express, { Request, Response } from "express";
import axios from "axios";
import qs from "querystring";
import dotenv from "dotenv";
import { UserService } from "../service/user-service";
import jwt from "jsonwebtoken";
dotenv.config();

const userService = new UserService();

const SECRET_KEY = process.env.SECRET_KEY || "";

const generateTokens = (role: string, email: string) => {
  //remove this after testing
  var accessToken;
  var refreshToken;
if (email === "a.niculescu@student.fontys.nl") {
    accessToken = jwt.sign({ role: "teacher", sub: email }, SECRET_KEY, {
      expiresIn: "10m",
    });
    refreshToken = jwt.sign({ role: "teacher", sub: email }, SECRET_KEY, {
      expiresIn: "20m",
    });
  }
  else {
    accessToken = jwt.sign({ role: role, sub: email }, SECRET_KEY, {
      expiresIn: "15m",
    });
    refreshToken = jwt.sign({ role: role, sub: email }, SECRET_KEY, {
      expiresIn: "20m",
    });
  }
  //put this back after testing
  // const accessToken = jwt.sign({ role: role, sub: email }, SECRET_KEY, {
  //   expiresIn: "15m",
  // });
  // const refreshToken = jwt.sign({ role: role, sub: email }, SECRET_KEY, {
  //   expiresIn: "20m",
  // });
  
  return { accessToken, refreshToken };
};
const router = express.Router();
router.get("/authorize", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error:
        "UNAUTHORIZED"
        //"Authorization header is required and should be in format 'Bearer <token>'",
        // I think it's better for security purposes if we don't say why the program is not running
        // (=> possible attackers can just figure things out from the error and change their attack)
        // Instead we just say the reason why you're not allowed
        // This way we keep them guessing
    });
  }
  const token = authHeader.split(" ")[1];

  try {
    const response = await axios.get("https://api.fhict.nl/people/me", {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const exists = await userService.checkEmailExists(
      response.data.mail as string
    );
    if (exists) {
      var role: string = "none";
      var email: string = "none";
      email = response.data.mail;
      if (response.data.affiliations.includes("student")) {
        role = "student";
      } else if (response.data.affiliations.includes("teacher")) {
        role = "teacher";
      }
      const { accessToken, refreshToken } = generateTokens(role, email);
      res.status(200).json({
        ...response.data,
        accessToken,
        refreshToken,
      });
    } else {
      res.status(401).json({ error: "UNAUTHORIZED" });
      // Same reason as above
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error verifying email" });
  }
});

// Exchange the authorization code for an access token
router.get("/exchange", async (req: Request, res: Response) => {
  const authorizationCode = Array.isArray(req.query.code)
    ? req.query.code[0]
    : req.query.code;

  if (typeof authorizationCode === "string") {
    const tokenUrl =
      process.env.TOKEN_URL || "https://identity.fhict.nl/connect/token";

    const data = qs.stringify({
      grant_type: "authorization_code",
      code: authorizationCode,
      redirect_uri: process.env.FRONTEND_URL,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
    });
    // console.log(data);
    // console.log(tokenUrl);
    try {
      const response = await axios.post(tokenUrl, data, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      res.send(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error exchanging code for token" });
    }
  } else {
    res.status(400).json({ error: "No authorization code provided" });
    //res.status(401).json({ error: "UNAUTHORIZED" });
    // This one is debatable, depends on if we want to keep this for debugging purposes
    // Or we can just remove this and make it more ambiguous
  }
});

router.post("/clear-cookie", (req, res) => {
  res.clearCookie("connect.sid");
  res.sendStatus(200);
});

router.post("/refresh-token", async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required" });
    //return res.status(401).json({ error: "UNAUTHORIZED" });
    // Same as before
  }

  try {
    const decoded = jwt.verify(refreshToken, SECRET_KEY);
    const payload = decoded as unknown as { role: string; sub: string };
    const { role, sub } = payload;

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      role,
      sub
    );

    res.status(200).send({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: "Invalid refresh token" });
    //res.status(401).json({ error: "UNAUTHORIZED" });
    // Same as before
  }
});

export default router;
