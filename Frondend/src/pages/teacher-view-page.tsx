import { useEffect, useState } from "react";
import { getAll } from "../services/user-service";
import  TeacherTable  from "../components/teacher-view-table";
import { TableRow } from "../types/table-row";

export default function TeacherPage() {
  const [data, setData] = useState<TableRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await getAll();
      setData(response);
    };

    fetchData();
  }, []);

  return <TeacherTable tableData = {data}/>;
}