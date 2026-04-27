// components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedUserTypes = ["child", "teacher"] }) => {
  // Check for child login
  const childData = localStorage.getItem("currentChild") || sessionStorage.getItem("currentChild");
  const teacherData = localStorage.getItem("currentTeacher") || sessionStorage.getItem("currentTeacher");
  
  let isAuthenticated = false;
  let userType = null;
  
  if (childData) {
    JSON.parse(childData);
    isAuthenticated = true;
    userType = "child";
  } else if (teacherData) {
    JSON.parse(teacherData);
    isAuthenticated = true;
    userType = "teacher";
  }
  
  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/childenroll" replace />;
  }
  
  // Check if user type is allowed for this route
  if (!allowedUserTypes.includes(userType)) {
    // Redirect based on user type
    if (userType === "child") {
      return <Navigate to="/childdashboard" replace />;
    } else if (userType === "teacher") {
      return <Navigate to="/adminhome" replace />;
    }
    return <Navigate to="/childenroll" replace />;
  }
  
  return children;
};

export default ProtectedRoute;