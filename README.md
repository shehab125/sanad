# Sanad Student Services Platform

This repository contains the source code for **Sanad**, a student services marketplace and community platform built with React, Vite and Supabase.  
It enables students to buy and sell books, notes and tools, book sessions with tutors, search for nearby housing, chat with other users, receive notifications, leave reviews and much more.

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <your-fork-url>
   cd sanad-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Copy the `.env.example` file to `.env` and populate it with your Supabase and Cloudinary credentials.  
   These values are required to connect the application to your Supabase project and to upload media to Cloudinary.
   ```bash
   cp .env.example .env
   # then edit .env
   ```

4. **Apply the database schema**
   Open your Supabase SQL editor and run the SQL in `supabase_schema.sql` to create the required tables.  
   Make sure to enable Row Level Security and create policies appropriate to your app's access requirements.

5. **Run the app**
   ```bash
   npm run dev
   ```
   Vite will start a development server (default on port 5173) and you can view the app in your browser.

## Features Implemented

This project provides a complete skeleton for the Sanad platform:

- **Authentication** – Sign up, login, logout, session persistence using Supabase Auth.
- **Profiles** – Users can view and edit their profile information (name, university, faculty, avatar).
- **Books** – Create listings, browse books, view details, upload multiple images, add to favourites and chat with sellers.
- **Notes** – Upload PDF notes, browse and preview notes, download or purchase them, rate notes and add to favourites.
- **Tutors** – Teachers can register themselves as tutors, set subjects and rates, students can view tutor profiles and book sessions.
- **Housing** – Users can list housing (rooms, flats), browse on map and list view, contact owners and save favourite listings.
- **Tools** – Sell and buy study tools and equipment.
- **Chat** – Real‑time messaging between users with support for text, images and location sharing.
- **Notifications** – Receive real‑time notifications for new messages, purchases, bookings and ratings.
- **Ratings** – Leave 1–5 star reviews on sellers, tutors, housing and tools.
- **Search** – Global search across all resources with advanced filtering.
- **Admin dashboard** – Manage users and content, moderate listings, view reports and statistics.
- **AI features** – Basic recommendations and smart search (e.g. trending items, personalised suggestions).

All database interactions are implemented through the [Supabase JavaScript client](https://supabase.com/docs/reference/javascript/start).  
Media uploads are handled via [Cloudinary unsigned uploads](https://cloudinary.com/documentation/upload_images#unsigned_upload).

## Next Steps

The current version provides a complete baseline for the platform.  
You may wish to extend it by adding payment integration, more sophisticated recommendation algorithms, push notifications, mobile support or other enhancements.

Feel free to customise the UI, add new modules or integrate with other services to suit your particular needs.
