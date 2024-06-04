import express, { Request, Response } from "express";
import { TeacherService } from "../service/teacher-service";
import fs from "fs";
import multer from "multer";
import jwt from "jsonwebtoken";

const router = express.Router();
const teacherService = new TeacherService();
const upload = multer({ dest: "public/uploads/" }).single("file");

const SECRET_KEY = process.env.SECRET_KEY || "";

const verifyToken = (req: Request, res: Response, next: () => void) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send(
      //"Authorization header is required and should be in format '<token>'"
      "UNAUTHORIZED"
      //Same reasons as in auth controller
    );
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).send("Invalid token");
    }
    if (decoded && typeof decoded === "object" && decoded.role === "teacher") {
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

router.put("/users", verifyToken, async (req: Request, res: Response) => {
  try {
    const { vpnid, email, oldEmail, oldVpnId } = req.body;
    await teacherService.updateUser(email, vpnid, oldEmail, oldVpnId);
    res.status(200).send("User updated successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating user");
  }
});

router.get("/main", verifyToken, async (req: Request, res: Response) => {
  try {
    const serverCerts = await teacherService.teacherTable();
    res.send(serverCerts);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error querying database");
  }
});

router.post(
  "/import-csv/:update",
  upload,
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const updateExisting = req.params.update === "true";

      if (!req.file?.path) {
        return res.status(400).send("The path to the CSV file is required.");
      }

      if (!fs.existsSync(req.file.path)) {
        return res.status(404).send("The specified CSV file was not found.");
      }

      await teacherService.importCSV(req.file.path, updateExisting);

      fs.rm(req.file.path, (err) => {
        if (err) {
          console.error("Error removing file:", err);
        }
      });

      res
        .status(200)
        .send(
          "The import of data from the CSV file was completed successfully."
        );
    } catch (error) {
      console.error(
        "Error during the import of data from the CSV file:",
        error
      );
      res
        .status(500)
        .send("An error occurred during the import of data from the CSV file.");
    }
  }
);

router.get("/run-scripts", verifyToken, async (req: Request, res: Response) => {
  try {
    const scripts = [
      "py_curl_ca",
      "py_curl_certs",
      "py_curl_server_certs",
      "py_curl_ovpn",
      "py_import_users",
    ];
    for (const script of scripts) {
      const result = await teacherService.runScript(script);
      console.log(result);
    }
    res.send("Scripts executed successfully");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to run scripts" });
  }
});

router.post("/teachers", verifyToken, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).send("Missing email parameter");
    }
    const newTeacher = await teacherService.createTeacher(email);
    res.status(201).send(newTeacher);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating teacher");
  }
});

router.get("/teachers", verifyToken, async (req: Request, res: Response) => {
  try {
    const teachers = await teacherService.getAllTeachers();
    res.send(teachers);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching teachers");
  }
});

router.put("/teachers", verifyToken, async (req: Request, res: Response) => {
  try {
    const { newEmail, oldEmail } = req.body;
    if (!newEmail || !oldEmail) {
      return res.status(400).send("Missing parameters");
    }
    const message = await teacherService.updateTeacherEmail(newEmail, oldEmail);
    res.send(message);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating teacher email");
  }
});

router.delete(
  "/teachers/:email",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const email = req.params.email;
      if (!email) {
        return res.status(400).send("Missing email parameter");
      }
      const message = await teacherService.deleteTeacherByEmail(email);
      res.send(message);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error deleting teacher");
    }
  }
);

router.get("/export-csv", verifyToken, async (req, res) => {
  try {
    const filePath = await teacherService.exportCSV();
    res.download(filePath, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error sending file");
      }
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    console.error("Error exporting CSV:", error);
    res.status(500).send("An error occurred while exporting the CSV.");
  }
});

router.post("/student", verifyToken, async (req: Request, res: Response) => {
  try {
    const { email, vpnId } = req.body;
    if (!email) {
      return res.status(400).send("Missing email parameter");
    }
    const newStudent = await teacherService.createStudent(email, vpnId);
    res.status(201).send(newStudent);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating student");
  }
});

router.delete(
  "/student/:email",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const email = req.params.email;
      if (!email) {
        return res.status(400).send("Missing email parameter");
      }
      const message = await teacherService.deleteStudentByEmail(email);
      res.send(message);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error deleting student");
    }
  }
);
export default router;
