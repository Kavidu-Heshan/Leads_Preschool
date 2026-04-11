// utils/auth.js
export const logout = () => {
  localStorage.removeItem("currentChild");
  localStorage.removeItem("currentTeacher");
  window.location.href = "/childenroll";
};

export const getCurrentUser = () => {
  const childData = localStorage.getItem("currentChild");
  const teacherData = localStorage.getItem("currentTeacher");
  
  if (childData) {
    return { ...JSON.parse(childData), userType: "child" };
  } else if (teacherData) {
    return { ...JSON.parse(teacherData), userType: "teacher" };
  }
  return null;
};

export const isAuthenticated = () => {
  return !!(localStorage.getItem("currentChild") || localStorage.getItem("currentTeacher"));
};