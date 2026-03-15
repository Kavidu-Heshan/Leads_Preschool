import React from "react";

import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "../pages/HomePage";  
import AdminAddChild from "../admin_pages/AdminAddChild";
import ChildEnroll from "../pages/ChildEnroll";
import ChangePassword from "../components/ChangePassword";
import StudentProfileForm from "../pages/StudentProfileForm";

function App() {
  return (
    <div className="p-4">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/adminaddchild" element={<AdminAddChild />} />
          <Route path="/childenroll" element={<ChildEnroll />} />
          <Route path="/changepwd" element={<ChangePassword />} />
          <Route path="/studentprofileform" element={<StudentProfileForm />} />

        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App;
