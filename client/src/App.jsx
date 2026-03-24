import React from "react";

import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "../pages/HomePage";  
import AdminAddChild from "../admin_pages/AdminAddChild";
import ChildEnroll from "../pages/ChildEnroll";
import ChangePassword from "../components/ChangePassword";
import StudentProfileManagement from "../pages/StudentProfileManagement";
import ChildDashboard from "../pages/ChildDashboard";
import EventCreationPage from "../admin_pages/EventCreationPage";
import UserEventsPage from "../pages/UserEventsPage";
import AdminEventManagement from "../admin_pages/AdminEventManagement";
import AdminTeacherManagement from "../admin_pages/AdminTeacherManagement";
import StudentProfileForm from "../pages/StudentProfileForm";
import TeacherDirectory from "../pages/TeacherDirectory";
import DaycarePage from "../pages/DaycarePage";
import AdminDaycareDashboard from "../admin_pages/AdminDaycareDashboard";
import EventPhotoUpload from "../admin_pages/EventPhotoUpload";
import Message from "../pages/message";
import AdminMessage from "../admin_pages/AdminMessage";
import AdminHome from "../admin_pages/AdminHome";
import HomePagelog from "../pages/HomePagelog";
import PhotoDownload from "../pages/PhotoDownload";

function App() {
  return (
    <div className="p-4">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePagelog />} />
          <Route path="/userhome" element={<HomePage />} />
          <Route path="/adminaddchild" element={<AdminAddChild />} />
          <Route path="/childenroll" element={<ChildEnroll />} />
          <Route path="/changepwd" element={<ChangePassword />} />
          <Route path="/studentprofileform" element={<StudentProfileForm />} />
          <Route path="/studentprofileManagement" element={<StudentProfileManagement />} />
          <Route path="/childdashboard" element={<ChildDashboard />} />
          <Route path="/adminevent" element={<EventCreationPage />} />
          <Route path="/userevent" element={<UserEventsPage />} />
          <Route path="/admineditevent" element={<AdminEventManagement />} />
          <Route path="/adminteachermanagement" element={<AdminTeacherManagement/>} />
          <Route path="/teacher" element={<TeacherDirectory/>} />
          <Route path="/addDaycare" element={<DaycarePage/>} />
          <Route path="/admindaycaredashboard" element={<AdminDaycareDashboard/>} />
          <Route path="/uploadPhoto" element={<EventPhotoUpload/>} />
          <Route path="/message" element={<Message/>} />
          <Route path="/adminmessage" element={<AdminMessage/>} />
          <Route path="/adminhome" element={<AdminHome/>} />
          <Route path="/photodownload" element={<PhotoDownload/>} />


        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App;
