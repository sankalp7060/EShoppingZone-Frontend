<<<<<<< HEAD
# EShoppingZone-Frontend
=======
## 🎨 EShoppingZone - Frontend 

### 🎯 Overview
The frontend of **EShoppingZone** is built as a modern Single Page Application (SPA) using React. It provides a seamless interface for Customers, Merchants, and Admins to interact with the platform.

The UI communicates with backend microservices via REST APIs and delivers a smooth, responsive user experience for browsing products, managing carts, placing orders, handling wallets, and administering the platform.

---

## ⚙️ Tech Stack

- React (Vite)
- React Router DOM
- Axios (API communication)
- Context API (State Management)
- Chart.js (Admin Analytics)
- CSS / Bootstrap / Tailwind (UI Styling)

---

## 🔐 Authentication & Authorization

- User Registration & Login
- JWT-based authentication
- Token stored in `localStorage`
- Role-based access:
  - Customer
  - Merchant
  - Admin
- Protected routes using Private Route wrappers
- Logout functionality with session cleanup

---

## 🏠 Customer Features

### 🛍️ Product Browsing
- View all products (no login required)
- Search products by name
- Filter products by category (Electronics, Books, Apparel, etc.)
- View detailed product information:
  - Price
  - Description
  - Images
  - Ratings & reviews

---

### 🛒 Cart Management
- Add products to cart
- Update quantity of items
- Remove items from cart
- View total cart price (real-time calculation)

---

### 📦 Order Management
- Checkout from cart
- Add/select delivery address
- Select payment method:
  - Cash on Delivery (COD)
  - Wallet Payment
- Order confirmation page
- View order history
- Track order status:
  - Placed
  - Shipped
  - Delivered
  - Cancelled

---

### 💰 Wallet System
- View wallet balance
- Add money to wallet
- Pay using wallet balance
- View transaction history (credits & debits)

---

## 🏪 Merchant Features

- Add new products
- Update existing product details
- Delete products
- View own product listings
- View orders placed for their products

---

## 🛠️ Admin Features

- Dashboard overview
- Manage users:
  - View all users
  - Suspend / Delete users
- Manage orders:
  - View all orders
  - Update order status
- Platform analytics:
  - Total users
  - Total orders
  - Revenue insights
  - Top-selling products (charts)

---

## 🧠 State Management

Using **Context API**:

- `AuthContext`
  - Handles user authentication state
  - Stores user info & token

- `CartContext`
  - Manages cart items
  - Handles add/remove/update operations

---

## 🌐 API Integration

- Axios-based centralized API layer
- Interceptors for:
  - Attaching JWT token
  - Handling unauthorized errors
- Structured service-based API calls:
  - Auth APIs
  - Product APIs
  - Cart APIs
  - Order APIs
  - Wallet APIs

---

## ⚡ UI/UX Features

- Responsive design (mobile + desktop)
- Loading indicators for API calls
- Toast notifications for:
  - Success actions
  - Errors
- Clean and modular component structure

---

## 📁 Project Structure (High-Level)
>>>>>>> ea87a9a ([Sankalp_Agarwal] Add description of EShoppingZone frontend)
