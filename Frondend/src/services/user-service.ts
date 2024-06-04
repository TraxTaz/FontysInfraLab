import axios from "axios";
import { TableRow } from "../types/table-row";
import { TeacherTableRow } from "../types/teacher-table-row";

const API_URL = import.meta.env.VITE_API_URL;

export async function getAll(): Promise<TableRow[]> {
  const response = await axios.get<TableRow[]>(`${API_URL}teacher/main`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("Access_token")}`,
      }
    }
  );
  return response.data;
}

export async function getFile(email: string) {
  const response = await axios.post(
    `${API_URL}user/get_file`,
    { email },
    { responseType: "blob", headers: {
      Authorization: `Bearer ${sessionStorage.getItem("Access_token")}`
    } },
  );

  const blob = new Blob([response.data], {
    type: response.headers["content-type"],
  });

  return window.URL.createObjectURL(blob);
}

export async function exportCSV() {
  const response = await axios.get(
    `${API_URL}teacher/export-csv`,
    { responseType: "blob", headers: {
      Authorization: `Bearer ${sessionStorage.getItem("Access_token")}`
    } },
  );

  const blob = new Blob([response.data], {
    type: response.headers["content-type"],
  });

  return window.URL.createObjectURL(blob);
}

export async function importCSV(file: File, updateExisting: boolean) {
  const formData = new FormData()
  formData.append('file', file)
  const config = {
    headers: {
      "Content-Type": "multipart/form-data",
      "Authorization": `Bearer ${sessionStorage.getItem("Access_token")}`
    }
  }
  const response = await axios.post(
    `${API_URL}teacher/import-csv/${updateExisting}`,
    formData,
    config
  );

  return response;
}

export async function getFontysUser() {
  const response = await axios.get("https://api.fhict.nl/people/me", {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
    },
  });

  return response.data;
}

export async function updateUser(email: string, vpnId: string, oldEmail: string, oldVpnId: string) {
  const response = await axios.put(`${API_URL}teacher/users`,
    { vpnid: vpnId, email: email, oldEmail: oldEmail, oldVpnId: oldVpnId },
    {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("Access_token")}`
      }
    })
  return response;
}

export async function updateTeacher(email: string, oldEmail: string) {
  const response = await axios.put(`${API_URL}teacher/teachers`,
    { newEmail: email, oldEmail: oldEmail },
    {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("Access_token")}`
      }
    })
  return response;
}

export async function getAllTeachers(): Promise<TeacherTableRow[]> {
  const response = await axios.get<TeacherTableRow[]>(`${API_URL}teacher/teachers`,
  {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem("Access_token")}`
    }
  });
  return response.data;
}

export async function deleteTeacher(email: string) {
  const response = await axios.delete(`${API_URL}teacher/teachers/${email}`,
  {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem("Access_token")}`
    }
  })
  return response;
}

export async function addTeacher(email: string) {
  const response = await axios.post(`${API_URL}teacher/teachers`,
    { email: email },
    {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("Access_token")}`
      }
    }
  )
  return response;
}

