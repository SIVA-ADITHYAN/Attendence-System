import axios from 'axios';
import API_BASE_URL from '../config';

// Python Flask face-recognition service base URL (MediaPipe Face Mesh)
// Override with VITE_FACE_API_URL env var if the Flask server runs on a different host/port
// const FACE_API_BASE = import.meta.env.VITE_FACE_API_URL || 'https://attendence-system-zg1v.onrender.com';

// On Android/mobile, localhost means the device itself — not your PC.
// Set VITE_API_BASE_URL in your .env file to your PC's local IP, e.g.:
//   VITE_API_BASE_URL=http://192.168.1.5:8080
// For web dev, leave it unset and the Vite proxy will handle /api calls.
const BASE_URL = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api`
    : `${API_BASE_URL}/api`;

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- 👇 NEW: JWT AXIOS INTERCEPTOR 👇 ---
// This is your frontend's "Security Attachment System"
api.interceptors.request.use(
    (config) => {
        // 1. Grab the token that we saved in Local Storage during Login
        const token = localStorage.getItem('token');
        
        // 2. If it's there, staple it to the 'Authorization' header
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
// ----------------------------------------

// Student APIs
export const studentAPI = {
    getAll: (page = 0, size = 10) => api.get(`/students?page=${page}&size=${size}`),
    getById: (id) => api.get(`/students/${id}`),
    getActive: () => api.get('/students/active'),
    getByCoachingCentre: (centreId, page = 0, size = 1000) =>
        api.get(`/students/coaching-centre/${centreId}?page=${page}&size=${size}`),
    getByTutor: (tutorId) => api.get(`/students/tutor/${tutorId}`),
    getByBatch: (batchName) => api.get(`/students/batch/${batchName}`),
    create: (student) => api.post('/students', student),
    update: (id, student) => api.put(`/students/${id}`, student),
    delete: (id) => api.delete(`/students/${id}`),
    registerFingerprint: (id, template) => api.post(`/students/${id}/register-fingerprint`, { template }),
    uploadExcel: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/students/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

// Attendance APIs
export const attendanceAPI = {
    getAll: () => api.get('/attendance'),
    getById: (id) => api.get(`/attendance/${id}`),
    getByStudent: (studentId) => api.get(`/attendance/student/${studentId}`),
    getByTutor: (tutorId) => api.get(`/attendance/tutor/${tutorId}`),
    getByDate: (date) => api.get(`/attendance/date/${date}`),
    getByDateAndCoachingCentre: (coachingCentreId, date) => 
        api.get(`/attendance/coaching-centre/${coachingCentreId}/date/${date}`),
    getByStatus: (status) => api.get(`/attendance/status/${status}`),
    getByDateRange: (studentId, startDate, endDate) =>
        api.get(`/attendance/student/${studentId}/range?startDate=${startDate}&endDate=${endDate}`),
    create: (attendance) => api.post('/attendance', attendance),
    update: (id, attendance) => api.put(`/attendance/${id}`, attendance),
    delete: (id) => api.delete(`/attendance/${id}`),
    checkOut: (id) => api.post(`/attendance/${id}/checkout`),
    faceCheckIn: (studentId, tutorId) => api.post('/attendance/face-checkin', { studentId, tutorId }),
    fingerprintCheckIn: (studentId) => api.post('/attendance/fingerprint-checkin', { studentId }),
    getStats: (coachingCentreId) => api.get(`/attendance/coaching-centre/${coachingCentreId}/stats`),
    getRecent: (coachingCentreId) => api.get(`/attendance/coaching-centre/${coachingCentreId}/recent`),
    getTutorStats: (tutorId) => api.get(`/attendance/tutor/${tutorId}/stats`),
    getTutorRecent: (tutorId) => api.get(`/attendance/tutor/${tutorId}/recent`),
    getRange: (centreId, start, end) => api.get(`/attendance/coaching-centre/${centreId}/range?start=${start}&end=${end}`),
    getTutorRange: (tutorId, start, end) => api.get(`/attendance/tutor/${tutorId}/range?start=${start}&end=${end}`),
};

// Face Recognition APIs  — routed through Spring Boot proxy → Flask/MediaPipe
// (Direct browser→Flask calls were blocked by CORS; Spring Boot proxies server-side)
const faceAxios = api;  // reuse main api instance — same base URL + JWT interceptor

export const faceAPI = {
    // Register a face — single image
    register: (studentId, image) =>
        faceAxios.post('/face/register', { studentId, image }),

    // Register a face — multiple burst images (better accuracy)
    registerFused: (studentId, images) =>
        faceAxios.post('/face/register', { studentId, images }),

    // Recognize from a single frame
    recognize: (image) =>
        faceAxios.post('/face/recognize', { image }),

    // Recognize using multi-frame fusion (most accurate)
    recognizeFused: (images) =>
        faceAxios.post('/face/recognize/fused', { images }),

    // Health-check the Flask service (via Spring Boot proxy)
    health: () => faceAxios.get('/face/health'),
};

// User APIs
export const userAPI = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    getByEmail: (email) => api.get(`/users/email/${email}`),
    create: (user) => api.post('/users', user),
    update: (id, user) => api.put(`/users/${id}`, user),
    delete: (id) => api.delete(`/users/${id}`),
};

// Notification APIs
export const notificationAPI = {
    getTutorNotifications: (tutorId) => api.get(`/notifications/tutor/${tutorId}`),
    getUnread: (tutorId) => api.get(`/notifications/tutor/${tutorId}/unread`),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
};

// --- Auth APIs ---
// These talk to the endpoints we just secured in Spring Boot!
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (details) => api.post('/auth/register', details),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    verifyOtp: (data) => api.post('/auth/verify-otp', data),
    resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Coaching Centre APIs
export const coachingCentreAPI = {
    getAll: () => api.get('/coaching-centres'),
    getById: (id) => api.get(`/coaching-centres/${id}`),
    getActive: () => api.get('/coaching-centres/active'),
    create: (centre) => api.post('/coaching-centres', centre),
    update: (id, centre) => api.put(`/coaching-centres/${id}`, centre),
    delete: (id) => api.delete(`/coaching-centres/${id}`),
};

export default api;
