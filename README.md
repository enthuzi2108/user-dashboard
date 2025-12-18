# User Dashboard Application

An Angular application with lazy-loaded components, RxJS state management, and Chart.js visualization.

## Features

- **User Dashboard**: Displays a table of users with Name, Email, and Role columns
- **Dynamic Chart**: Chart.js pie chart showing role distribution (Admin, Editor, Viewer)
- **Lazy Loading**: UserFormComponent and Chart.js are lazy-loaded for optimal performance
- **RxJS State Management**: Uses BehaviorSubject for reactive state updates
- **Real-time Updates**: Table and chart update automatically when users are added
- **Form Validation**: Complete validation for name, email, and role fields
- **Modern UI**: Custom color theme (#383838, #1c4980) with 48px buttons and inputs

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:4200`

## Project Structure

```
src/
├── app/
│   ├── models/
│   │   └── user.model.ts          # User interface and types
│   ├── services/
│   │   └── user.service.ts        # User service with RxJS
│   ├── user-dashboard/
│   │   ├── user-dashboard.component.ts
│   │   ├── user-dashboard.component.html
│   │   ├── user-dashboard.component.css
│   │   └── user-dashboard.module.ts
│   ├── user-form/
│   │   ├── user-form.component.ts
│   │   ├── user-form.component.html
│   │   ├── user-form.component.css
│   │   └── user-form.module.ts
│   ├── app.module.ts
│   ├── app.component.ts
│   └── app-routing.module.ts
├── index.html
└── styles.css
```

## Technologies Used

- Angular 14+
- Chart.js 4.4.0
- RxJS 7.8.0
- TypeScript 4.7.2

## Usage

1. Click "Add User" button to open the user form modal
2. Fill in the Name, Email, and Role fields
3. Click "Add User" to submit the form
4. The table and chart will update automatically with the new user

## Design Theme

- Primary Color: #1c4980
- Secondary Color: #383838
- Button/Input Height: 48px
- Responsive design with mobile support

