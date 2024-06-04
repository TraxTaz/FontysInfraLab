import { RowDataPacket } from "mysql2";

export interface Teacher extends RowDataPacket {
  email: string;
}
