import { RowDataPacket } from "mysql2";

export interface UserConfigFile extends RowDataPacket {
  certificateAuthority: string;
  privateKey: string;
  certificate: string;
  description: string;
  dataCiphers: string;
  dataCiphersFallback: string;
  tlsStaticKey: string;
  devMode: string;
  digest: string;
  localPort: string;
  protocol: string;
}
