// import mysql from "mysql2";
// import dotenv from "dotenv";

// dotenv.config();

// const dbServer = {
//   host: process.env.DB_HOST!,
//   port: parseInt(process.env.DB_PORT!, 10),
//   user: process.env.DB_USER!,
//   password: process.env.DB_PASSWORD!,
//   database: process.env.DB_NAME!,
// };

// const dbConnection = mysql.createConnection(dbServer);

// export { dbConnection };

import mysql from "mysql2";
import { Client } from "ssh2";
import dotenv from "dotenv";

dotenv.config();

const dbServer = {
  host: process.env.DB_HOST!,
  port: parseInt(process.env.DB_PORT!, 10),
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
};

const tunnelConfig = {
  host: process.env.SSH_HOST!,
  port: parseInt(process.env.SSH_PORT!, 10),
  username: process.env.SSH_USERNAME!,
  password: process.env.SSH_PASSWORD!,
};

const dbConnection = new Promise<mysql.Connection>((resolve, reject) => {
  const sshClient = new Client();
  sshClient
    .on("ready", () => {
      sshClient.forwardOut(
        dbServer.host,
        dbServer.port,
        dbServer.host,
        dbServer.port,
        (err, stream) => {
          if (err) reject(err);
          const updatedDbServer = {
            ...dbServer,
            stream,
          };
          const connection = mysql.createConnection(updatedDbServer);
          connection.connect((error) => {
            if (error) {
              reject(error);
            }
            resolve(connection);
          });
        }
      );
    })
    .connect(tunnelConfig);
});

export { dbConnection };
