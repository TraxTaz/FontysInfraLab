import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/login";
import TeachersPage from "./pages/teachers-page";
import ProtectedRoute from "./pages/protected-route";
import Navbar from "./components/navbar";

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />}></Route>
        <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
          <Route path="/teachers" element={<TeachersPage />}></Route>
        </Route>
        <Route path="*" element={<Login />}></Route>
      </Routes>
    </Router>
  );
}
