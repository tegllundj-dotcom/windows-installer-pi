# 📝 Simple To-Do List Web Application

A clean, modern to-do list application built with vanilla HTML, CSS, and JavaScript. Stay organized with your tasks using this simple and intuitive interface.

![To-Do List Application](https://github.com/user-attachments/assets/d73102f1-2b1e-4120-bfde-7a4d608cf7b1)

## 🚀 Features

- **Add Tasks**: Quickly add new to-do items using the input field
- **Mark as Complete**: Click checkboxes to mark tasks as completed with visual feedback
- **Delete Tasks**: Remove tasks you no longer need with the delete button
- **Persistent Storage**: All tasks are automatically saved in browser's localStorage
- **Task Statistics**: View total tasks and completed tasks count
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Clean UI**: Modern, intuitive interface with smooth animations

## 🛠️ Setup and Installation

### Quick Start
1. Clone or download this repository
2. Open `index.html` in any modern web browser
3. Start adding your tasks!

### Local Development Server (Optional)
For development or testing purposes, you can run a local server:

```bash
# Using Python 3
python3 -m http.server 8080

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8080
```

Then open `http://localhost:8080` in your browser.

## 📁 File Structure

```
├── index.html      # Main HTML file
├── styles.css      # CSS styling and responsive design
├── script.js       # JavaScript functionality
└── README.md       # This file
```

## 🎯 How to Use

### Adding Tasks
1. Type your task in the "Add a new task..." input field
2. Click the "Add Task" button or press Enter
3. Your task will appear in the list below

### Managing Tasks
- **Complete a Task**: Click the checkbox next to any task to mark it as completed
- **Delete a Task**: Click the red "Delete" button to remove a task permanently
- **View Statistics**: See your progress at the bottom (total tasks and completed count)

### Data Persistence
- Tasks are automatically saved to your browser's localStorage
- Your tasks will persist even after closing and reopening the browser
- Data is stored locally and never sent to external servers

## 🎨 Design Features

### Visual Elements
- **Modern Gradient Background**: Eye-catching purple gradient backdrop
- **Card-based Layout**: Clean white container with rounded corners and shadow
- **Color-coded States**: 
  - Regular tasks: Light gray background
  - Completed tasks: Green background with strikethrough text
- **Smooth Animations**: Subtle hover effects and transitions

### Responsive Design
- **Desktop**: Horizontal form layout with side-by-side input and button
- **Mobile**: Vertical form layout with stacked elements
- **Adaptive**: Automatically adjusts to screen size for optimal viewing

## 🔧 Technical Details

### Technologies Used
- **HTML5**: Semantic markup structure
- **CSS3**: Modern styling with flexbox, gradients, and animations
- **Vanilla JavaScript**: No external dependencies or frameworks
- **LocalStorage API**: Browser-based data persistence

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Code Features
- **ES6+ JavaScript**: Modern JavaScript syntax and features
- **Responsive CSS**: Mobile-first design approach
- **Accessible**: Semantic HTML structure for screen readers
- **Security**: XSS protection with HTML escaping

## 🧪 Testing

The application has been manually tested for:

### ✅ Functionality Tests
- [x] Adding new tasks via button click
- [x] Adding new tasks via Enter key
- [x] Marking tasks as completed
- [x] Unmarking completed tasks
- [x] Deleting tasks with animation
- [x] Task statistics updating correctly
- [x] Empty state display when no tasks

### ✅ Persistence Tests
- [x] Tasks saved to localStorage automatically
- [x] Tasks restored correctly after page refresh
- [x] Completed status maintained after reload
- [x] Task order preserved

### ✅ UI/UX Tests
- [x] Responsive design on mobile devices
- [x] Hover effects and animations working
- [x] Visual feedback for completed tasks
- [x] Clean, intuitive interface
- [x] Proper spacing and typography

## 🤝 Contributing

This is a simple educational project, but feel free to:
1. Fork the repository
2. Make your improvements
3. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.