import { useEffect, useState } from "react";
import { getAllTeachers } from "../services/user-service";
import  TeachersTable  from "../components/teachers-table";
import { TeacherTableRow } from "../types/teacher-table-row";

export default function TeachersPage() {
  const [data, setData] = useState<TeacherTableRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await getAllTeachers();
      setData(response);
    };

    fetchData();
  }, []);

  return <TeachersTable tableData = {data}/>;
}