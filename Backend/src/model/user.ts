import { RowDataPacket } from "mysql2";

export interface User extends RowDataPacket {
  email: string;
  vpnid: string;
}
