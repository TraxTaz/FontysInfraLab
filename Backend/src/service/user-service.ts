import { dbConnection } from "../db/db";
import fs from "fs";
import path from "path";
import { UserConfigFile } from "../model/user-config";
import { User } from "../model/user";

export class UserService {
  async getFile(email: string): Promise<string> {
    try {
      const connection = await dbConnection;
      const query = `
        SELECT
            users.email,
            ca.cert as certificateAuthority,
            certificates.prvkey as privateKey,
            certificates.cert as certificate,
            certificates.descr as description,
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
        WHERE
            users.email = ?
        `;

      //Used parameterized queries
      const rows = await new Promise<UserConfigFile[]>((resolve, reject) => {
        connection.query<UserConfigFile[]>(query, [email], (err, rows) => {
          //Error handling to make sure not to leak sensitive info
          if (err) {
            reject(err);
          } else if (rows.length === 0) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });

      const {
        certificateAuthority,
        privateKey,
        certificate,
        description,
        dataCiphers,
        dataCiphersFallback,
        tlsStaticKey,
        devMode,
        digest,
        localPort,
        protocol,
      } = rows[0];

      const openvpnConfig =
        `dev ${devMode}\npersist-tun\npersist-key\n` +
        `data-ciphers ${dataCiphers}\ndata-ciphers-fallback ${dataCiphersFallback}\n` +
        `auth ${digest}\ntls-client\nclient\nresolv-retry infinite\n` +
        `remote 145.220.75.91 ${localPort} ${protocol.toLowerCase()}\nnobind\n` +
        `verify-x509-name "${description}" name\nauth-user-pass\nremote-cert-tls server\n` +
        `explicit-exit-notify\n\n<ca>\n${certificateAuthority}</ca>\n<cert>\n` +
        `${certificate}</cert>\n<key>\n${privateKey}</key>\nkey-direction 1\n` +
        `<tls-auth>\n${tlsStaticKey}</tls-auth>`;

      const filePath = path.join(__dirname, "openvpn_config.ovpn");

      // Check if the directory exists and is writable
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }

      // Write the file
      fs.writeFileSync(filePath, openvpnConfig);

      // Check if the file was written successfully
      if (!fs.existsSync(filePath)) {
        throw new Error("Error writing OpenVPN config file");
      }

      return filePath;
    } catch (err) {
      throw new Error("Error querying database");
    }
  }

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const connection = await dbConnection;
      return new Promise((resolve, reject) => {
        connection.query<User[]>(
          "SELECT email FROM users WHERE email = ? UNION ALL SELECT email FROM Teacher WHERE email = ?",
          [email, email],
          (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows.length > 0);
            }
          }
        );
      });
    } catch (err) {
      throw new Error("Error querying database");
    }
  }
}
