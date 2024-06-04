import { dbConnection } from "../db/db";
import { User } from "../model/user";
import { UserConfigFile } from "../model/user-config";
import { Teacher } from "../model/teacher";
import fs from "fs";
import { parse } from "csv-parse";
import { exec } from "child_process";
import path from "path";

export class TeacherService {
  async getUsers(): Promise<User[]> {
    try {
      const connection = await dbConnection;
      return new Promise((resolve, reject) => {
        connection.query<User[]>("SELECT * FROM users", (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    } catch (err) {
      throw new Error("Error querying database");
    }
  }

  async updateUser(
    email: string,
    vpnId: string,
    oldEmail: string,
    oldVpnId: string
  ) {
    try {
      const connection = await dbConnection;
      const sql =
        "UPDATE users SET email = ?, vpnid = ? WHERE vpnid = ? AND email = ?";
      const data = [email, vpnId, oldVpnId, oldEmail];
      return new Promise((resolve, reject) => {
        connection.query(sql, data, (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        });
      });
    } catch (err) {
      throw new Error("Error updating user");
    }
  }

  async teacherTable(): Promise<string> {
    try {
      const connection = await dbConnection;
      const query = `
        SELECT
            users.*,
            ca.cert as certificateAuthority,
            certificates.prvkey as privateKey,
            certificates.cert as certificate,
            certificates.descr as description,
            certificates.type as type,
            openvpn_config.data_ciphers as dataCiphers,
            openvpn_config.data_ciphers_fallback as dataCiphersFallback,
            openvpn_config.tls as tlsStaticKey,
            openvpn_config.dev_mode as devMode,
            openvpn_config.digest as digest,
            openvpn_config.localport as localPort,
            openvpn_config.protocol as protocol
        FROM
            users
        INNER JOIN
            openvpn_config ON users.vpnid = openvpn_config.vpnid
        INNER JOIN
            ca ON openvpn_config.caref = ca.refid
        INNER JOIN
            certificates ON openvpn_config.description = certificates.descr
        `;

      return new Promise((resolve, reject) => {
        connection.query<UserConfigFile[]>(query, (err, rows) => {
          if (err) {
            reject(err);
          } else if (rows.length === 0) {
            reject(new Error("User not found"));
          } else {
            resolve(JSON.stringify(rows));
          }
        });
      });
    } catch (err) {
      throw new Error("Error querying database");
    }
  }

  async importCSV(filePath: string, updateExisting: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      let lineNumber = 0;
      fs.createReadStream(filePath)
        .pipe(parse({ delimiter: "," }))
        .on("data", async (row) => {
          lineNumber++;

          if (lineNumber === 1) {
            return;
          }
          try {
            const connection = await dbConnection;
            const email = row[0];
            const vpnId = row[1];

            if (!email || !vpnId) {
              console.warn(`Missing required columns on line ${lineNumber}`);
              return;
            }

            if (updateExisting) {
              const [rows] = await connection
                .promise()
                .query<User[]>(`SELECT * FROM users WHERE email = ?`, [email]);
              if (rows.length > 0) {
                await connection
                  .promise()
                  .query(`UPDATE users SET vpnid = ? WHERE email = ?`, [
                    vpnId,
                    email,
                  ]);
              } else {
                await connection
                  .promise()
                  .query(`INSERT INTO users (email, vpnid) VALUES (?, ?)`, [
                    email,
                    vpnId,
                  ]);
              }
            } else {
              await connection.promise().query(`DELETE FROM users`);
              await connection
                .promise()
                .query(`INSERT INTO users (email, vpnid) VALUES (?, ?)`, [
                  email,
                  vpnId,
                ]);
            }
          } catch (error) {
            console.error("Error processing row:", error);
            reject(error);
          }
        })
        .on("end", () => {
          resolve();
        });
    });
  }

  async runScript(scriptName: string) {
    return new Promise((resolve, reject) => {
      exec(
        `python3 /home/student/${scriptName}.py`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            reject(error);
          } else {
            resolve(stdout);
          }
        }
      );
    });
  }

  async createTeacher(email: string): Promise<string> {
    try {
      const connection = await dbConnection;
      return new Promise((resolve, reject) => {
        connection.query<Teacher[]>(
          "INSERT INTO Teacher (email) VALUES (?)",
          [email],
          (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve("New teacher created with email: " + email);
            }
          }
        );
      });
    } catch (err) {
      throw new Error("Error creating teacher");
    }
  }

  async getAllTeachers(): Promise<any[]> {
    try {
      const connection = await dbConnection;
      return new Promise((resolve, reject) => {
        connection.query<Teacher[]>("SELECT * FROM Teacher", (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    } catch (err) {
      throw new Error("Error fetching teachers");
    }
  }

  async updateTeacherEmail(
    newEmail: string,
    oldEmail: string
  ): Promise<string> {
    try {
      const connection = await dbConnection;
      return new Promise((resolve, reject) => {
        connection.query<Teacher[]>(
          "UPDATE Teacher SET email =? WHERE email =?",
          [newEmail, oldEmail],
          (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve("Teacher email updated.");
            }
          }
        );
      });
    } catch (err) {
      throw new Error("Error updating teacher email");
    }
  }

  async deleteTeacherByEmail(email: string): Promise<string> {
    try {
      const connection = await dbConnection;
      return new Promise((resolve, reject) => {
        connection.query<Teacher[]>(
          "DELETE FROM Teacher WHERE email =?",
          [email],
          (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve("Teacher deleted with email: " + email);
            }
          }
        );
      });
    } catch (err) {
      throw new Error("Error deleting teacher");
    }
  }

  async exportCSV(): Promise<any> {
    try {
      const users = await this.getUsers();
      if (!Array.isArray(users)) {
        throw new Error("Query did not return an array");
      }

      let csvData = "email,vpnid\n";

      users.forEach((user) => {
        csvData += `${user.email},${user.vpnid}\n`;
      });

      const filePath = path.join(__dirname, "users_export.csv");
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }

      fs.writeFileSync(filePath, csvData);

      // Check if the file was written successfully
      if (!fs.existsSync(filePath)) {
        throw new Error("Error generating export file");
      }

      return filePath;
    } catch (error) {
      console.error("Error exporting CSV:", error);
      return "Error exporting CSV";
    }
  }

  async createStudent(email: string, vpnId: number): Promise<string> {
    try {
      const connection = await dbConnection;
      return new Promise((resolve, reject) => {
        connection.query<User[]>(
          "INSERT INTO users (email,vpnid) VALUES (?,?)",
          [email, vpnId],
          (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve("New student created with email: " + email);
            }
          }
        );
      });
    } catch (err) {
      throw new Error("Error creating student");
    }
  }

  async deleteStudentByEmail(email: string): Promise<string> {
    try {
      const connection = await dbConnection;
      return new Promise((resolve, reject) => {
        connection.query<User[]>(
          "DELETE FROM users WHERE email =?",
          [email],
          (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve("Student deleted with email: " + email);
            }
          }
        );
      });
    } catch (err) {
      throw new Error("Error deleting student");
    }
  }
}
