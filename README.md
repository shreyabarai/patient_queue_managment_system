# 🏥 Patient Queue Management System

A modern **Patient Queue Management System** built to streamline hospital and clinic operations by managing patient registrations, doctor queues, announcements, and real-time queue monitoring. The system provides dedicated interfaces for staff, administrators, and display screens to improve patient flow and reduce waiting times.

## 🚀 Features

### 👨‍⚕️ Patient Management

* Patient registration and token generation
* Queue assignment based on doctor availability
* Real-time patient status tracking
* Priority-based queue handling

### 🩺 Doctor Management

* Doctor profile and specialty management
* Doctor status monitoring
* Queue allocation for individual doctors
* Counter/room assignment

### 📢 Announcements & Display

* Live queue display dashboard
* Audio announcements for patient calls
* Multilingual support
* Hospital-wide announcements

### 👨‍💼 Staff Dashboard

* Register new patients
* Manage patient queues
* Monitor doctor availability
* Generate and update announcements

### 📊 Admin Dashboard

* Queue analytics and reporting
* Daily patient footfall tracking
* Average waiting time analysis
* Doctor-wise statistics and performance insights

---

## 🛠️ Tech Stack

### Frontend

* React.js
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* React Router

### Backend & Database

* Supabase
* PostgreSQL

### Additional Libraries

* React Query
* Lucide React Icons
* Date-fns
* Radix UI Components

---

## 📂 Project Structure

```plaintext
src/
├── components/
│   ├── staff/
│   ├── ui/
│   ├── DoctorQueuePanel.tsx
│   ├── AnnouncementsPanel.tsx
│   └── LanguageSelector.tsx
│
├── pages/
│   ├── Index.tsx
│   ├── Auth.tsx
│   ├── Staff.tsx
│   ├── Admin.tsx
│   └── Display.tsx
│
├── hooks/
├── integrations/
├── lib/
└── assets/
```

---

## 🎯 System Workflow

1. Staff registers a patient.
2. A queue token is generated automatically.
3. Patient is assigned to the appropriate doctor queue.
4. Doctors attend patients according to queue order.
5. Queue updates are reflected instantly on the display screen.
6. Audio announcements notify patients when their turn arrives.
7. Administrators can monitor analytics and hospital operations.

---

## ✨ Key Highlights

* Real-time queue monitoring
* Secure staff authentication
* Interactive dashboard
* Live display screen for patients
* Audio-based queue announcements
* Multilingual support
* Analytics and reporting module

---

## 📸 Modules

* Home Page
* Staff Login
* Patient Registration
* Queue Management
* Doctor Management
* Live Display Board
* Announcement Management
* Analytics Dashboard

---

## 🔮 Future Enhancements

* SMS/WhatsApp Notifications
* Appointment Booking System
* AI-Based Waiting Time Prediction
* Patient Medical Records Integration
* Mobile Application Support
* Multi-Hospital Deployment

---

## 📜 License

This project is developed for academic, learning, and demonstration purposes.

---

### ⭐ Project Description

A comprehensive healthcare queue management solution that enables hospitals and clinics to efficiently manage patient flow through real-time queue tracking, doctor management, multilingual announcements, and analytics-driven administration. Built using **React, TypeScript, Supabase, and Tailwind CSS** for a modern and scalable user experience.

