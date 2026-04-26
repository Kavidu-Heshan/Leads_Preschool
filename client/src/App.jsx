import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import AuthCheck from "../components/AuthCheck";

// Import all your components
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
import Message from "../pages/Message";
import AdminMessage from "../admin_pages/AdminMessage";
import AdminHome from "../admin_pages/AdminHome";
import HomePagelog from "../pages/HomePagelog";
import PhotoDownload from "../pages/PhotoDownload";
import QRScanner from "../admin_pages/QRScanner";
import AdminStudentManagement from "../admin_pages/AdminStudentManagement";
import QRCodeGenerator from "../admin_pages/QRCodeGenerator";
import WorksheetUpload from "../admin_pages/WorksheetUpload";
import StudentWorksheets from "../pages/StudentWorksheets";

function App() {
  return (
    <div className="p-4">
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePagelog />} />
          <Route 
            path="/childenroll" 
            element={
              <AuthCheck>
                <ChildEnroll />
              </AuthCheck>
            } 
          />
          
          {/* Child Protected Routes */}
          <Route 
            path="/changepwd" 
            element={
              <ProtectedRoute allowedUserTypes={["child", "teacher"]}>
                <ChangePassword />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/studentworksheets" 
            element={
              <ProtectedRoute allowedUserTypes={["child"]}>
                <StudentWorksheets />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/childdashboard" 
            element={
              <ProtectedRoute allowedUserTypes={["child"]}>
                <ChildDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/studentprofileform" 
            element={
              <ProtectedRoute allowedUserTypes={["child"]}>
                <StudentProfileForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/studentprofileManagement" 
            element={
              <ProtectedRoute allowedUserTypes={["child"]}>
                <StudentProfileManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/userevent" 
            element={
              <ProtectedRoute allowedUserTypes={["child"]}>
                <UserEventsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher" 
            element={
              <ProtectedRoute allowedUserTypes={["child"]}>
                <TeacherDirectory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/message" 
            element={
              <ProtectedRoute allowedUserTypes={["child"]}>
                <Message />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/photodownload" 
            element={
              <ProtectedRoute allowedUserTypes={["child"]}>
                <PhotoDownload />
              </ProtectedRoute>
            } 
          />
          
          {/* Teacher/Admin Protected Routes */}
          <Route 
            path="/adminhome" 
            element={
              <ProtectedRoute allowedUserTypes={["teacher"]}>
                <AdminHome />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/adminworksheetupload" 
            element={
              <ProtectedRoute allowedUserTypes={["teacher"]}>
                <WorksheetUpload />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/adminaddchild" 
            element={
              <ProtectedRoute allowedUserTypes={["teacher"]}>
                <AdminAddChild />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/adminevent" 
            element={
              <ProtectedRoute allowedUserTypes={["teacher"]}>
                <EventCreationPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admineditevent" 
            element={
              <ProtectedRoute allowedUserTypes={["teacher"]}>
                <AdminEventManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/adminteachermanagement" 
            element={
              <ProtectedRoute allowedUserTypes={["teacher"]}>
                <AdminTeacherManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/addDaycare" 
            element={
              <ProtectedRoute allowedUserTypes={["child"]}>
                <DaycarePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admindaycaredashboard" 
            element={
              <ProtectedRoute allowedUserTypes={["teacher"]}>
                <AdminDaycareDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/uploadPhoto" 
            element={
              <ProtectedRoute allowedUserTypes={["teacher"]}>
                <EventPhotoUpload />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/adminmessage" 
            element={
              <ProtectedRoute allowedUserTypes={["teacher"]}>
                <AdminMessage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/qrscanner" 
            element={
              <ProtectedRoute allowedUserTypes={["teacher"]}>
                <QRScanner />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/qrcodegenerator" 
            element={
              <ProtectedRoute allowedUserTypes={["teacher"]}>
                <QRCodeGenerator />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/adminStudentManagement" 
            element={
              <ProtectedRoute allowedUserTypes={["teacher"]}>
                <AdminStudentManagement />
              </ProtectedRoute>
            } 
          />
          
          {/* Routes accessible by both child and teacher */}
          <Route 
            path="/userhome" 
            element={
              <ProtectedRoute allowedUserTypes={["child", "teacher"]}>
                <HomePage />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/childenroll" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;